"use client";

import { Toaster } from "sonner";

export function PaxToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "pax-toast",
          title: "pax-toast-title",
          description: "pax-toast-description",
          actionButton: "pax-toast-action",
          cancelButton: "pax-toast-cancel",
          closeButton: "pax-toast-close"
        }
      }}
    />
  );
}
