"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: string;
  size?: string;
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
