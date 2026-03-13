"use client";

export function Spinner({ size = 40 }: { size?: number }) {
  return (
    <svg
      className="animate-[spinner-rotate_1.4s_linear_infinite]"
      width={size}
      height={size}
      viewBox="0 0 50 50"
    >
      <circle
        className="stroke-primary"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        style={{
          strokeDasharray: "80, 200",
          strokeDashoffset: 0,
          animation: "spinner-dash 1.4s ease-in-out infinite",
        }}
      />
    </svg>
  );
}

export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-[9000]">
      <Spinner />
    </div>
  );
}
