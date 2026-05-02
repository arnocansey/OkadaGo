import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileBottomNavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  highlightDot?: boolean;
};

type MobileBottomNavProps = {
  items: MobileBottomNavItem[];
  className?: string;
};

export function MobileBottomNav({ items, className }: MobileBottomNavProps) {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 h-[88px] bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 z-20",
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.label}
          className={cn(
            "flex flex-col items-center gap-1 w-16",
            item.active ? "text-[#0D6B4A]" : "text-gray-400"
          )}
        >
          <div className="relative">
            <item.icon className={cn("w-6 h-6", item.active && "fill-[#0D6B4A]/20")} />
            {item.highlightDot ? (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            ) : null}
          </div>
          <span className={cn("text-[10px] font-medium", item.active && "font-bold")}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
