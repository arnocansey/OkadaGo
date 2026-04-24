"use client";

import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useMemo,
  useState
} from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within <Tabs>.");
  }

  return context;
}

export function Tabs({
  children,
  value,
  defaultValue,
  onValueChange,
  className = ""
}: {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? value ?? "");
  const resolvedValue = value ?? internalValue;

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      value: resolvedValue,
      setValue: (nextValue) => {
        if (value === undefined) {
          setInternalValue(nextValue);
        }
        onValueChange?.(nextValue);
      }
    }),
    [onValueChange, resolvedValue, value]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
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

export function TabsTrigger({
  className = "",
  children,
  value,
  ...props
}: HTMLAttributes<HTMLButtonElement> & {
  value: string;
}) {
  const { value: activeValue, setValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      data-state={isActive ? "active" : "inactive"}
      className={className}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  className = "",
  children,
  value,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  value: string;
}) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) {
    return null;
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
