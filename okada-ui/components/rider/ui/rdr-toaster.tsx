"use client";

import { Toaster } from "sonner";

export function RdrToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "rdr-toast",
          title: "rdr-toast-title",
          description: "rdr-toast-desc"
        }
      }}
    />
  );
}
