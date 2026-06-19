"use client";

import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { RideRecord } from "./types";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

type PromotionsScreenProps = {
  screenMeta: { eyebrow: string; title: string; description: string };
  rides: RideRecord[];
  promoAdjustedTrips: RideRecord[];
  promoSpend: number;
  referralSpend: number;
  adminCurrency: string;
  promotionZoneSnapshot: [string, number][];
  topDiscountedRides: RideRecord[];
};

export function PromotionsScreen({
  screenMeta,
  rides,
  promoAdjustedTrips,
  promoSpend,
  referralSpend,
  adminCurrency,
  promotionZoneSnapshot,
  topDiscountedRides
}: PromotionsScreenProps) {
  return (
    <>
      <section className="exact-admin-section">
        <div className="exact-admin-heading">
          <p className="exact-admin-eyebrow">{screenMeta.eyebrow}</p>
          <h1>{screenMeta.title}</h1>
          <p>{screenMeta.description}</p>
        </div>

        <div className="exact-admin-kpis">
          <article className="exact-admin-kpi">
            <span>Promo-assisted rides</span>
            <strong>{promoAdjustedTrips.filter((ride) => parseNumber(ride.promoDiscount) > 0).length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Referral-assisted rides</span>
            <strong>{promoAdjustedTrips.filter((ride) => parseNumber(ride.referralDiscount) > 0).length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Total promo spend</span>
            <strong>{formatMoney(adminCurrency, promoSpend)}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Total referral spend</span>
            <strong>{formatMoney(adminCurrency, referralSpend)}</strong>
          </article>
        </div>
      </section>

      <div className="exact-admin-grid">
        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Growth pressure</h3>
              <p>How discounts are currently influencing demand and where that pressure is landing.</p>
            </div>
          </div>
          <div className="exact-admin-priority-grid">
            <article className="exact-admin-priority-card">
              <span>Discount penetration</span>
              <strong>
                {rides.length === 0 ? "0%" : `${Math.round((promoAdjustedTrips.length / rides.length) * 100)}%`}
              </strong>
              <small>Share of all rides currently carrying either promo or referral support.</small>
            </article>
            <article className="exact-admin-priority-card">
              <span>Average discount per ride</span>
              <strong>
                {formatMoney(
                  adminCurrency,
                  promoAdjustedTrips.length === 0
                    ? 0
                    : (promoSpend + referralSpend) / promoAdjustedTrips.length
                )}
              </strong>
              <small>Blended incentive cost applied each time a discounted ride is posted.</small>
            </article>
            <article className="exact-admin-priority-card">
              <span>Largest single discount</span>
              <strong>
                {formatMoney(
                  adminCurrency,
                  topDiscountedRides.length === 0
                    ? 0
                    : parseNumber(topDiscountedRides[0]?.promoDiscount) +
                        parseNumber(topDiscountedRides[0]?.referralDiscount)
                )}
              </strong>
              <small>
                Highest combined promo and referral value currently recorded on one ride.
              </small>
            </article>
          </div>
        </section>

        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Promo and referral ride ledger</h3>
              <p>Completed and live rides where discounts are actually being applied in the live system.</p>
            </div>
          </div>
          {promoAdjustedTrips.length === 0 ? (
            <EmptyCard
              title="No promo-adjusted rides yet."
              body="Once promo or referral discounts are applied to rides, they will show up here automatically."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Passenger</th>
                    <th>Rider</th>
                    <th>Zone</th>
                    <th>Promo</th>
                    <th>Referral</th>
                    <th>Fare</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {promoAdjustedTrips
                    .slice()
                    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
                    .map((ride) => (
                      <tr key={ride.id}>
                        <td>{ride.passenger.user.fullName}</td>
                        <td>{ride.rider?.user.fullName ?? "Unassigned"}</td>
                        <td>{ride.serviceZone?.name ?? "No zone"}</td>
                        <td>{formatMoney(ride.currency, ride.promoDiscount)}</td>
                        <td>{formatMoney(ride.currency, ride.referralDiscount)}</td>
                        <td>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</td>
                        <td>{formatDateTime(ride.createdAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Discount signals</h3>
              <p>Where promotion activity is currently clustering.</p>
            </div>
          </div>
          <div className="exact-admin-stack">
            {promotionZoneSnapshot.length === 0 ? (
              <EmptyCard
                title="No promotion zones yet."
                body="Promotion activity will show the most active zones here once the first discounted rides land."
              />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {promotionZoneSnapshot.slice(0, 6).map(([zone, count]) => (
                  <li key={zone}>
                    <span>{zone}</span>
                    <strong>{count} rides</strong>
                  </li>
                ))}
              </ul>
            )}

            <section className="exact-admin-card exact-admin-card-inset">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Top discounted rides</h3>
                  <p>The passenger-side rides consuming the most incentive value right now.</p>
                </div>
              </div>
              {topDiscountedRides.length === 0 ? (
                <EmptyCard
                  title="No discounted rides yet."
                  body="The highest-value discounted trips will appear here once promotions are in use."
                />
              ) : (
                <ul className="workbench-list exact-admin-ride-feed">
                  {topDiscountedRides.map((ride) => (
                    <li key={ride.id}>
                      <span>{ride.passenger.user.fullName}</span>
                      <strong>
                        {formatMoney(
                          ride.currency,
                          parseNumber(ride.promoDiscount) + parseNumber(ride.referralDiscount)
                        )}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      </div>
    </>
  );
}
