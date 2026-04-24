"use client";

import type { HTMLAttributes, ReactNode } from "react";

export function Select({ children }: { children: ReactNode; defaultValue?: string }) {
  return <div className="relative">{children}</div>;
}

export function SelectTrigger({
  className = "",
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button type="button" className={`inline-flex items-center justify-between ${className}`.trim()}>
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({
  className = "",
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={`hidden ${className}`.trim()}>{children}</div>;
}

export function SelectItem({
  className = "",
  children
}: {
  className?: string;
  children?: ReactNode;
  value: string;
}) {
  return <div className={className}>{children}</div>;
}
