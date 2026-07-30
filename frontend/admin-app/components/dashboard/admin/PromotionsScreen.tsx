import { Tag, TrendingDown, Map, Percent, PiggyBank } from "lucide-react";
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
  const discountedRideCount = promoAdjustedTrips.length;
  const avgDiscountPerRide =
    discountedRideCount > 0 ? totalDiscount / discountedRideCount : 0;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Promotions"
        subtitle="Active Accra campaigns, promo codes, and referral discounts in GHS."
      />

      <section className="admin-kpi-grid">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Tag size={22} /></div>
          <div>
            <span>Active Campaigns</span>
            <strong>{discountedRideCount}</strong>
            <small>Promo-adjusted rides</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Percent size={22} /></div>
          <div>
            <span>Avg Discount / Ride</span>
            <strong>{formatMoney(adminCurrency, avgDiscountPerRide)}</strong>
            <small>Across discounted trips</small>
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
          <div className="admin-reference-kpi-icon green"><PiggyBank size={22} /></div>
          <div>
            <span>Total Est. Savings</span>
            <strong>{formatMoney(adminCurrency, totalDiscount)}</strong>
            <small>Promo + referral to riders</small>
          </div>
        </article>
      </section>

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Live Campaigns / Discounted Trips</h3>
              <p>Highest-discount Accra rides with promo or referral applied.</p>
            </div>
          </div>
          {topDiscountedRides.length === 0 ? (
            <EmptyCard
              title="No promo-adjusted rides."
              body="Rides with promo codes or referral discounts will appear here."
            />
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
                <p>Discounted trip volume across Accra zones.</p>
              </div>
              <Map size={16} />
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
              <div>
                <h3>Spend Summary</h3>
                <p>Promo vs referral cost in Ghana cedis.</p>
              </div>
            </div>
            <ul className="admin-summary-list">
              <li>
                <span>Promo codes</span>
                <strong>{formatMoney(adminCurrency, promoSpend)}</strong>
              </li>
              <li>
                <span>Referral discounts</span>
                <strong>{formatMoney(adminCurrency, referralSpend)}</strong>
              </li>
              <li>
                <span>Total est. savings</span>
                <strong>{formatMoney(adminCurrency, totalDiscount)}</strong>
              </li>
            </ul>
            <p className="admin-ops-note">
              Promo codes are managed in ops tooling. Coordinate Accra campaign launches with the
              growth team before pushing new GHS discount codes live.
            </p>
          </article>
        </aside>
      </div>
    </div>
  );
}
