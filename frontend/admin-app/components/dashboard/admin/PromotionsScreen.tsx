import { Tag, TrendingDown, Map } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { RideRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";

export type PromotionsScreenProps = {
  promoAdjustedTrips: RideRecord[];
  topDiscountedRides: RideRecord[];
  promotionZoneSnapshot: [string, number][];
  promoSpend: number;
  referralSpend: number;
  adminCurrency: string;
};

export function PromotionsScreen({
  promoAdjustedTrips,
  topDiscountedRides,
  promotionZoneSnapshot,
  promoSpend,
  referralSpend,
  adminCurrency
}: PromotionsScreenProps) {
  const totalDiscount = promoSpend + referralSpend;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Promotions"
        subtitle="Track promo-assisted trips and referral-driven discounts from live ride records."
      />

      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Tag size={22} /></div>
          <div>
            <span>Promo Rides</span>
            <strong>{promoAdjustedTrips.length}</strong>
            <small>With discounts applied</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><TrendingDown size={22} /></div>
          <div>
            <span>Promo Spend</span>
            <strong>{formatMoney(adminCurrency, promoSpend)}</strong>
            <small>Discount codes</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><TrendingDown size={22} /></div>
          <div>
            <span>Referral Spend</span>
            <strong>{formatMoney(adminCurrency, referralSpend)}</strong>
            <small>Referral discounts</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><TrendingDown size={22} /></div>
          <div>
            <span>Total Discount Cost</span>
            <strong>{formatMoney(adminCurrency, totalDiscount)}</strong>
            <small>Promo + referral</small>
          </div>
        </article>
      </section>

      <div className="admin-screen-grid-2">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Top Discounted Rides</h3>
              <p>Rides with the highest discount applied.</p>
            </div>
          </div>
          {topDiscountedRides.length === 0 ? (
            <EmptyCard title="No promo-adjusted rides." body="Rides with promo codes or referral discounts will appear here." />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Passenger</th>
                    <th>Route</th>
                    <th>Promo Discount</th>
                    <th>Referral Discount</th>
                    <th>Final Fare</th>
                    <th>Zone</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {topDiscountedRides.map((ride) => (
                    <tr key={ride.id}>
                      <td><strong>{ride.passenger.user.fullName}</strong></td>
                      <td>
                        <small>
                          {ride.pickupAddress} → {ride.destinationAddress}
                        </small>
                      </td>
                      <td>{formatMoney(ride.currency, parseNumber(ride.promoDiscount))}</td>
                      <td>{formatMoney(ride.currency, parseNumber(ride.referralDiscount))}</td>
                      <td>
                        <strong>
                          {formatMoney(ride.currency, parseNumber(ride.finalFare ?? ride.estimatedFare))}
                        </strong>
                      </td>
                      <td><small>{ride.serviceZone?.name ?? "No zone"}</small></td>
                      <td><small>{formatDateTime(ride.createdAt)}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Promo by Zone</h3>
                <Map size={16} />
              </div>
            </div>
            {promotionZoneSnapshot.length === 0 ? (
              <EmptyCard title="No zone data." body="" />
            ) : (
              <ul className="admin-summary-list">
                {promotionZoneSnapshot.map(([zone, count]) => (
                  <li key={zone}>
                    <span>{zone}</span>
                    <strong>{count} rides</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Promo Code Management</h3></div>
            </div>
            <div style={{ padding: "12px 0" }}>
              <p style={{ fontSize: 14, marginBottom: 12 }}>
                Create and manage promotion codes for your platform.
              </p>
              <a href="#promo-codes" className="button" style={{ textDecoration: "none" }}>
                Manage Promo Codes
              </a>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
