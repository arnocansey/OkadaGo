"use client";

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
    <section className="exact-admin-sidebar-card">
      <p className="exact-admin-sidebar-card-eyebrow">OkadaGo Wallet</p>
      <h3>{formatMoney(currency, totalRevenue)}</h3>
      <div className="exact-admin-sidebar-metrics">
        <div>
          <span>Trips in motion</span>
          <strong>{activeTrips}</strong>
        </div>
        <div>
          <span>Riders online</span>
          <strong>{activeRiders}</strong>
        </div>
        <div>
          <span>Revenue captured</span>
          <strong>{formatMoney(currency, totalRevenue)}</strong>
        </div>
        <div>
          <span>Service zones</span>
          <strong>{zones}</strong>
        </div>
      </div>
      <a className="exact-admin-sidebar-action" href="/admin/finance">
        Review finance
      </a>
    </section>
  );
}
