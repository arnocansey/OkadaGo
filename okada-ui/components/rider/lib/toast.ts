"use client";

import { toast } from "sonner";

export const rdrToast = {
  success: (message: string) => toast.success(message),
  error: (message: string, description?: string) => toast.error(message, { description }),
  info: (message: string) => toast.info(message)
};
