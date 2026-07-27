"use client";

import { useMemo } from "react";
import { Tag, TrendingUp, Users, Percent } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { RideRecord } from "./types";
import { parseNumber } from "./utils";
import { formatMoney } from "@/lib/currency";

export type PromoPerformanceScreenProps = {
  rides: RideRecord[];
  adminCurrency: string;
};

export function PromoPerformanceScreen({ rides, adminCurrency }: PromoPerformanceScreenProps) {
  const promoRides = useMemo(() => rides.filter((r) => parseNumber(r.promoDiscount) > 0), [rides]);
  const referralRides = useMemo(() => rides.filter((r) => parseNumber(r.referralDiscount) > 0), [rides]);

  const totalPromoDiscount = useMemo(() => promoRides.reduce((s, r) => s + parseNumber(r.promoDiscount), 0), [promoRides]);
  const totalReferralDiscount = useMemo(() => referralRides.reduce((s, r) => s + parseNumber(r.referralDiscount), 0), [referralRides]);

  const avgPromoDiscount = promoRides.length > 0 ? totalPromoDiscount / promoRides.length : 0;
  const avgReferralDiscount = referralRides.length > 0 ? totalReferralDiscount / referralRides.length : 0;

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

  const maxZoneDiscount = Math.max(1, ...promoZoneMap.map(([, v]) => v.discount), ...referralZoneMap.map(([, v]) => v.discount));

  const zoneImpact = useMemo(() => {
    const map: Record<string, { promoTrips: number; referralTrips: number; totalDiscount: number; revenue: number }> = {};
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
      .sort((a, b) => (parseNumber(b.promoDiscount) + parseNumber(b.referralDiscount)) - (parseNumber(a.promoDiscount) + parseNumber(a.referralDiscount)))
      .slice(0, 10);
  }, [rides]);

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Promo Performance"
        subtitle="Analyze promo and referral discount performance across trips and service zones."
      />

      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Tag size={22} /></div>
          <div>
            <span>Promo Trips</span>
            <strong>{promoRides.length}</strong>
            <small>{formatMoney(adminCurrency, totalPromoDiscount)} given</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Users size={22} /></div>
          <div>
            <span>Referral Trips</span>
            <strong>{referralRides.length}</strong>
            <small>{formatMoney(adminCurrency, totalReferralDiscount)} given</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Percent size={22} /></div>
          <div>
            <span>Avg Promo Discount</span>
            <strong>{formatMoney(adminCurrency, avgPromoDiscount)}</strong>
            <small>Per trip</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><TrendingUp size={22} /></div>
          <div>
            <span>Total Discounts</span>
            <strong>{formatMoney(adminCurrency, totalPromoDiscount + totalReferralDiscount)}</strong>
            <small>Promo + Referral</small>
          </div>
        </article>
      </section>

      <div className="admin-screen-grid-2">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div><h3>Promo Performance</h3><p>{promoRides.length} trips with promo codes</p></div>
          </div>
          {promoZoneMap.length === 0 ? (
            <EmptyCard title="No promo data." body="Promo-adjusted rides will appear here." />
          ) : (
            <ul className="admin-summary-list">
              {promoZoneMap.map(([zone, stats]) => (
                <li key={zone}>
                  <span>{zone}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 8, width: `${Math.max(4, (stats.discount / maxZoneDiscount) * 80)}px`, background: "#f7c600", borderRadius: 4 }} />
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
            <div><h3>Referral Performance</h3><p>{referralRides.length} referral-driven trips</p></div>
          </div>
          {referralZoneMap.length === 0 ? (
            <EmptyCard title="No referral data." body="Referral-adjusted rides will appear here." />
          ) : (
            <ul className="admin-summary-list">
              {referralZoneMap.map(([zone, stats]) => (
                <li key={zone}>
                  <span>{zone}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 8, width: `${Math.max(4, (stats.discount / maxZoneDiscount) * 80)}px`, background: "#16a34a", borderRadius: 4 }} />
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
          <div><h3>Zone Impact Analysis</h3><p>Discount distribution across service zones</p></div>
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
                    <td><strong>{zone}</strong></td>
                    <td>{stats.promoTrips}</td>
                    <td>{stats.referralTrips}</td>
                    <td><strong>{formatMoney(adminCurrency, stats.totalDiscount)}</strong></td>
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
          <div><h3>Top 10 Highest Discount Rides</h3></div>
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
                    <td><code style={{ fontSize: 11 }}>{r.id.slice(-8)}</code></td>
                    <td><small>{r.passenger.user.fullName}</small></td>
                    <td><small>{r.serviceZone?.name ?? "—"}</small></td>
                    <td><small>{formatMoney(r.currency, parseNumber(r.promoDiscount))}</small></td>
                    <td><small>{formatMoney(r.currency, parseNumber(r.referralDiscount))}</small></td>
                    <td><strong>{formatMoney(r.currency, parseNumber(r.promoDiscount) + parseNumber(r.referralDiscount))}</strong></td>
                    <td><small>{formatMoney(r.currency, parseNumber(r.finalFare ?? r.estimatedFare))}</small></td>
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
