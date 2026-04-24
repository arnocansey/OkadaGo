"use client";

import type { HTMLAttributes, ImgHTMLAttributes } from "react";

export function Avatar({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`overflow-hidden ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function AvatarImage({
  className = "",
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={`h-full w-full object-cover ${className}`.trim()} alt={alt} {...props} />;
}

export function AvatarFallback({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
