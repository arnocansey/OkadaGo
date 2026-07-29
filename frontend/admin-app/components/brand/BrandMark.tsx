"use client";

import Image from "next/image";

type BrandMarkProps = {
  variant?: "icon" | "wordmark";
  /** Prefer dark-surface lockups when true */
  onDark?: boolean;
  /** App-colored dark lockup when onDark */
  product?: "shared" | "passenger" | "rider";
  height?: number;
  className?: string;
  priority?: boolean;
};

function lockupSrc(onDark: boolean, product: BrandMarkProps["product"]) {
  if (!onDark) return "/branding/okadago-lockup-light.png";
  if (product === "rider") return "/branding/okadago-lockup-dark-rider.png";
  return "/branding/okadago-lockup-dark-passenger.png";
}

function iconSrc(onDark: boolean, product: BrandMarkProps["product"]) {
  if (!onDark) return "/branding/okadago-icon-dark.png";
  if (product === "rider") return "/branding/okadago-icon-yellow.png";
  return "/branding/okadago-lockup-dark-passenger.png";
}

export function BrandMark({
  variant = "wordmark",
  onDark = false,
  product = "shared",
  height = 28,
  className,
  priority = false
}: BrandMarkProps) {
  if (variant === "icon") {
    const src = iconSrc(onDark, product);
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

  const src = lockupSrc(onDark, product);
  const width = Math.round(height * 1.15);
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
