"use client";

import {
  cloneElement,
  createContext,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useContext,
  useMemo,
  useState
} from "react";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  return useContext(DialogContext);
}

export function Dialog({
  children,
  open,
  onOpenChange
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const resolvedOpen = open ?? internalOpen;

  const contextValue = useMemo<DialogContextValue>(
    () => ({
      open: resolvedOpen,
      setOpen: (nextOpen) => {
        if (open === undefined) {
          setInternalOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
      }
    }),
    [onOpenChange, open, resolvedOpen]
  );

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
  children,
  asChild
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const context = useDialogContext();

  if (!context) {
    return asChild ? <>{children}</> : <button type="button">{children}</button>;
  }

  if (asChild && children && typeof children === "object" && "props" in (children as object)) {
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      onClick: () => context.setOpen(true)
    });
  }

  return (
    <button type="button" onClick={() => context.setOpen(true)}>
      {children}
    </button>
  );
}

export function DialogContent({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const context = useDialogContext();
  const hidden = context ? !context.open : false;

  if (hidden) {
    return null;
  }

  return (
    <div className={`bg-white ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={className} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
