import type { NextConfig } from "next";

const isElectronBuild = process.env.ELECTRON_BUILD === "1";

const nextConfig: NextConfig = {
  // Electron ビルド時は静的エクスポート
  ...(isElectronBuild ? { output: "export" } : {}),

  // 開発時のみ API プロキシ (静的エクスポートでは rewrites は不要)
  ...(!isElectronBuild
    ? {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://localhost:18080/api/:path*",
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
