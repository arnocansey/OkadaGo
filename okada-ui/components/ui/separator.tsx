"use client";

import type { HTMLAttributes } from "react";

export function Separator({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`h-px w-full bg-slate-200 ${className}`.trim()} {...props} />;
}
