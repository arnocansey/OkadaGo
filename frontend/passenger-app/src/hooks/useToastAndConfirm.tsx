import React, { useState } from "react";
import { Toast, ToastProps } from "../components/Toast";
import { ConfirmDialog } from "../components/ui";

export interface UseToastReturn {
  toast: ToastProps | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
  ToastComponent: React.ReactNode;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const hideToast = () => setToast(null);

  const ToastComponent = toast ? (
    <Toast {...toast} onDismiss={hideToast} />
  ) : null;

  return { toast, showToast, hideToast, ToastComponent };
}

export interface UseConfirmReturn {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  ConfirmComponent: React.ReactNode;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export function useConfirm(): UseConfirmReturn {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmOptions & { visible: boolean; resolve?: (value: boolean) => void }>({
    visible: false,
    title: "",
    message: "",
    confirmText: "",
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...options,
        visible: true,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    confirmDialog.resolve?.(true);
    setConfirmDialog({ ...confirmDialog, visible: false });
  };

  const handleCancel = () => {
    confirmDialog.resolve?.(false);
    setConfirmDialog({ ...confirmDialog, visible: false });
  };

  const ConfirmComponent = (
    <ConfirmDialog
      visible={confirmDialog.visible}
      title={confirmDialog.title}
      message={confirmDialog.message}
      confirmText={confirmDialog.confirmText}
      cancelText={confirmDialog.cancelText}
      isDangerous={confirmDialog.isDangerous}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmComponent };
}
