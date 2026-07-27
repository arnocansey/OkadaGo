"use client";

import Image from "next/image";

type BrandMarkProps = {
  variant?: "icon" | "wordmark";
  /** Prefer dark assets on light surfaces, light assets on dark surfaces */
  onDark?: boolean;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function BrandMark({
  variant = "wordmark",
  onDark = false,
  height = 28,
  className,
  priority = false
}: BrandMarkProps) {
  if (variant === "icon") {
    const src = onDark ? "/branding/okadago-icon-yellow.png" : "/branding/okadago-icon-dark.png";
    return (
      <Image
        src={src}
        alt="OkadaGo"
        width={height}
        height={height}
        className={className}
        priority={priority}
        style={{ width: height, height, objectFit: "contain" }}
      />
    );
  }

  const src = onDark ? "/branding/okadago-wordmark-light.png" : "/branding/okadago-wordmark-dark.png";
  const width = Math.round(height * 4.2);
  return (
    <Image
      src={src}
      alt="OkadaGo"
      width={width}
      height={height}
      className={className}
      priority={priority}
      style={{ width, height, objectFit: "contain" }}
    />
  );
}
