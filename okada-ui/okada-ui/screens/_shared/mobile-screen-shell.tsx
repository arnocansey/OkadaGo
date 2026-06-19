import React from "react";
import { cn } from "@/lib/utils";

type MobileScreenShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function MobileScreenShell({ children, className }: MobileScreenShellProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[430px] min-h-[100dvh] overflow-hidden font-sans",
        className
      )}
    >
      {children}
    </div>
  );
}
