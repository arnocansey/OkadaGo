"use client";

import type { LabelHTMLAttributes } from "react";

export function Label({
  className = "",
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`.trim()} {...props}>
      {children}
    </label>
  );
}
