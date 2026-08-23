"use client";

import { useState, useMemo } from "react";
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

export type GoPointRuleRecord = {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  points: number;
  perUnit: number;
  minSpend?: number;
  active: boolean;
  createdAt: string;
};

export type GoPointBalanceRecord = {
  id: string;
  passengerId: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  passenger: { user: { fullName: string; phoneE164: string } };
};

export type GoPointLedgerRecord = {
  id: string;
  passengerId: string;
  type: string;
  points: number;
  description?: string;
  referenceId?: string;
  createdAt: string;
  passenger: { user: { fullName: string } };
};

export type GoPointRedemptionRecord = {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  cashValue: number;
  available: boolean;
};

export type GoPointsScreenProps = {
  adminCurrency: string;
  dataLoading?: boolean;
  goPointRules: GoPointRuleRecord[];
  goPointBalances: GoPointBalanceRecord[];
  goPointLedger: GoPointLedgerRecord[];
  goPointRedemptions: GoPointRedemptionRecord[];
  onCreateRule: (input: { name: string; description?: string; eventType: string; points: number; perUnit?: number; minSpend?: number; active?: boolean }) => void;
  onUpdateRule: (id: string, updates: Record<string, unknown>) => void;
  onCreateRedemption: (input: { name: string; description?: string; pointsCost: number; cashValue: number; available?: boolean }) => void;
  isMutating?: boolean;
};

type TabId = "earn" | "redemption" | "ledger" | "balances";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "earn", label: "Earn Rules" },
  { id: "redemption", label: "Redemption Catalog" },
  { id: "ledger", label: "Points Ledger" },
  { id: "balances", label: "Member Balances" },
];

/* ══════════════════════════════════════════════════════════════════════════════ */

export function GoPointsScreen({
  adminCurrency,
  dataLoading = false,
  goPointRules,
  goPointBalances,
  goPointLedger,
  goPointRedemptions,
  onCreateRule,
  onUpdateRule,
  onCreateRedemption,
  isMutating = false,
}: GoPointsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>("earn");
  const [search, setSearch] = useState("");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showRedemptionForm, setShowRedemptionForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", description: "", eventType: "", points: 10, perUnit: 1, minSpend: "", active: true });
  const [redemptionForm, setRedemptionForm] = useState({ name: "", description: "", pointsCost: 500, cashValue: 5, available: true });

  const totalIssued = useMemo(() => goPointBalances.reduce((s, b) => s + b.totalEarned, 0), [goPointBalances]);
  const totalRedeemed = useMemo(() => goPointBalances.reduce((s, b) => s + b.totalRedeemed, 0), [goPointBalances]);
  const activeMembers = goPointBalances.length;
  const outstandingPoints = useMemo(() => goPointBalances.reduce((s, b) => s + b.points, 0), [goPointBalances]);
  const redemptionRate = totalIssued > 0 ? ((totalRedeemed / totalIssued) * 100).toFixed(1) : "0.0";

  const filteredRules = useMemo(() => {
    if (!search) return goPointRules;
    const q = search.toLowerCase();
    return goPointRules.filter((r) => r.name.toLowerCase().includes(q) || r.eventType.toLowerCase().includes(q));
  }, [goPointRules, search]);

  const filteredRedemptions = useMemo(() => {
    if (!search) return goPointRedemptions;
    const q = search.toLowerCase();
    return goPointRedemptions.filter((r) => r.name.toLowerCase().includes(q));
  }, [goPointRedemptions, search]);

  const filteredLedger = useMemo(() => {
    if (!search) return goPointLedger;
    const q = search.toLowerCase();
    return goPointLedger.filter((l) => l.passenger.user.fullName.toLowerCase().includes(q) || l.type.toLowerCase().includes(q));
  }, [goPointLedger, search]);

  const filteredBalances = useMemo(() => {
    if (!search) return goPointBalances;
    const q = search.toLowerCase();
    return goPointBalances.filter((b) => b.passenger.user.fullName.toLowerCase().includes(q));
  }, [goPointBalances, search]);

  function submitRule() {
    if (!ruleForm.name.trim() || !ruleForm.eventType.trim()) return;
    if (editingRuleId) {
      onUpdateRule(editingRuleId, {
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        eventType: ruleForm.eventType.trim(),
        points: ruleForm.points,
        perUnit: ruleForm.perUnit,
        minSpend: ruleForm.minSpend ? Number(ruleForm.minSpend) : undefined,
        active: ruleForm.active,
      });
    } else {
      onCreateRule({
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        eventType: ruleForm.eventType.trim(),
        points: ruleForm.points,
        perUnit: ruleForm.perUnit,
        minSpend: ruleForm.minSpend ? Number(ruleForm.minSpend) : undefined,
        active: ruleForm.active,
      });
    }
    setRuleForm({ name: "", description: "", eventType: "", points: 10, perUnit: 1, minSpend: "", active: true });
    setEditingRuleId(null);
    setShowRuleForm(false);
  }

  function startEditRule(rule: GoPointRuleRecord) {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      description: rule.description ?? "",
      eventType: rule.eventType,
      points: rule.points,
      perUnit: rule.perUnit,
      minSpend: rule.minSpend != null ? String(rule.minSpend) : "",
      active: rule.active,
    });
    setShowRuleForm(true);
  }

  function submitRedemption() {
    if (!redemptionForm.name.trim()) return;
    onCreateRedemption({
      name: redemptionForm.name.trim(),
      description: redemptionForm.description.trim() || undefined,
      pointsCost: redemptionForm.pointsCost,
      cashValue: redemptionForm.cashValue,
      available: redemptionForm.available,
    });
    setRedemptionForm({ name: "", description: "", pointsCost: 500, cashValue: 5, available: true });
    setShowRedemptionForm(false);
  }

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
            <button type="button" className="admin-btn-primary" onClick={() => { setShowRuleForm((v) => !v); setEditingRuleId(null); setRuleForm({ name: "", description: "", eventType: "", points: 10, perUnit: 1, minSpend: "", active: true }); }}>
              <Plus size={13} /> {showRuleForm ? "Close form" : "Add Rule"}
            </button>
          </div>
        }
      />

      {showRuleForm && (
        <article className="admin-reference-card" style={{ marginBottom: 16 }}>
          <div className="admin-reference-cardhead">
            <div>
              <h3>{editingRuleId ? "Edit Earn Rule" : "New Earn Rule"}</h3>
              <p>Configure how passengers earn GoPoints</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label>
              Rule Name
              <input className="admin-search-input" value={ruleForm.name} onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Per Ride Bonus" />
            </label>
            <label>
              Event Type
              <input className="admin-search-input" value={ruleForm.eventType} onChange={(e) => setRuleForm((f) => ({ ...f, eventType: e.target.value }))} placeholder="e.g. ride_completed" />
            </label>
            <label>
              Points
              <input className="admin-search-input" type="number" min={1} value={ruleForm.points} onChange={(e) => setRuleForm((f) => ({ ...f, points: Number(e.target.value) }))} />
            </label>
            <label>
              Per Unit
              <input className="admin-search-input" type="number" min={1} value={ruleForm.perUnit} onChange={(e) => setRuleForm((f) => ({ ...f, perUnit: Number(e.target.value) }))} />
            </label>
            <label>
              Min Spend (optional)
              <input className="admin-search-input" type="number" min={0} value={ruleForm.minSpend} onChange={(e) => setRuleForm((f) => ({ ...f, minSpend: e.target.value }))} placeholder="0" />
            </label>
            <label className="admin-form-span">
              Description
              <input className="admin-search-input" value={ruleForm.description} onChange={(e) => setRuleForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </label>
          </div>
          <div className="admin-page-header-actions" style={{ marginTop: 16 }}>
            <button type="button" className="admin-btn-primary" disabled={isMutating} onClick={submitRule}>
              {editingRuleId ? "Update rule" : "Save rule"}
            </button>
            <button type="button" className="admin-btn-secondary" onClick={() => { setShowRuleForm(false); setEditingRuleId(null); }}>
              Cancel
            </button>
          </div>
        </article>
      )}

      {showRedemptionForm && (
        <article className="admin-reference-card" style={{ marginBottom: 16 }}>
          <div className="admin-reference-cardhead">
            <div>
              <h3>New Redemption Item</h3>
              <p>Add a reward passengers can redeem with GoPoints</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label>
              Reward Name
              <input className="admin-search-input" value={redemptionForm.name} onChange={(e) => setRedemptionForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. GHS 5 Credit" />
            </label>
            <label>
              Points Cost
              <input className="admin-search-input" type="number" min={1} value={redemptionForm.pointsCost} onChange={(e) => setRedemptionForm((f) => ({ ...f, pointsCost: Number(e.target.value) }))} />
            </label>
            <label>
              Cash Value ({adminCurrency})
              <input className="admin-search-input" type="number" min={0} step={0.5} value={redemptionForm.cashValue} onChange={(e) => setRedemptionForm((f) => ({ ...f, cashValue: Number(e.target.value) }))} />
            </label>
            <label className="admin-form-span">
              Description
              <input className="admin-search-input" value={redemptionForm.description} onChange={(e) => setRedemptionForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </label>
          </div>
          <div className="admin-page-header-actions" style={{ marginTop: 16 }}>
            <button type="button" className="admin-btn-primary" disabled={isMutating} onClick={submitRedemption}>
              Save redemption item
            </button>
            <button type="button" className="admin-btn-secondary" onClick={() => setShowRedemptionForm(false)}>
              Cancel
            </button>
          </div>
        </article>
      )}

      {/* KPI Cards */}
      <section className="admin-kpi-grid">
        <article className="gp-kpi-card gp-kpi--gold">
          <div className="gp-kpi-icon"><Award size={18} /></div>
          <div>
            <span>Total Points Issued</span>
            <strong>{totalIssued.toLocaleString()}</strong>
            <small>All time</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--green">
          <div className="gp-kpi-icon gp-kpi-icon--green"><Gift size={18} /></div>
          <div>
            <span>Points Redeemed</span>
            <strong>{totalRedeemed.toLocaleString()}</strong>
            <small>{redemptionRate}% of issued</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--blue">
          <div className="gp-kpi-icon gp-kpi-icon--blue"><Users size={18} /></div>
          <div>
            <span>Active Members</span>
            <strong>{activeMembers.toLocaleString()}</strong>
            <small>Enrolled in GoPoints</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--purple">
          <div className="gp-kpi-icon gp-kpi-icon--purple"><Coins size={18} /></div>
          <div>
            <span>Outstanding Points</span>
            <strong>{outstandingPoints.toLocaleString()}</strong>
            <small>Not yet redeemed</small>
          </div>
        </article>
        <article className="gp-kpi-card gp-kpi--orange">
          <div className="gp-kpi-icon gp-kpi-icon--orange"><TrendingUp size={18} /></div>
          <div>
            <span>Earn Rules</span>
            <strong>{goPointRules.length}</strong>
            <small>{goPointRules.filter((r) => r.active).length} active</small>
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
                  <th>Event Type</th>
                  <th>Points</th>
                  <th>Per Unit</th>
                  <th>Min Spend</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No earn rules found</td></tr>
                ) : filteredRules.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td className="gp-muted">{row.eventType}</td>
                    <td><span className="gp-points-badge">+{row.points}</span></td>
                    <td>{row.perUnit}</td>
                    <td>{row.minSpend != null ? formatMoney(adminCurrency, row.minSpend) : "—"}</td>
                    <td>
                      <span className={`gp-status gp-status--${row.active ? "active" : "inactive"}`}>
                        {row.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" className="admin-btn-secondary" style={{ fontSize: "0.72rem", padding: "3px 8px" }} onClick={() => startEditRule(row)}>
                          Edit
                        </button>
                        <button type="button" className="admin-btn-secondary" style={{ fontSize: "0.72rem", padding: "3px 8px" }} onClick={() => onUpdateRule(row.id, { active: !row.active })}>
                          {row.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
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
            <button type="button" className="admin-btn-primary" onClick={() => setShowRedemptionForm((v) => !v)}>
              <Plus size={12} /> {showRedemptionForm ? "Close form" : "Add Item"}
            </button>
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
                {filteredRedemptions.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No redemption items found</td></tr>
                ) : filteredRedemptions.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong></td>
                    <td><span className="gp-points-badge">{row.pointsCost.toLocaleString()}</span></td>
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
                  <th>Type</th>
                  <th>Description</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No ledger entries found</td></tr>
                ) : filteredLedger.map((row) => (
                  <tr key={row.id}>
                    <td className="gp-muted">{new Date(row.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td><strong>{row.passenger.user.fullName}</strong></td>
                    <td>{row.type}</td>
                    <td className="gp-muted">{row.description ?? "—"}</td>
                    <td>
                      <span className={`gp-points-change ${row.points < 0 ? "gp-points-change--negative" : ""}`}>
                        {row.points > 0 ? "+" : ""}{row.points}
                      </span>
                    </td>
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
                </tr>
              </thead>
              <tbody>
                {filteredBalances.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No member balances found</td></tr>
                ) : filteredBalances.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.passenger.user.fullName}</strong></td>
                    <td>{row.totalEarned.toLocaleString()}</td>
                    <td>{row.totalRedeemed.toLocaleString()}</td>
                    <td><span className="gp-points-badge">{row.points.toLocaleString()}</span></td>
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
          padding: 18px 20px;
          background: var(--card-bg, #1a1d24);
          border: 1px solid var(--border-color, #2a2d35);
          border-radius: 14px;
          min-width: 0;
        }
        .gp-kpi-card > div > span { display: block; font-size: 0.72rem; color: var(--text-muted, #8b8fa3); margin-bottom: 2px; }
        .gp-kpi-card > div > strong { display: block; font-size: 1.35rem; color: var(--text-primary, #f0f0f0); }
        .gp-kpi-card > div > small { display: block; font-size: 0.72rem; color: var(--text-muted, #8b8fa3); margin-top: 2px; }
        .gp-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(255,107,0,0.12); color: var(--accent-orange, #ff6b00); }
        .gp-kpi-icon--green { background: rgba(34,197,94,0.12); color: #22c55e; }
        .gp-kpi-icon--blue { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .gp-kpi-icon--purple { background: rgba(168,85,247,0.12); color: #a855f7; }
        .gp-kpi-icon--orange { background: rgba(255,107,0,0.12); color: var(--accent-orange, #ff6b00); }

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
        .gp-tab--active { color: var(--accent-orange, #ff6b00); border-bottom-color: var(--accent-orange, #ff6b00); }

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
        .gp-search-bar input { background: transparent; border: none; outline: none; color: var(--text-primary, #f0f0f0); font-size: 0.8rem; width: 100%; }
        .gp-search-bar input::placeholder { color: var(--text-muted, #8b8fa3); }
        .gp-search-clear { background: none; border: none; color: var(--text-muted, #8b8fa3); cursor: pointer; padding: 2px; display: flex; }
        .gp-search-clear:hover { color: var(--text-primary, #f0f0f0); }

        /* ── Badges & Tags ──────────────────────────────────────────────── */
        .gp-points-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          background: rgba(255,107,0,0.12);
          color: var(--accent-orange, #ff6b00);
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
        .gp-tier--gold { background: rgba(255,165,0,0.15); color: var(--accent-orange, #ff6b00); }
        .gp-tier--silver { background: rgba(156,163,175,0.15); color: #9ca3af; }
        .gp-tier--bronze { background: rgba(180,120,60,0.15); color: #b4783c; }

        /* ── Loading ─────────────────────────────────────────────────────── */
        .gp-loading {
          padding: 60px 20px;
          text-align: center;
          color: var(--text-muted, #8b8fa3);
          font-size: 0.82rem;
        }

        @media (max-width: 768px) {
          .gp-toolbar { flex-direction: column; align-items: stretch; }
          .gp-search-bar { max-width: 100%; }
          .gp-tabs { overflow-x: auto; }
          .gp-tab { white-space: nowrap; font-size: 0.72rem; padding: 8px 14px; }
        }
      `}</style>
    </div>
  );
}
