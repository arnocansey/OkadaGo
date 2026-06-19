import React from "react";
import { cn } from "@/lib/utils";

type MobileStatusBarProps = {
  tone?: "light" | "dark";
  className?: string;
};

export function MobileStatusBar({ tone = "dark", className }: MobileStatusBarProps) {
  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 text-xs font-medium w-full z-50",
        isLight ? "text-white" : "text-gray-900",
        className
      )}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className={cn("w-4 h-3 rounded-sm", isLight ? "bg-current" : "bg-current")} />
        <div className={cn("w-3 h-3 rounded-full", isLight ? "bg-current" : "bg-current")} />
        <div className="w-5 h-2.5 border border-current rounded-sm" />
      </div>
    </div>
  );
}
