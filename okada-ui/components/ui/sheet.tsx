"use client";

import type { HTMLAttributes, ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export function Sheet({
  children,
  open,
  onOpenChange
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function SheetContent({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  );
}

export function SheetHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <DialogHeader {...props} />;
}

export function SheetTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <DialogTitle {...props} />;
}

export function SheetDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return <DialogDescription {...props} />;
}
