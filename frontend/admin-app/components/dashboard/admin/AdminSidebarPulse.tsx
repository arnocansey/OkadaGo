import { formatMoney } from "@/lib/currency";

export function AdminSidebarPulse({
  currency,
  activeTrips,
  activeRiders,
  totalRevenue,
  zones
}: {
  currency: string;
  activeTrips: number;
  activeRiders: number;
  totalRevenue: number;
  zones: number;
}) {
  return (
    <section className="exact-admin-sidebar-card exact-admin-sidebar-card--compact">
      <h3>{formatMoney(currency, totalRevenue)}</h3>
      <div className="exact-admin-sidebar-metrics">
        <div>
          <span>Trips</span>
          <strong>{activeTrips}</strong>
        </div>
        <div>
          <span>Online</span>
          <strong>{activeRiders}</strong>
        </div>
        <div>
          <span>Zones</span>
          <strong>{zones}</strong>
        </div>
      </div>
    </section>
  );
}
