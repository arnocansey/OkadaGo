import React from 'react';

const shimmerBase: React.CSSProperties = {
  borderRadius: 6,
  background: 'linear-gradient(90deg, var(--bg-elevated) 25%, #2a2a2a 50%, var(--bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.5s infinite',
};

const keyframes = `
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

if (typeof document !== 'undefined') {
  const style = document.getElementById('skeleton-keyframes');
  if (!style) {
    const el = document.createElement('style');
    el.id = 'skeleton-keyframes';
    el.textContent = keyframes;
    document.head.appendChild(el);
  }
}

export function SkeletonKPI({ count }: { count?: number } = {}) {
  const card = (
    <div style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ ...shimmerBase, width: 32, height: 32, borderRadius: 6 }} />
        <div style={{ ...shimmerBase, width: 40, height: 12 }} />
      </div>
      <div style={{ ...shimmerBase, width: '60%', height: 10, marginBottom: 6 }} />
      <div style={{ ...shimmerBase, width: '40%', height: 18 }} />
    </div>
  );

  if (!count) return card;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => <React.Fragment key={i}>{card}</React.Fragment>)}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols }: { rows?: number; cols?: number }) {
  const colWidths = cols
    ? Array.from({ length: cols }, (_, i) => 80 + (i % 3) * 40)
    : [80, 100, 120, 60, 100];
  const cellWidths = cols
    ? Array.from({ length: cols }, (_, i) => 100 + (i % 3) * 20)
    : [100, 120, 140, 60, 100];

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
        {colWidths.map((w, i) => (
          <div key={i} style={{ ...shimmerBase, width: w, height: 10 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24, alignItems: 'center' }}>
          {cellWidths.map((w, j) => (
            <div key={j} style={{ ...shimmerBase, width: w, height: 12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines }: { lines?: number } = {}) {
  const lineCount = lines ?? 2;
  return (
    <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ ...shimmerBase, width: 36, height: 36, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...shimmerBase, width: '70%', height: 12, marginBottom: 4 }} />
          <div style={{ ...shimmerBase, width: '50%', height: 10 }} />
        </div>
      </div>
      {Array.from({ length: lineCount }).map((_, i) => (
        <div key={i} style={{ ...shimmerBase, width: i === lineCount - 1 ? '60%' : '90%', height: 10, marginBottom: i < lineCount - 1 ? 6 : 0 }} />
      ))}
    </div>
  );
}

export function SkeletonDonut() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        border: '10px solid var(--border)',
        background: 'transparent',
        position: 'relative',
      }}>
        <div style={{ ...shimmerBase, width: '100%', height: '100%', borderRadius: '50%', position: 'absolute', top: -10, left: -10, opacity: 0.3 }} />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, paddingTop: 10 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ ...shimmerBase, flex: 1, height: `${30 + Math.random() * 60}%`, borderRadius: '4px 4px 0 0' }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields }: { fields?: number } = {}) {
  const count = fields ?? 4;
  return (
    <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ ...shimmerBase, width: 100, height: 10, marginBottom: 6 }} />
          <div style={{ ...shimmerBase, width: '100%', height: 36, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
