"use client";

import { useState, useMemo } from "react";
import { Users2, TrendingUp, Banknote, Gift, Search, X } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { parseNumber } from "./utils";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { PromoCodeRecord, RideRecord } from "./types";

export type ReferralsScreenProps = {
  referralSpend: number;
  promoCodes: PromoCodeRecord[];
  promoAdjustedTrips: RideRecord[];
  adminCurrency: string;
  dataLoading?: boolean;
};

export function ReferralsScreen({
  referralSpend,
  promoCodes,
  promoAdjustedTrips,
  adminCurrency,
  dataLoading = false,
}: ReferralsScreenProps) {
  const [search, setSearch] = useState("");

  const referralCodes = useMemo(
    () =>
      promoCodes.filter(
        (pc) =>
          pc.name.toLowerCase().includes("referral") ||
          pc.code.toLowerCase().includes("referral")
      ),
    [promoCodes]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return referralCodes;
    const q = search.toLowerCase();
    return referralCodes.filter(
      (pc) =>
        pc.code.toLowerCase().includes(q) ||
        pc.name.toLowerCase().includes(q)
    );
  }, [referralCodes, search]);

  const activeReferralCodes = useMemo(
    () =>
      referralCodes.filter(
        (pc) =>
          pc.status === "ACTIVE" ||
          pc.status === "DRAFT"
      ),
    [referralCodes]
  );

  const totalTrips = promoAdjustedTrips.length;
  const avgReferralValue = totalTrips > 0 ? referralSpend / totalTrips : 0;

  if (dataLoading) {
    return (
      <div className="ref-mgmt">
        <div className="ref-loading">
          <div className="ref-loading-spinner" />
          <span>Loading referral data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ref-mgmt">
      <AdminPageHeader
        title="Referrals"
        subtitle="Referral program analytics and management"
      />

      {/* ── KPIs ── */}
      <section className="ref-kpis">
        <article className="ref-kpi ref-kpi--spend">
          <div className="ref-kpi-icon"><Banknote size={18} /></div>
          <div className="ref-kpi-body">
            <span className="ref-kpi-label">Total Referral Spend</span>
            <strong className="ref-kpi-value">{formatMoney(adminCurrency, referralSpend)}</strong>
            <small>Lifetime referral cost</small>
          </div>
        </article>
        <article className="ref-kpi ref-kpi--codes">
          <div className="ref-kpi-icon"><Gift size={18} /></div>
          <div className="ref-kpi-body">
            <span className="ref-kpi-label">Active Referral Codes</span>
            <strong className="ref-kpi-value">{activeReferralCodes.length}</strong>
            <small>Of {referralCodes.length} total</small>
          </div>
        </article>
        <article className="ref-kpi ref-kpi--trips">
          <div className="ref-kpi-icon"><Users2 size={18} /></div>
          <div className="ref-kpi-body">
            <span className="ref-kpi-label">Total Referrals</span>
            <strong className="ref-kpi-value">{totalTrips}</strong>
            <small>Referral-driven trips</small>
          </div>
        </article>
        <article className="ref-kpi ref-kpi--avg">
          <div className="ref-kpi-icon"><TrendingUp size={18} /></div>
          <div className="ref-kpi-body">
            <span className="ref-kpi-label">Avg Referral Value</span>
            <strong className="ref-kpi-value">{formatMoney(adminCurrency, avgReferralValue)}</strong>
            <small>Per referral trip</small>
          </div>
        </article>
      </section>

      {/* ── Toolbar ── */}
      <div className="ref-toolbar">
        <div className="ref-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search referral codes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="ref-search-clear" onClick={() => setSearch("")}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {referralCodes.length === 0 ? (
        <div className="ref-empty">
          <Gift size={40} />
          <h3>No Referral Data</h3>
          <p>Referral codes and their usage will appear here once the referral program is active.</p>
        </div>
      ) : (
        <div className="ref-table-wrap">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Redemptions</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pc) => (
                <tr key={pc.id}>
                  <td>
                    <code className="ref-code">{pc.code}</code>
                  </td>
                  <td>
                    <span className="ref-name">{pc.name}</span>
                  </td>
                  <td>
                    <span className="ref-redemptions">{pc._count?.redemptions ?? 0}</span>
                  </td>
                  <td>
                    <span className={`ref-status ref-status--${pc.status.toLowerCase()}`}>
                      {pc.status}
                    </span>
                  </td>
                  <td>
                    <span className="ref-date">
                      {new Date(pc.createdAt).toLocaleDateString("en-GH", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="ref-no-results">
                    No referral codes match &ldquo;{search}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Summary ── */}
      {referralCodes.length > 0 && (
        <article className="ref-summary">
          <div className="ref-summary-head">
            <Gift size={16} />
            <h3>Referral Program Overview</h3>
          </div>
          <div className="ref-summary-grid">
            <div className="ref-summary-item">
              <span>Total Codes</span>
              <strong>{referralCodes.length}</strong>
            </div>
            <div className="ref-summary-item">
              <span>Active Codes</span>
              <strong>{activeReferralCodes.length}</strong>
            </div>
            <div className="ref-summary-item">
              <span>Total Redemptions</span>
              <strong>
                {referralCodes.reduce((s, pc) => s + (pc._count?.redemptions ?? 0), 0)}
              </strong>
            </div>
            <div className="ref-summary-item">
              <span>Total Spend</span>
              <strong>{formatMoney(adminCurrency, referralSpend)}</strong>
            </div>
            <div className="ref-summary-item">
              <span>Referral Trips</span>
              <strong>{totalTrips}</strong>
            </div>
            <div className="ref-summary-item">
              <span>Avg Value / Trip</span>
              <strong>{formatMoney(adminCurrency, avgReferralValue)}</strong>
            </div>
          </div>
        </article>
      )}

      <style>{`
        .ref-mgmt {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0 0 32px;
        }

        .ref-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 0;
          color: var(--text-muted, #8a8f98);
        }

        .ref-loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border, #2a2d35);
          border-top-color: var(--accent-yellow, #facc15);
          border-radius: 50%;
          animation: ref-spin 0.6s linear infinite;
        }

        @keyframes ref-spin {
          to { transform: rotate(360deg); }
        }

        .ref-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .ref-kpi {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 10px;
          background: var(--card-bg, #14161c);
          border: 1px solid var(--border, #2a2d35);
        }

        .ref-kpi-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .ref-kpi--spend .ref-kpi-icon { background: rgba(250, 204, 21, 0.12); color: var(--accent-yellow, #facc15); }
        .ref-kpi--codes .ref-kpi-icon { background: rgba(52, 211, 153, 0.12); color: var(--color-success, #34d399); }
        .ref-kpi--trips .ref-kpi-icon { background: rgba(96, 165, 250, 0.12); color: var(--color-info, #60a5fa); }
        .ref-kpi--avg .ref-kpi-icon { background: rgba(248, 113, 113, 0.12); color: var(--color-danger, #f87171); }

        .ref-kpi-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .ref-kpi-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted, #8a8f98);
        }

        .ref-kpi-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #f3f4f6);
          white-space: nowrap;
        }

        .ref-kpi-body small {
          font-size: 11px;
          color: var(--text-muted, #8a8f98);
        }

        .ref-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ref-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          background: var(--card-bg, #14161c);
          border: 1px solid var(--border, #2a2d35);
          flex: 1;
          max-width: 360px;
          color: var(--text-muted, #8a8f98);
        }

        .ref-search input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary, #f3f4f6);
          font-size: 13px;
        }

        .ref-search input::placeholder {
          color: var(--text-muted, #8a8f98);
        }

        .ref-search-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--text-muted, #8a8f98);
          cursor: pointer;
          padding: 2px;
        }

        .ref-search-clear:hover {
          color: var(--text-primary, #f3f4f6);
        }

        .ref-table-wrap {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid var(--border, #2a2d35);
          background: var(--card-bg, #14161c);
        }

        .ref-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .ref-table thead th {
          text-align: left;
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted, #8a8f98);
          border-bottom: 1px solid var(--border, #2a2d35);
          white-space: nowrap;
        }

        .ref-table tbody td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border, #2a2d35);
          color: var(--text-secondary, #a1a7b3);
        }

        .ref-table tbody tr:last-child td {
          border-bottom: none;
        }

        .ref-table tbody tr:hover {
          background: var(--hover-bg, rgba(255, 255, 255, 0.03));
        }

        .ref-code {
          font-family: monospace;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--tag-bg, rgba(250, 204, 21, 0.1));
          color: var(--accent-yellow, #facc15);
        }

        .ref-name {
          color: var(--text-primary, #f3f4f6);
          font-weight: 500;
        }

        .ref-redemptions {
          font-weight: 600;
          color: var(--text-primary, #f3f4f6);
        }

        .ref-status {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ref-status--active { background: rgba(52, 211, 153, 0.12); color: var(--color-success, #34d399); }
        .ref-status--draft { background: rgba(96, 165, 250, 0.12); color: var(--color-info, #60a5fa); }
        .ref-status--paused { background: rgba(250, 204, 21, 0.12); color: var(--accent-yellow, #facc15); }
        .ref-status--expired { background: rgba(156, 163, 175, 0.12); color: var(--text-muted, #8a8f98); }
        .ref-status--archived { background: rgba(107, 114, 128, 0.12); color: #6b7280; }

        .ref-date {
          font-size: 12px;
          color: var(--text-muted, #8a8f98);
        }

        .ref-no-results {
          text-align: center;
          padding: 32px 14px !important;
          color: var(--text-muted, #8a8f98);
        }

        .ref-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 20px;
          text-align: center;
          color: var(--text-muted, #8a8f98);
          border: 1px dashed var(--border, #2a2d35);
          border-radius: 10px;
          background: var(--card-bg, #14161c);
        }

        .ref-empty h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary, #f3f4f6);
          margin: 0;
        }

        .ref-empty p {
          font-size: 13px;
          max-width: 360px;
          margin: 0;
        }

        .ref-summary {
          border-radius: 10px;
          background: var(--card-bg, #14161c);
          border: 1px solid var(--border, #2a2d35);
          padding: 16px 20px;
        }

        .ref-summary-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          color: var(--text-primary, #f3f4f6);
        }

        .ref-summary-head h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .ref-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .ref-summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ref-summary-item span {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted, #8a8f98);
        }

        .ref-summary-item strong {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #f3f4f6);
        }

        @media (max-width: 900px) {
          .ref-kpis {
            grid-template-columns: repeat(2, 1fr);
          }
          .ref-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 560px) {
          .ref-kpis {
            grid-template-columns: 1fr;
          }
          .ref-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
