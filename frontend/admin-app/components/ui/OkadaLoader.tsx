"use client";

type OkadaLoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const SIZE_PX = { sm: 32, md: 52, lg: 72 } as const;

/** Branded ops loader — route beacon + lane dashes (not a spinner). */
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
