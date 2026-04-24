"use client";

import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[#0D6B4A] focus:ring-2 focus:ring-[#0D6B4A]/15 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      {...props}
    />
  );
}
