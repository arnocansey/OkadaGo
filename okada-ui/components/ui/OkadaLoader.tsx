"use client";

type OkadaLoaderProps = {
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const SIZE_PX = { xs: 20, sm: 32, md: 52, lg: 72 } as const;

/** Branded loader — map pin + lane dashes (not a spinner). */
export function OkadaLoader({ size = "md", label, className }: OkadaLoaderProps) {
  const px = SIZE_PX[size];

  return (
    <div
      className={["okada-loader", `okada-loader--${size}`, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div className="okada-loader-mark" style={{ width: px, height: px }} aria-hidden>
        <span className="okada-loader-glow" />
        <span className="okada-loader-pin">
          <span className="okada-loader-pin-head" />
          <span className="okada-loader-pin-point" />
        </span>
        <span className="okada-loader-lanes">
          <span className="okada-loader-lane" />
          <span className="okada-loader-lane" />
          <span className="okada-loader-lane" />
        </span>
      </div>
      {label ? <span className="okada-loader-label">{label}</span> : null}
    </div>
  );
}

/** Full-viewport fallback for Suspense boundaries. */
export function OkadaLoaderPage({ className }: { className?: string }) {
  return (
    <div
      className={["flex min-h-dvh items-center justify-center", className].filter(Boolean).join(" ")}
    >
      <OkadaLoader size="lg" label="Loading…" />
    </div>
  );
}
