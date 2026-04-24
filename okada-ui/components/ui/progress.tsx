"use client";

export function Progress({
  value = 0,
  className = "",
  indicatorClassName = ""
}: {
  value?: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-full ${className}`.trim()}>
      <div
        className={`h-full rounded-full ${indicatorClassName}`.trim()}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
