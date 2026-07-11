"use client";

import React from "react";

const shimmer = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "admin-shimmer 1.5s ease-in-out infinite",
  borderRadius: 6,
};

const keyframes = `
@keyframes admin-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

let injected = false;
function ensureKeyframes() {
  if (injected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = keyframes;
  document.head.appendChild(style);
  injected = true;
}

export function SkeletonBar({ width, height = 14, style }: { width?: string | number; height?: string | number; style?: React.CSSProperties }) {
  ensureKeyframes();
  return (
    <div
      style={{
        ...shimmer,
        width: width ?? "100%",
        height,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function SkeletonCircle({ size = 40, style }: { size?: number; style?: React.CSSProperties }) {
  ensureKeyframes();
  return (
    <div
      style={{
        ...shimmer,
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function SkeletonKPI({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SkeletonCircle size={36} />
            <SkeletonBar width="60%" height={12} />
          </div>
          <SkeletonBar width="45%" height={24} />
          <SkeletonBar width="70%" height={10} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <SkeletonBar width="30%" height={18} />
        <SkeletonBar width="15%" height={18} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <SkeletonBar width="25%" height={32} style={{ borderRadius: 8 }} />
        <SkeletonBar width="18%" height={32} style={{ borderRadius: 8 }} />
        <SkeletonBar width="18%" height={32} style={{ borderRadius: 8 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {Array.from({ length: cols }).map((_, colIdx) => (
              <SkeletonBar
                key={colIdx}
                width={colIdx === 0 ? "80%" : colIdx === cols - 1 ? "60%" : "90%"}
                height={13}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <SkeletonBar width="35%" height={16} />
        <SkeletonBar width="15%" height={16} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "0 8px" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBar
            key={i}
            width="100%"
            height={`${30 + Math.random() * 60}%`}
            style={{ borderRadius: "4px 4px 0 0", flex: 1 }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <SkeletonBar width="40%" height={16} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height={13}
        />
      ))}
    </div>
  );
}

export function SkeletonDonut() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <SkeletonBar width="35%" height={16} />
      <SkeletonCircle size={120} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <SkeletonBar width="100%" height={12} />
        <SkeletonBar width="80%" height={12} />
        <SkeletonBar width="60%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <SkeletonBar width="30%" height={18} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SkeletonBar width="40%" height={11} />
            <SkeletonBar width="100%" height={36} style={{ borderRadius: 8 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <SkeletonBar width={100} height={34} style={{ borderRadius: 8 }} />
        <SkeletonBar width={80} height={34} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonTimeline({ items = 4 }: { items?: number }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <SkeletonBar width="30%" height={16} />
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <SkeletonCircle size={10} style={{ marginTop: 4 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <SkeletonBar width="50%" height={13} />
            <SkeletonBar width="80%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}
