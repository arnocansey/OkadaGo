"use client";

import React from "react";

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

/** Single shimmer bone — theme-aware via `.admin-skeleton` in admin.css. */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`admin-skeleton ${className}`.trim()} style={style} aria-hidden />;
}

export function SkeletonKPI({ count = 4 }: { count?: number }) {
  return (
    <div
      className="admin-skeleton-kpi-grid"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="admin-skeleton-card admin-skeleton-kpi">
          <div className="admin-skeleton-kpi-top">
            <Skeleton className="admin-skeleton-icon" />
            <Skeleton style={{ width: 48, height: 10 }} />
          </div>
          <Skeleton style={{ width: "55%", height: 11, marginBottom: 8 }} />
          <Skeleton style={{ width: "38%", height: 20 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  const colCount = Math.max(2, cols);
  return (
    <div className="admin-skeleton-card admin-skeleton-table">
      <div className="admin-skeleton-table-head">
        {Array.from({ length: colCount }).map((_, i) => (
          <Skeleton
            key={i}
            style={{ width: `${18 + (i % 3) * 8}%`, maxWidth: 120, height: 10 }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="admin-skeleton-table-row">
          {Array.from({ length: colCount }).map((_, col) => (
            <Skeleton
              key={col}
              style={{
                width: col === 0 ? "70%" : `${40 + ((row + col) % 4) * 12}%`,
                maxWidth: col === 0 ? 180 : 140,
                height: 12
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  const lineCount = Math.max(1, lines);
  return (
    <div className="admin-skeleton-card">
      <div className="admin-skeleton-card-head">
        <Skeleton className="admin-skeleton-avatar" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Skeleton style={{ width: "65%", height: 12, marginBottom: 6 }} />
          <Skeleton style={{ width: "45%", height: 10 }} />
        </div>
      </div>
      {Array.from({ length: lineCount }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            width: i === lineCount - 1 ? "58%" : "92%",
            height: 10,
            marginBottom: i < lineCount - 1 ? 8 : 0
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonDonut() {
  return (
    <div className="admin-skeleton-card admin-skeleton-donut-wrap">
      <div className="admin-skeleton-donut" aria-hidden />
      <div className="admin-skeleton-donut-legend">
        <Skeleton style={{ width: "70%", height: 10 }} />
        <Skeleton style={{ width: "55%", height: 10 }} />
        <Skeleton style={{ width: "62%", height: 10 }} />
      </div>
    </div>
  );
}

const CHART_HEIGHTS = [42, 68, 54, 78, 46, 62, 70];

export function SkeletonChart() {
  return (
    <div className="admin-skeleton-card">
      <Skeleton style={{ width: 120, height: 12, marginBottom: 14 }} />
      <div className="admin-skeleton-chart">
        {CHART_HEIGHTS.map((height, i) => (
          <Skeleton key={i} className="admin-skeleton-chart-bar" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="admin-skeleton-card">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="admin-skeleton-form-field">
          <Skeleton style={{ width: 96, height: 10, marginBottom: 8 }} />
          <Skeleton style={{ width: "100%", height: 38, borderRadius: 10 }} />
        </div>
      ))}
    </div>
  );
}

/** Full-page placeholder matching typical admin layout: KPIs + main panel. */
export function AdminPageSkeleton({
  kpis = 4,
  rows = 6,
  cols = 5,
  variant = "table"
}: {
  kpis?: number;
  rows?: number;
  cols?: number;
  variant?: "table" | "cards" | "form" | "dashboard" | "split";
}) {
  return (
    <div className="exact-admin-screen admin-skeleton-page" aria-busy="true" aria-live="polite">
      <div className="admin-skeleton-header">
        <div>
          <Skeleton style={{ width: 180, height: 22, marginBottom: 10 }} />
          <Skeleton style={{ width: 260, height: 12 }} />
        </div>
        <Skeleton style={{ width: 110, height: 36, borderRadius: 10 }} />
      </div>

      {kpis > 0 ? <SkeletonKPI count={kpis} /> : null}

      {variant === "table" ? <SkeletonTable rows={rows} cols={cols} /> : null}

      {variant === "cards" ? (
        <div className="admin-skeleton-card-grid">
          {Array.from({ length: Math.max(3, rows) }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : null}

      {variant === "form" ? <SkeletonForm fields={rows} /> : null}

      {variant === "dashboard" ? (
        <div className="admin-skeleton-dashboard">
          <div className="admin-skeleton-dashboard-main">
            <SkeletonChart />
            <SkeletonTable rows={4} cols={4} />
          </div>
          <div className="admin-skeleton-dashboard-side">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      ) : null}

      {variant === "split" ? (
        <div className="admin-skeleton-dashboard">
          <div className="admin-skeleton-dashboard-main">
            <SkeletonTable rows={rows} cols={cols} />
          </div>
          <div className="admin-skeleton-dashboard-side">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
