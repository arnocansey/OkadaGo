"use client";

import { useEffect, type HTMLAttributes, type ReactNode } from "react";

type ImmersivePageProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

export function ImmersivePage({ children, className, ...rest }: ImmersivePageProps) {
  useEffect(() => {
    document.body.classList.add("immersive-mode");

    return () => {
      document.body.classList.remove("immersive-mode");
    };
  }, []);

  return (
    <main className={className} data-immersive="true" {...rest}>
      {children}
    </main>
  );
}
