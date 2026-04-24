"use client";

import { useEffect, useState } from "react";

export function Switch({
  className = "",
  defaultChecked = false,
  checked,
  id,
  onCheckedChange
}: {
  className?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  id?: string;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  useEffect(() => {
    if (checked !== undefined) {
      setInternalChecked(checked);
    }
  }, [checked]);

  const resolvedChecked = checked ?? internalChecked;

  function toggle() {
    const nextChecked = !resolvedChecked;
    if (checked === undefined) {
      setInternalChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  }

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={resolvedChecked}
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        resolvedChecked ? "bg-[#1a6b3c]" : "bg-slate-300"
      } ${className}`.trim()}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          resolvedChecked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
