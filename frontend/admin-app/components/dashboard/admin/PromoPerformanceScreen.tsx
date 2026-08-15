"use client";

import { useMemo } from "react";
import { Tag, TrendingUp, Users, Percent } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import type { RideRecord } from "./types";
import { parseNumber } from "./utils";
import { formatMoney } from "@/lib/currency";

export type PromoPerformanceScreenProps = {
  rides: RideRecord[];
  adminCurrency: string;
  dataLoading?: boolean;
};

export function PromoPerformanceScreen({ rides, adminCurrency, dataLoading = false }: PromoPerformanceScreenProps) {
  const promoRides = useMemo(() => rides.filter((r) => parseNumber(r.promoDiscount) > 0), [rides]);
  const referralRides = useMemo(() => rides.filter((r) => parseNumber(r.referralDiscount) > 0), [rides]);

  const totalPromoDiscount = useMemo(
    () => promoRides.reduce((s, r) => s + parseNumber(r.promoDiscount), 0),
    [promoRides]
  );
  const totalReferralDiscount = useMemo(
    () => referralRides.reduce((s, r) => s + parseNumber(r.referralDiscount), 0),
    [referralRides]
  );

  const avgPromoDiscount = promoRides.length > 0 ? totalPromoDiscount / promoRides.length : 0;

  const promoZoneMap = useMemo(() => {
    const map: Record<string, { trips: number; discount: number }> = {};
    promoRides.forEach((r) => {
      const zone = r.serviceZone?.name ?? "Unknown";
      if (!map[zone]) map[zone] = { trips: 0, discount: 0 };
      map[zone].trips += 1;
      map[zone].discount += parseNumber(r.promoDiscount);
    });
    return Object.entries(map).sort((a, b) => b[1].discount - a[1].discount);
  }, [promoRides]);

  const referralZoneMap = useMemo(() => {
    const map: Record<string, { trips: number; discount: number }> = {};
    referralRides.forEach((r) => {
      const zone = r.serviceZone?.name ?? "Unknown";
      if (!map[zone]) map[zone] = { trips: 0, discount: 0 };
      map[zone].trips += 1;
      map[zone].discount += parseNumber(r.referralDiscount);
    });
    return Object.entries(map).sort((a, b) => b[1].discount - a[1].discount);
  }, [referralRides]);

  const maxZoneDiscount = Math.max(
    1,
    ...promoZoneMap.map(([, v]) => v.discount),
    ...referralZoneMap.map(([, v]) => v.discount)
  );

  const zoneImpact = useMemo(() => {
    const map: Record<string, { promoTrips: number; referralTrips: number; totalDiscount: number; revenue: number }> =
      {};
    rides.forEach((r) => {
      const zone = r.serviceZone?.name ?? "Unknown";
      if (!map[zone]) map[zone] = { promoTrips: 0, referralTrips: 0, totalDiscount: 0, revenue: 0 };
      const pd = parseNumber(r.promoDiscount);
      const rd = parseNumber(r.referralDiscount);
      if (pd > 0) map[zone].promoTrips += 1;
      if (rd > 0) map[zone].referralTrips += 1;
      map[zone].totalDiscount += pd + rd;
      map[zone].revenue += parseNumber(r.finalFare ?? r.estimatedFare);
    });
    return Object.entries(map).sort((a, b) => b[1].totalDiscount - a[1].totalDiscount);
  }, [rides]);

  const topDiscounted = useMemo(() => {
    return rides
      .filter((r) => parseNumber(r.promoDiscount) > 0 || parseNumber(r.referralDiscount) > 0)
      .sort(
        (a, b) =>
          parseNumber(b.promoDiscount) +
          parseNumber(b.referralDiscount) -
          (parseNumber(a.promoDiscount) + parseNumber(a.referralDiscount))
      )
      .slice(0, 10);
  }, [rides]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={5} cols={5} />;
  }

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Promo Performance"
        subtitle="Accra campaign impact — promo and referral spend in GHS by zone."
      />

      <AdminKpiRow
        items={[
          {
            label: "Promo Trips",
            value: promoRides.length,
            hint: `${formatMoney(adminCurrency, totalPromoDiscount)} given`,
            icon: <Tag size={18} />,
            tone: "yellow"
          },
          {
            label: "Referral Trips",
            value: referralRides.length,
            hint: `${formatMoney(adminCurrency, totalReferralDiscount)} given`,
            icon: <Users size={18} />,
            tone: "green"
          },
          {
            label: "Avg Promo Discount",
            value: formatMoney(adminCurrency, avgPromoDiscount),
            hint: "Per discounted trip",
            icon: <Percent size={18} />,
            tone: "yellow"
          },
          {
            label: "Total Est. Savings",
            value: formatMoney(adminCurrency, totalPromoDiscount + totalReferralDiscount),
            hint: "Promo + referral",
            icon: <TrendingUp size={18} />,
            tone: "green"
          }
        ]}
      />

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Promo by zone</h3>
              <p>{promoRides.length} trips with promo codes</p>
            </div>
          </div>
          {promoZoneMap.length === 0 ? (
            <EmptyCard title="No promo data." body="Promo-adjusted rides will appear here." />
          ) : (
            <ul className="admin-summary-list">
              {promoZoneMap.map(([zone, stats]) => (
                <li key={zone}>
                  <span>{zone}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        height: 8,
                        width: `${Math.max(4, (stats.discount / maxZoneDiscount) * 80)}px`,
                        background: "var(--accent-yellow)",
                        borderRadius: 4
                      }}
                    />
                    <strong>{formatMoney(adminCurrency, stats.discount)}</strong>
                    <small>{stats.trips} trips</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Referral by zone</h3>
              <p>{referralRides.length} referral-driven trips</p>
            </div>
          </div>
          {referralZoneMap.length === 0 ? (
            <EmptyCard title="No referral data." body="Referral-adjusted rides will appear here." />
          ) : (
            <ul className="admin-summary-list">
              {referralZoneMap.map(([zone, stats]) => (
                <li key={zone}>
                  <span>{zone}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        height: 8,
                        width: `${Math.max(4, (stats.discount / maxZoneDiscount) * 80)}px`,
                        background: "var(--color-success)",
                        borderRadius: 4
                      }}
                    />
                    <strong>{formatMoney(adminCurrency, stats.discount)}</strong>
                    <small>{stats.trips} trips</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <article className="admin-reference-card" style={{ marginTop: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Zone impact</h3>
            <p>Discount distribution across Accra service zones</p>
          </div>
        </div>
        {zoneImpact.length === 0 ? (
          <EmptyCard title="No zone data." body="" />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Promo Trips</th>
                  <th>Referral Trips</th>
                  <th>Total Discounts</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {zoneImpact.map(([zone, stats]) => (
                  <tr key={zone}>
                    <td>
                      <strong>{zone}</strong>
                    </td>
                    <td>{stats.promoTrips}</td>
                    <td>{stats.referralTrips}</td>
                    <td>
                      <strong>{formatMoney(adminCurrency, stats.totalDiscount)}</strong>
                    </td>
                    <td>{formatMoney(adminCurrency, stats.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="admin-reference-card" style={{ marginTop: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Highest discount rides</h3>
            <p>Top 10 Accra trips by total discount</p>
          </div>
        </div>
        {topDiscounted.length === 0 ? (
          <EmptyCard title="No discounted rides." body="" />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ride ID</th>
                  <th>Passenger</th>
                  <th>Zone</th>
                  <th>Promo</th>
                  <th>Referral</th>
                  <th>Total Discount</th>
                  <th>Fare</th>
                </tr>
              </thead>
              <tbody>
                {topDiscounted.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code style={{ fontSize: 10 }}>{r.id.slice(-8)}</code>
                    </td>
                    <td>
                      <small>{r.passenger.user.fullName}</small>
                    </td>
                    <td>
                      <small>{r.serviceZone?.name ?? "—"}</small>
                    </td>
                    <td>
                      <small>{formatMoney(r.currency, parseNumber(r.promoDiscount))}</small>
                    </td>
                    <td>
                      <small>{formatMoney(r.currency, parseNumber(r.referralDiscount))}</small>
                    </td>
                    <td>
                      <strong>
                        {formatMoney(
                          r.currency,
                          parseNumber(r.promoDiscount) + parseNumber(r.referralDiscount)
                        )}
                      </strong>
                    </td>
                    <td>
                      <small>{formatMoney(r.currency, parseNumber(r.finalFare ?? r.estimatedFare))}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
