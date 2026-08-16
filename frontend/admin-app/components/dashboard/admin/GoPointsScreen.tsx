"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import {
  Award,
  Star,
  Gift,
  TrendingUp,
  Users,
  Plus,
  Search,
  X,
  Coins,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type GoPointsScreenProps = {
  adminCurrency: string;
  dataLoading?: boolean;
};

type TabId = "earn" | "redemption" | "ledger" | "balances";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "earn", label: "Earn Rules" },
  { id: "redemption", label: "Redemption Catalog" },
  { id: "ledger", label: "Points Ledger" },
  { id: "balances", label: "Member Balances" },
];

/* ── Sample Data ──────────────────────────────────────────────────────────── */

const EARN_RULES = [
  { rule: "Per Ride (GHS 1 base)", perUnit: 10, minSpend: "—", status: "active" },
  { rule: "Per KM Bonus", perUnit: 5, minSpend: "—", status: "active" },
  { rule: "First Ride Bonus", perUnit: 100, minSpend: "—", status: "active" },
  { rule: "Referral Bonus", perUnit: 250, minSpend: "—", status: "active" },
  { rule: "Rating Bonus (5★)", perUnit: 50, minSpend: "—", status: "inactive" },
];

const REDEMPTION_CATALOG = [
  { reward: "GHS 5 Credit", points: 500, cashValue: 5, available: true },
  { reward: "GHS 10 Credit", points: 950, cashValue: 10, available: true },
  { reward: "Free Ride (up to GHS 15)", points: 1400, cashValue: 15, available: true },
  { reward: "GHS 20 Credit", points: 1800, cashValue: 20, available: false },
];

const LEDGER_ENTRIES = [
  { date: "2026-08-15 14:22", user: "Kwame A.", action: "Ride Completed", points: 45, balance: 1230 },
  { date: "2026-08-15 11:05", user: "Ama D.", action: "Referral Bonus", points: 250, balance: 250 },
  { date: "2026-08-14 18:40", user: "Kofi M.", action: "Points Redeemed", points: -500, balance: 890 },
  { date: "2026-08-14 09:12", user: "Efua S.", action: "First Ride Bonus", points: 100, balance: 100 },
  { date: "2026-08-13 16:55", user: "Kwame A.", action: "Ride Completed", points: 30, balance: 1185 },
];

const MEMBER_BALANCES = [
  { user: "Kwame Asante", earned: 2450, redeemed: 1220, balance: 1230, tier: "Gold" },
  { user: "Ama Darko", earned: 1800, redeemed: 850, balance: 950, tier: "Silver" },
  { user: "Kofi Mensah", earned: 1390, redeemed: 500, balance: 890, tier: "Silver" },
  { user: "Efua Sarpong", earned: 100, redeemed: 0, balance: 100, tier: "Bronze" },
  { user: "Yaw Boateng", earned: 3200, redeemed: 2100, balance: 1100, tier: "Gold" },
];

/* ══════════════════════════════════════════════════════════════════════════════ */

export function GoPointsScreen({ adminCurrency, dataLoading = false }: GoPointsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>("earn");
  const [search, setSearch] = useState("");

  if (dataLoading) {
    return (
      <div className="exact-admin-screen">
        <AdminPageHeader title="GoPoints" subtitle="Loyalty points program management" />
        <div className="gp-loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="GoPoints"
        subtitle="Loyalty points program management"
        actions={
          <div className="admin-screen-toolbar">
            <button type="button" className="admin-btn-primary" style={{ fontSize: "0.78rem" }}>
              <Plus size={13} /> Add Rule
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <section className="admin-kpi-grid">
        <article className="gp-kpi-card gp-kpi--gold">
          <div className="gp-kpi-icon"><Award size={18} /></div>
          <div>
            <span>Total Points Issued</span>
            <strong>245,000</strong>
            <small>All time</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--green">
          <div className="gp-kpi-icon gp-kpi-icon--green"><Gift size={18} /></div>
          <div>
            <span>Points Redeemed</span>
            <strong>89,500</strong>
            <small>36.5% of issued</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--blue">
          <div className="gp-kpi-icon gp-kpi-icon--blue"><Users size={18} /></div>
          <div>
            <span>Active Members</span>
            <strong>1,247</strong>
            <small>Enrolled in GoPoints</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--purple">
          <div className="gp-kpi-icon gp-kpi-icon--purple"><Coins size={18} /></div>
          <div>
            <span>Points Value</span>
            <strong>{formatMoney(adminCurrency, 45600)}</strong>
            <small>Outstanding liability</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--orange">
          <div className="gp-kpi-icon gp-kpi-icon--orange"><TrendingUp size={18} /></div>
          <div>
            <span>Redemption Rate</span>
            <strong>36.5%</strong>
            <small>Healthy engagement</small>
          </div>
        </article>
      </section>

      {/* Tab Bar */}
      <div className="gp-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`gp-tab${activeTab === tab.id ? " gp-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="gp-search-bar">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="gp-search-clear" onClick={() => setSearch("")}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Earn Rules Tab ─────────────────────────────────────────────── */}
      {activeTab === "earn" && (
        <div className="admin-reference-card" style={{ marginTop: 12 }}>
          <div className="admin-reference-cardhead">
            <div><h3>Earn Rules</h3><p>Configure how passengers earn GoPoints</p></div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Points per Unit</th>
                  <th>Minimum Spend</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {EARN_RULES.map((row) => (
                  <tr key={row.rule}>
                    <td><strong>{row.rule}</strong></td>
                    <td><span className="gp-points-badge">+{row.perUnit}</span></td>
                    <td>{row.minSpend}</td>
                    <td>
                      <span className={`gp-status gp-status--${row.status}`}>
                        {row.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Redemption Catalog Tab ─────────────────────────────────────── */}
      {activeTab === "redemption" && (
        <div className="admin-reference-card" style={{ marginTop: 12 }}>
          <div className="admin-reference-cardhead">
            <div><h3>Redemption Catalog</h3><p>Rewards passengers can redeem with GoPoints</p></div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Points Required</th>
                  <th>Cash Value</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {REDEMPTION_CATALOG.map((row) => (
                  <tr key={row.reward}>
                    <td><strong>{row.reward}</strong></td>
                    <td><span className="gp-points-badge">{row.points.toLocaleString()}</span></td>
                    <td>{formatMoney(adminCurrency, row.cashValue)}</td>
                    <td>
                      <span className={`gp-status gp-status--${row.available ? "active" : "inactive"}`}>
                        {row.available ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Points Ledger Tab ──────────────────────────────────────────── */}
      {activeTab === "ledger" && (
        <div className="admin-reference-card" style={{ marginTop: 12 }}>
          <div className="admin-reference-cardhead">
            <div><h3>Points Ledger</h3><p>Recent point transactions across all members</p></div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Points</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {LEDGER_ENTRIES.map((row, i) => (
                  <tr key={i}>
                    <td className="gp-muted">{row.date}</td>
                    <td><strong>{row.user}</strong></td>
                    <td>{row.action}</td>
                    <td>
                      <span className={`gp-points-change ${row.points < 0 ? "gp-points-change--negative" : ""}`}>
                        {row.points > 0 ? "+" : ""}{row.points}
                      </span>
                    </td>
                    <td>{row.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Member Balances Tab ────────────────────────────────────────── */}
      {activeTab === "balances" && (
        <div className="admin-reference-card" style={{ marginTop: 12 }}>
          <div className="admin-reference-cardhead">
            <div><h3>Member Balances</h3><p>GoPoints balance and tier status per member</p></div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Total Earned</th>
                  <th>Total Redeemed</th>
                  <th>Current Balance</th>
                  <th>Tier</th>
                </tr>
              </thead>
              <tbody>
                {MEMBER_BALANCES.map((row) => (
                  <tr key={row.user}>
                    <td><strong>{row.user}</strong></td>
                    <td>{row.earned.toLocaleString()}</td>
                    <td>{row.redeemed.toLocaleString()}</td>
                    <td><span className="gp-points-badge">{row.balance.toLocaleString()}</span></td>
                    <td>
                      <span className={`gp-tier gp-tier--${row.tier.toLowerCase()}`}>
                        {row.tier === "Gold" && <Star size={12} />}
                        {row.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        /* ── KPI Cards ──────────────────────────────────────────────────── */
        .gp-kpi-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          background: var(--card-bg, #1a1d24);
          border: 1px solid var(--border-color, #2a2d35);
          border-radius: 10px;
          min-width: 0;
        }
        .gp-kpi-card > div > span { display: block; font-size: 0.72rem; color: var(--text-muted, #8b8fa3); margin-bottom: 2px; }
        .gp-kpi-card > div > strong { display: block; font-size: 1.25rem; color: var(--text-primary, #f0f0f0); }
        .gp-kpi-card > div > small { display: block; font-size: 0.68rem; color: var(--text-muted, #8b8fa3); margin-top: 2px; }
        .gp-kpi-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(255,165,0,0.12); color: #ffa500; }
        .gp-kpi-icon--green { background: rgba(34,197,94,0.12); color: #22c55e; }
        .gp-kpi-icon--blue { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .gp-kpi-icon--purple { background: rgba(168,85,247,0.12); color: #a855f7; }
        .gp-kpi-icon--orange { background: rgba(255,107,0,0.12); color: #ff6b00; }

        /* ── Tabs ────────────────────────────────────────────────────────── */
        .gp-tabs { display: flex; gap: 0; margin-top: 16px; border-bottom: 1px solid var(--border-color, #2a2d35); }
        .gp-tab {
          padding: 10px 18px;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--text-muted, #8b8fa3);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .gp-tab:hover { color: var(--text-primary, #f0f0f0); }
        .gp-tab--active { color: #ffa500; border-bottom-color: #ffa500; }

        /* ── Search ──────────────────────────────────────────────────────── */
        .gp-search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px 12px;
          background: var(--card-bg, #1a1d24);
          border: 1px solid var(--border-color, #2a2d35);
          border-radius: 8px;
          max-width: 320px;
        }
        .gp-search-bar svg { color: var(--text-muted, #8b8fa3); flex-shrink: 0; }
        .gp-search-bar input { background: transparent; border: none; outline: none; color: var(--text-primary, #f0f0f0); font-size: 0.78rem; width: 100%; }
        .gp-search-bar input::placeholder { color: var(--text-muted, #8b8fa3); }
        .gp-search-clear { background: none; border: none; color: var(--text-muted, #8b8fa3); cursor: pointer; padding: 2px; display: flex; }
        .gp-search-clear:hover { color: var(--text-primary, #f0f0f0); }

        /* ── Badges & Tags ──────────────────────────────────────────────── */
        .gp-points-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(255,165,0,0.12);
          color: #ffa500;
        }
        .gp-status {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .gp-status--active { background: rgba(34,197,94,0.12); color: #22c55e; }
        .gp-status--inactive { background: rgba(239,68,68,0.12); color: #ef4444; }
        .gp-points-change { font-weight: 600; color: #22c55e; }
        .gp-points-change--negative { color: #ef4444; }

        /* ── Tier Badges ────────────────────────────────────────────────── */
        .gp-tier {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .gp-tier--gold { background: rgba(255,165,0,0.15); color: #ffa500; }
        .gp-tier--silver { background: rgba(156,163,175,0.15); color: #9ca3af; }
        .gp-tier--bronze { background: rgba(180,120,60,0.15); color: #b4783c; }

        /* ── Loading ─────────────────────────────────────────────────────── */
        .gp-loading {
          padding: 60px 20px;
          text-align: center;
          color: var(--text-muted, #8b8fa3);
          font-size: 0.82rem;
        }
      `}</style>
    </div>
  );
}
