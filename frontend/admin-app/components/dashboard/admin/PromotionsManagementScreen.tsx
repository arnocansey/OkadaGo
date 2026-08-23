"use client";

import { useState, useMemo, Fragment } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { PromoCodeRecord, RideRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";
import { usePagination, AdminPagination } from "./ui/AdminPagination";
import {
  Tag,
  Plus,
  Search,
  X,
  Percent,
  Banknote,
  Gift,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  PauseCircle,
  Archive,
  AlertCircle,
  Pencil,
  Eye,
  EyeOff,
  Filter
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type PromotionsManagementScreenProps = {
  promoCodes: PromoCodeRecord[];
  promoAdjustedTrips: RideRecord[];
  promoSpend: number;
  referralSpend: number;
  adminCurrency: string;
  onCreatePromo?: (input: {
    code: string;
    name: string;
    type: "FLAT" | "PERCENTAGE" | "CREDIT";
    discountValue: number;
    maxDiscount?: number;
    minRideAmount?: number;
    maxRedemptions?: number;
    perUserLimit?: number;
    city?: string;
    currency?: string;
    startsAt?: string;
    endsAt?: string;
    status?: string;
  }) => void;
  onUpdatePromo?: (id: string, updates: Record<string, unknown>) => void;
  isMutating?: boolean;
  dataLoading?: boolean;
};

type PromoType = "ALL" | "FLAT" | "PERCENTAGE" | "CREDIT";
type PromoStatus = "ALL" | "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
type CampaignCategory = "ALL" | "PROMO_CODE" | "REFERRAL" | "FIRST_RIDE" | "DELIVERY" | "TARGETED";

const TYPE_FILTERS: Array<{ id: PromoType; label: string }> = [
  { id: "ALL", label: "All Types" },
  { id: "FLAT", label: "Flat" },
  { id: "PERCENTAGE", label: "Percentage" },
  { id: "CREDIT", label: "Credit" }
];

const STATUS_FILTERS: Array<{ id: PromoStatus; label: string; color: string }> = [
  { id: "ALL", label: "All", color: "var(--text-muted)" },
  { id: "ACTIVE", label: "Active", color: "#22c55e" },
  { id: "DRAFT", label: "Draft", color: "#facc15" },
  { id: "PAUSED", label: "Paused", color: "#fb923c" },
  { id: "EXPIRED", label: "Expired", color: "#ef4444" },
  { id: "ARCHIVED", label: "Archived", color: "#6b7280" }
];

const CATEGORY_FILTERS: Array<{ id: CampaignCategory; label: string }> = [
  { id: "ALL", label: "All Campaigns" },
  { id: "PROMO_CODE", label: "Promo Codes" },
  { id: "REFERRAL", label: "Referral" },
  { id: "FIRST_RIDE", label: "First Ride" },
  { id: "DELIVERY", label: "Delivery" },
  { id: "TARGETED", label: "Targeted" }
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function statusBadge(status: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return { label: "Active", tone: "success" };
  if (s === "draft") return { label: "Draft", tone: "warning" };
  if (s === "paused") return { label: "Paused", tone: "accent" };
  if (s === "expired") return { label: "Expired", tone: "danger" };
  if (s === "archived") return { label: "Archived", tone: "neutral" };
  return { label: status, tone: "neutral" };
}

function typeBadge(type: string) {
  if (type === "FLAT") return { label: "Flat", color: "#3b82f6" };
  if (type === "PERCENTAGE") return { label: "%", color: "#22c55e" };
  if (type === "CREDIT") return { label: "Credit", color: "#a855f7" };
  return { label: type, color: "#6b7280" };
}

function detectCategory(promo: PromoCodeRecord): CampaignCategory {
  const name = (promo.name ?? "").toLowerCase();
  const code = (promo.code ?? "").toLowerCase();
  if (name.includes("referral") || code.includes("ref")) return "REFERRAL";
  if (name.includes("first ride") || name.includes("welcome") || code.includes("first")) return "FIRST_RIDE";
  if (name.includes("delivery") || code.includes("deliver")) return "DELIVERY";
  if (promo.maxRedemptions && promo.maxRedemptions <= 50) return "TARGETED";
  return "PROMO_CODE";
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function PromotionsManagementScreen({
  promoCodes,
  promoAdjustedTrips,
  promoSpend,
  referralSpend,
  adminCurrency,
  onCreatePromo,
  onUpdatePromo,
  isMutating = false,
  dataLoading = false
}: PromotionsManagementScreenProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PromoType>("ALL");
  const [statusFilter, setStatusFilter] = useState<PromoStatus>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CampaignCategory>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "PERCENTAGE" as "FLAT" | "PERCENTAGE" | "CREDIT",
    discountValue: "",
    maxDiscount: "",
    minRideAmount: "",
    maxRedemptions: "",
    perUserLimit: "",
    city: "",
    startsAt: "",
    endsAt: ""
  });

  const stats = useMemo(() => {
    const active = promoCodes.filter((p) => p.status === "ACTIVE").length;
    const draft = promoCodes.filter((p) => p.status === "DRAFT").length;
    const totalRedemptions = promoCodes.reduce((sum, p) => sum + (p._count?.redemptions ?? 0), 0);
    return { active, draft, totalRedemptions };
  }, [promoCodes]);

  const filtered = useMemo(() => {
    return promoCodes.filter((p) => {
      if (typeFilter !== "ALL" && p.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && detectCategory(p) !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !p.code?.toLowerCase().includes(q) &&
          !p.name?.toLowerCase().includes(q) &&
          !p.city?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [promoCodes, typeFilter, statusFilter, categoryFilter, search]);

  const PAGE_SIZE = 10;
  const pagination = usePagination(filtered, PAGE_SIZE);
  const paged = pagination.paginated;

  const handleCreate = () => {
    if (!onCreatePromo || !form.code.trim() || !form.name.trim() || !form.discountValue) return;
    onCreatePromo({
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      discountValue: parseFloat(form.discountValue),
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
      minRideAmount: form.minRideAmount ? parseFloat(form.minRideAmount) : undefined,
      maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : undefined,
      perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : undefined,
      city: form.city.trim() || undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined
    });
    setForm({ code: "", name: "", type: "PERCENTAGE", discountValue: "", maxDiscount: "", minRideAmount: "", maxRedemptions: "", perUserLimit: "", city: "", startsAt: "", endsAt: "" });
    setShowForm(false);
  };

  const handleToggleStatus = (promo: PromoCodeRecord) => {
    if (!onUpdatePromo) return;
    const nextStatus = promo.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    onUpdatePromo(promo.id, { status: nextStatus });
  };

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={8} cols={7} />;
  }

  return (
    <div className="pmg-mgmt">
      <AdminPageHeader
        title="Promotions"
        subtitle="Create and manage promo codes, referral campaigns, and targeted offers."
      />

      {/* ── KPI Cards ── */}
      <section className="pmg-mgmt-kpis">
        <article className="pmg-kpi pmg-kpi--accent">
          <div className="pmg-kpi-icon"><Tag size={18} /></div>
          <div className="pmg-kpi-body">
            <span className="pmg-kpi-label">Total Campaigns</span>
            <strong className="pmg-kpi-value">{promoCodes.length}</strong>
          </div>
        </article>
        <article className="pmg-kpi pmg-kpi--success">
          <div className="pmg-kpi-icon"><CheckCircle size={18} /></div>
          <div className="pmg-kpi-body">
            <span className="pmg-kpi-label">Active</span>
            <strong className="pmg-kpi-value">{stats.active}</strong>
          </div>
        </article>
        <article className="pmg-kpi pmg-kpi--info">
          <div className="pmg-kpi-icon"><Users size={18} /></div>
          <div className="pmg-kpi-body">
            <span className="pmg-kpi-label">Total Redemptions</span>
            <strong className="pmg-kpi-value">{stats.totalRedemptions}</strong>
          </div>
        </article>
        <article className="pmg-kpi pmg-kpi--warning">
          <div className="pmg-kpi-icon"><Banknote size={18} /></div>
          <div className="pmg-kpi-body">
            <span className="pmg-kpi-label">Total Spend</span>
            <strong className="pmg-kpi-value">{formatMoney(adminCurrency, promoSpend + referralSpend)}</strong>
          </div>
        </article>
      </section>

      {/* ── Toolbar ── */}
      <div className="pmg-toolbar">
        <div className="pmg-toolbar-left">
          <div className="pmg-search">
            <Search size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, or city..."
            />
            {search && (
              <button type="button" className="pmg-search-clear" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="pmg-filters">
            <div className="pmg-filter-group">
              <Filter size={13} />
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`pmg-filter-chip${statusFilter === f.id ? " active" : ""}`}
                  style={{ "--chip-color": f.color } as React.CSSProperties}
                  onClick={() => setStatusFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="pmg-filter-group">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`pmg-filter-chip${typeFilter === f.id ? " active" : ""}`}
                  onClick={() => setTypeFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="pmg-filter-group">
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`pmg-filter-chip${categoryFilter === f.id ? " active" : ""}`}
                  onClick={() => setCategoryFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="button" className="pmg-btn pmg-btn--primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Create Promotion
        </button>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <div className="pmg-form">
          <div className="pmg-form-header">
            <h3><Plus size={15} /> New Promotion</h3>
            <button type="button" className="pmg-btn pmg-btn--ghost" onClick={() => setShowForm(false)}>
              <X size={14} />
            </button>
          </div>

          <div className="pmg-form-grid">
            <div className="pmg-form-field">
              <label className="pmg-form-label">Code *</label>
              <input
                type="text"
                className="pmg-form-input"
                placeholder="e.g. WELCOME20"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                maxLength={40}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label">Name *</label>
              <input
                type="text"
                className="pmg-form-input"
                placeholder="e.g. First Ride Offer"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={160}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label">Type *</label>
              <select
                className="pmg-form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
              >
                <option value="FLAT">Flat Amount</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="CREDIT">Wallet Credit</option>
              </select>
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label">
                {form.type === "PERCENTAGE" ? "Discount %" : "Discount Amount"} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="pmg-form-input"
                placeholder={form.type === "PERCENTAGE" ? "20" : "5.00"}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label">Max Discount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="pmg-form-input"
                placeholder="Optional cap"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label">Min Ride Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="pmg-form-input"
                placeholder="Minimum fare"
                value={form.minRideAmount}
                onChange={(e) => setForm({ ...form, minRideAmount: e.target.value })}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label"><Users size={13} /> Max Redemptions</label>
              <input
                type="number"
                step="1"
                min="1"
                className="pmg-form-input"
                placeholder="Unlimited"
                value={form.maxRedemptions}
                onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label">Per User Limit</label>
              <input
                type="number"
                step="1"
                min="1"
                className="pmg-form-input"
                placeholder="Unlimited"
                value={form.perUserLimit}
                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label">City</label>
              <input
                type="text"
                className="pmg-form-input"
                placeholder="e.g. Accra"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label"><Clock size={13} /> Start Date</label>
              <input
                type="datetime-local"
                className="pmg-form-input"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>

            <div className="pmg-form-field">
              <label className="pmg-form-label"><Clock size={13} /> End Date</label>
              <input
                type="datetime-local"
                className="pmg-form-input"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
          </div>

          <div className="pmg-form-actions">
            <button type="button" className="pmg-btn pmg-btn--outline" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="pmg-btn pmg-btn--primary"
              onClick={handleCreate}
              disabled={!form.code.trim() || !form.name.trim() || !form.discountValue || isMutating}
            >
              <Tag size={13} /> Create Promotion
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="pmg-table-wrap">
        {filtered.length === 0 ? (
          <div className="pmg-empty">
            <EmptyCard
              title="No promotions found"
              body={search || typeFilter !== "ALL" || statusFilter !== "ALL" ? "Try adjusting your filters." : "Create your first promotion to get started."}
            />
          </div>
        ) : (
          <div>
          <table className="pmg-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Budget</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((promo) => {
                const badge = statusBadge(promo.status);
                const tBadge = typeBadge(promo.type);
                const category = detectCategory(promo);
                const redemptions = promo._count?.redemptions ?? 0;
                const isExpanded = expandedId === promo.id;

                return (
                  <Fragment key={promo.id}>
                    <tr>
                      <td>
                        <div className="pmg-campaign">
                          <span className="pmg-campaign-name">{promo.name}</span>
                          <span className="pmg-campaign-cat">{category.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td>
                        <code className="pmg-code">{promo.code}</code>
                      </td>
                      <td>
                        <span className="pmg-type-badge" style={{ background: tBadge.color + "20", color: tBadge.color }}>
                          {tBadge.label}
                        </span>
                      </td>
                      <td>
                        <span className="pmg-discount">
                          {promo.type === "PERCENTAGE"
                            ? `${parseNumber(promo.discountValue)}%`
                            : formatMoney(promo.currency ?? adminCurrency, parseNumber(promo.discountValue))}
                          {promo.maxDiscount != null && (
                            <small> (max {formatMoney(promo.currency ?? adminCurrency, parseNumber(promo.maxDiscount))})</small>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="pmg-usage">
                          {redemptions}
                          {promo.maxRedemptions != null && <small> / {promo.maxRedemptions}</small>}
                        </span>
                      </td>
                      <td>
                        <span className="pmg-budget">
                          {promo.maxRedemptions != null && promo.discountValue
                            ? formatMoney(promo.currency ?? adminCurrency, promo.maxRedemptions * parseNumber(promo.discountValue))
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="pmg-date">{promo.startsAt ? formatDateTime(promo.startsAt) : "—"}</span>
                      </td>
                      <td>
                        <span className="pmg-date">{promo.endsAt ? formatDateTime(promo.endsAt) : "—"}</span>
                      </td>
                      <td>
                        <span className={`pmg-badge pmg-badge-${badge.tone}`}>{badge.label}</span>
                      </td>
                      <td>
                        <div className="pmg-actions">
                          <button
                            type="button"
                            className="pmg-action-btn"
                            onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                            title="View details"
                          >
                            {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          {onUpdatePromo && (
                            <>
                              <button
                                type="button"
                                className="pmg-action-btn"
                                onClick={() => handleToggleStatus(promo)}
                                title={promo.status === "ACTIVE" ? "Pause" : "Activate"}
                              >
                                {promo.status === "ACTIVE" ? <PauseCircle size={14} /> : <CheckCircle size={14} />}
                              </button>
                              <button
                                type="button"
                                className="pmg-action-btn"
                                onClick={() => onUpdatePromo(promo.id, { status: "ARCHIVED" })}
                                title="Archive"
                              >
                                <Archive size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="pmg-expanded-row">
                        <td colSpan={10}>
                          <div className="pmg-expanded-content">
                            <div className="pmg-detail-grid">
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Code</span>
                                <code className="pmg-detail-value">{promo.code}</code>
                              </div>
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Type</span>
                                <span className="pmg-detail-value">{tBadge.label}</span>
                              </div>
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Discount</span>
                                <span className="pmg-detail-value">
                                  {promo.type === "PERCENTAGE"
                                    ? `${parseNumber(promo.discountValue)}%`
                                    : formatMoney(promo.currency ?? adminCurrency, parseNumber(promo.discountValue))}
                                </span>
                              </div>
                              {promo.maxDiscount != null && (
                                <div className="pmg-detail-group">
                                  <span className="pmg-detail-label">Max Discount</span>
                                  <span className="pmg-detail-value">{formatMoney(promo.currency ?? adminCurrency, parseNumber(promo.maxDiscount))}</span>
                                </div>
                              )}
                              {promo.minRideAmount != null && (
                                <div className="pmg-detail-group">
                                  <span className="pmg-detail-label">Min Ride Amount</span>
                                  <span className="pmg-detail-value">{formatMoney(promo.currency ?? adminCurrency, parseNumber(promo.minRideAmount))}</span>
                                </div>
                              )}
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Redemptions</span>
                                <span className="pmg-detail-value">{redemptions}{promo.maxRedemptions != null ? ` / ${promo.maxRedemptions}` : ""}</span>
                              </div>
                              {promo.perUserLimit != null && (
                                <div className="pmg-detail-group">
                                  <span className="pmg-detail-label">Per User Limit</span>
                                  <span className="pmg-detail-value">{promo.perUserLimit}</span>
                                </div>
                              )}
                              {promo.city && (
                                <div className="pmg-detail-group">
                                  <span className="pmg-detail-label">City</span>
                                  <span className="pmg-detail-value">{promo.city}</span>
                                </div>
                              )}
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Category</span>
                                <span className="pmg-detail-value">{category.replace("_", " ")}</span>
                              </div>
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Status</span>
                                <span className={`pmg-badge pmg-badge-${badge.tone}`}>{badge.label}</span>
                              </div>
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Start</span>
                                <span className="pmg-detail-value">{promo.startsAt ? formatDateTime(promo.startsAt) : "—"}</span>
                              </div>
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">End</span>
                                <span className="pmg-detail-value">{promo.endsAt ? formatDateTime(promo.endsAt) : "—"}</span>
                              </div>
                              <div className="pmg-detail-group">
                                <span className="pmg-detail-label">Created</span>
                                <span className="pmg-detail-value">{formatDateTime(promo.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <AdminPagination
            page={pagination.page}
            totalItems={pagination.totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={pagination.setPage}
          />
          </div>
        )}
      </div>
    </div>
  );
}
