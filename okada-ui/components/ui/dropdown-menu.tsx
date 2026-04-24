"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export function DropdownMenu({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuTrigger({
  children,
  asChild
}: {
  children?: ReactNode;
  asChild?: boolean;
}) {
  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement);
  }

  return <button type="button">{children}</button>;
}

export function DropdownMenuContent({
  className = "",
  children
}: {
  className?: string;
  children?: ReactNode;
  align?: string;
}) {
  return <div className={`hidden ${className}`.trim()}>{children}</div>;
}

export function DropdownMenuItem({
  className = "",
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={className}>{children}</div>;
}
