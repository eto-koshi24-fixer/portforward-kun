const { app, BrowserWindow, net, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;

let backendProcess = null;
let mainWindow = null;

// ---------------------------------------------------------------------------
// Custom protocol – file:// では /_next/... の絶対パスが解決できないため
// app:// スキームを登録してフロントエンドの静的ファイルを配信する
// ---------------------------------------------------------------------------

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function getDataDir() {
  return isDev
    ? path.join(__dirname, "..")
    : path.dirname(app.getPath("exe"));
}

function getFrontendDir() {
  return isDev
    ? path.join(__dirname, "..", "frontend", "out")
    : path.join(process.resourcesPath, "frontend");
}

// ---------------------------------------------------------------------------
// Config bootstrap
// ---------------------------------------------------------------------------

function ensureConfig() {
  const dataDir = getDataDir();
  const configPath = path.join(dataDir, "db_env_config.json");
  if (fs.existsSync(configPath)) return;

  const examplePath = isDev
    ? path.join(__dirname, "..", "db_env_config.example.json")
    : path.join(process.resourcesPath, "db_env_config.example.json");

  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, configPath);
    console.log("[electron] Copied example config to", configPath);
  }
}

// ---------------------------------------------------------------------------
// Backend process management
// ---------------------------------------------------------------------------

function startBackend() {
  const env = { ...process.env, PORTFORWARD_DATA_DIR: getDataDir() };

  if (isDev) {
    backendProcess = spawn(
      "python",
      ["-m", "uvicorn", "backend.main:app", "--port", "18080"],
      {
        cwd: path.join(__dirname, ".."),
        env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } else {
    const backendExe = path.join(
      process.resourcesPath,
      "backend",
      "backend_entry.exe",
    );
    backendProcess = spawn(backendExe, [], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  backendProcess.stdout?.on("data", (d) => console.log(`[backend] ${d}`));
  backendProcess.stderr?.on("data", (d) => console.error(`[backend] ${d}`));
  backendProcess.on("error", (err) =>
    console.error("Failed to start backend:", err),
  );
}

async function waitForBackend(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await net.fetch("http://127.0.0.1:18080/api/logs");
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function killBackend() {
  if (!backendProcess || backendProcess.killed) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", backendProcess.pid.toString(), "/f", "/t"]);
  } else {
    backendProcess.kill();
  }
  backendProcess = null;
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, "..", "build", "icon.png")
    : path.join(process.resourcesPath, "app.asar.unpacked", "build", "icon.png");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "ポートフォワード管理くん",
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:18081");
    mainWindow.webContents.openDevTools();
  } else {
    // カスタムプロトコル app:// でフロントエンドを配信
    mainWindow.loadURL("app://portforward-kun/index.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  // カスタムプロトコルハンドラ登録
  const frontendDir = getFrontendDir();
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let filePath = decodeURIComponent(url.pathname);
    if (filePath === "/" || filePath === "") filePath = "/index.html";

    const fullPath = path.join(frontendDir, filePath);
    return net.fetch("file:///" + fullPath.replace(/\\/g, "/"));
  });

  ensureConfig();
  startBackend();

  const ready = await waitForBackend();
  if (!ready) {
    console.error("[electron] Backend did not start within timeout");
  }

  createWindow();
});

app.on("window-all-closed", () => {
  killBackend();
  app.quit();
});

app.on("before-quit", () => {
  killBackend();
});
