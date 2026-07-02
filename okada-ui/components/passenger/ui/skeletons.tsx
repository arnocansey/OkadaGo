"use client";

type PaxSkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function PaxSkeleton({ className = "", style }: PaxSkeletonProps) {
  return <div className={`pax-skeleton ${className}`.trim()} style={style} aria-hidden />;
}

export function HomePanelSkeleton() {
  return (
    <div className="pax-skeleton-stack" aria-busy aria-label="Loading home">
      <PaxSkeleton className="h-12 w-full rounded-2xl" />
      <div className="flex gap-3">
        <PaxSkeleton className="h-9 w-24 rounded-full" />
        <PaxSkeleton className="h-9 w-24 rounded-full" />
      </div>
      <PaxSkeleton className="h-4 w-16" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <PaxSkeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <PaxSkeleton className="h-4 w-3/4" />
            <PaxSkeleton className="h-3 w-1/2" />
          </div>
          <PaxSkeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function TripsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="pax-trips-grid" aria-busy aria-label="Loading trips">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pax-card p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <PaxSkeleton className="h-4 w-2/3" />
              <PaxSkeleton className="h-3 w-1/3" />
            </div>
            <PaxSkeleton className="h-6 w-16 rounded-full" />
          </div>
          <PaxSkeleton className="mb-2 h-3 w-full" />
          <PaxSkeleton className="mb-3 h-3 w-4/5" />
          <div className="flex items-center justify-between border-t border-[var(--pax-border)] pt-3">
            <PaxSkeleton className="h-3 w-24" />
            <PaxSkeleton className="h-4 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="pax-skeleton-stack" aria-busy aria-label="Loading wallet">
      <div className="pax-wallet-card">
        <PaxSkeleton className="mb-2 h-4 w-28" />
        <PaxSkeleton className="mb-5 h-10 w-40" />
        <div className="flex gap-3">
          <PaxSkeleton className="h-11 flex-1 rounded-xl" />
          <PaxSkeleton className="h-11 flex-1 rounded-xl" />
        </div>
      </div>
      <PaxSkeleton className="h-4 w-36" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="pax-card flex items-center gap-3 p-4">
          <PaxSkeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <PaxSkeleton className="h-4 w-2/3" />
            <PaxSkeleton className="h-3 w-1/3" />
          </div>
          <PaxSkeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="pax-skeleton-stack" aria-busy aria-label="Loading profile">
      <div className="flex items-center gap-4">
        <PaxSkeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <PaxSkeleton className="h-6 w-40" />
          <PaxSkeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="pax-wallet-card">
        <PaxSkeleton className="mb-2 h-4 w-28" />
        <PaxSkeleton className="h-9 w-36" />
      </div>
      {[0, 1, 2].map((section) => (
        <div key={section}>
          <PaxSkeleton className="mb-3 h-3 w-20" />
          {[0, 1, 2].map((row) => (
            <PaxSkeleton key={row} className="mb-2 h-12 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="pax-skeleton-stack" aria-busy aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pax-card flex items-start gap-3 p-4">
          <PaxSkeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <PaxSkeleton className="h-4 w-3/4" />
            <PaxSkeleton className="h-3 w-full" />
            <PaxSkeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PaymentMethodsSkeleton() {
  return (
    <div className="pax-skeleton-stack" aria-busy aria-label="Loading payment methods">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="pax-card flex items-center gap-4 p-4">
          <PaxSkeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <PaxSkeleton className="h-4 w-28" />
            <PaxSkeleton className="h-3 w-full max-w-xs" />
          </div>
          <PaxSkeleton className="h-5 w-5 rounded-full" />
        </div>
      ))}
      <PaxSkeleton className="mt-2 h-12 w-full rounded-xl" />
    </div>
  );
}

export function BookFormSkeleton() {
  return (
    <div className="pax-skeleton-stack" aria-busy aria-label="Loading booking form">
      <PaxSkeleton className="hidden h-7 w-36 lg:block" />
      <PaxSkeleton className="hidden h-4 w-56 lg:block" />
      <PaxSkeleton className="h-14 w-full rounded-xl" />
      <PaxSkeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <PaxSkeleton className="h-28 rounded-xl" />
        <PaxSkeleton className="h-28 rounded-xl" />
      </div>
      <PaxSkeleton className="h-12 w-full rounded-xl" />
      <PaxSkeleton className="mt-auto h-14 w-full rounded-xl" />
    </div>
  );
}

export function SubPageFormSkeleton() {
  return (
    <div className="pax-skeleton-stack" aria-busy aria-label="Loading">
      <div className="pax-card p-4">
        <PaxSkeleton className="mb-4 h-5 w-32" />
        <div className="mb-4 flex gap-2">
          <PaxSkeleton className="h-9 w-20 rounded-full" />
          <PaxSkeleton className="h-9 w-20 rounded-full" />
        </div>
        <PaxSkeleton className="mb-3 h-10 w-full rounded-lg" />
        <PaxSkeleton className="mb-3 h-10 w-full rounded-lg" />
        <PaxSkeleton className="h-11 w-full rounded-xl" />
      </div>
      <ListRowsSkeleton count={3} />
    </div>
  );
}

export function MapAreaSkeleton() {
  return (
    <div className="pax-map-skeleton" aria-busy aria-label="Loading map">
      <div className="pax-map-skeleton-grid" />
      <PaxSkeleton className="absolute bottom-4 left-4 h-8 w-40 rounded-lg opacity-80" />
    </div>
  );
}
