"use client";

import type { HTMLAttributes } from "react";

export function Badge({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: string }) {
  return (
    <div className={`inline-flex items-center ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
