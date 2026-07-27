"use client";

import { useEffect } from "react";

export function ImmersivePage({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    document.body.classList.add("immersive-mode");

    return () => {
      document.body.classList.remove("immersive-mode");
    };
  }, []);

  return (
    <main className={className} data-immersive="true">
      {children}
    </main>
  );
}
