"use client";

type OkadaLoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const SIZE_PX = { sm: 28, md: 48, lg: 72 } as const;

/** Branded ops loader — radar sweep instead of a generic spinner. */
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
        <span className="okada-loader-ring" />
        <span className="okada-loader-ring okada-loader-ring--delayed" />
        <span className="okada-loader-sweep" />
        <span className="okada-loader-core">
          <span className="okada-loader-core-inner" />
        </span>
      </div>
      {label ? <span className="okada-loader-label">{label}</span> : null}
    </div>
  );
}
