export function RdrSkeleton({ className = "" }: { className?: string }) {
  return <div className={`rdr-skeleton ${className}`.trim()} aria-hidden />;
}

export function DashboardSkeleton() {
  return (
    <div className="rdr-skeleton-stack" aria-busy aria-label="Loading dashboard">
      <RdrSkeleton className="h-24 w-full rounded-2xl" />
      <RdrSkeleton className="h-12 w-full rounded-xl" />
      <RdrSkeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export function TripsListSkeleton() {
  return (
    <div className="rdr-skeleton-stack" aria-busy aria-label="Loading trips">
      {Array.from({ length: 4 }).map((_, index) => (
        <RdrSkeleton key={index} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EarningsSkeleton() {
  return (
    <div className="rdr-skeleton-stack" aria-busy aria-label="Loading earnings">
      <div className="rdr-stat-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <RdrSkeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <RdrSkeleton className="h-40 w-full rounded-xl" />
      <RdrSkeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="rdr-skeleton-stack" aria-busy aria-label="Loading profile">
      <RdrSkeleton className="h-28 w-full rounded-2xl" />
      <RdrSkeleton className="h-40 w-full rounded-xl" />
      <RdrSkeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export function MapAreaSkeleton() {
  return <div className="rdr-map-root rdr-map-root--loading" aria-busy aria-label="Loading map" />;
}
