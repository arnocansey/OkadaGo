"use client";

import { useState, useMemo, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { OperationsMap } from "@/components/maps/operations-map";
import type { ServiceZoneRecord, RideRecord } from "./types";
import { parseNumber, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY } from "./utils";
import {
  Zap,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Save,
  Play,
  RotateCcw,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  Timer,
  Users,
  Calculator,
  ArrowUp,
  ArrowDown,
  X
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type DynamicPricingScreenProps = {
  zones: ServiceZoneRecord[];
  rides: RideRecord[];
  ridersPerZone: Record<string, number>;
  ridesPerZone: Record<string, number>;
  adminCurrency: string;
  dataLoading?: boolean;
};

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type PricingRule = {
  id: string;
  name: string;
  scope: "CITY" | "ZONE" | "SERVICE_TYPE" | "SCHEDULED_RIDE";
  serviceZoneId?: string | null;
  rideType?: string | null;
  dayOfWeek?: number | null;
  startMinuteOfDay?: number | null;
  endMinuteOfDay?: number | null;
  surgeMultiplier?: number | null;
  baseFareOverride?: number | null;
  perKmFeeOverride?: number | null;
  perMinuteOverride?: number | null;
  minimumFareOverride?: number | null;
  appliesToScheduled: boolean;
  isActive: boolean;
};

type RuleDraft = Omit<PricingRule, "id">;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SERVICE_TYPES = [
  { id: "standard_bike", label: "OkadaGo" },
  { id: "express_bike", label: "OkadaX" },
  { id: "cargo_tricycle", label: "Cargo" }
];

const PRESET_TIME_PERIODS = [
  { label: "Morning Rush", start: "07:00", end: "09:00", desc: "Weekday commute peak" },
  { label: "Evening Rush", start: "17:00", end: "19:00", desc: "Weekday evening peak" },
  { label: "Late Night", start: "22:00", end: "05:00", desc: "Night premium hours" },
  { label: "Weekend", start: "00:00", end: "23:59", desc: "Saturday & Sunday" },
  { label: "Custom", start: "", end: "", desc: "Set your own hours" }
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function computeFarePreview(params: {
  baseFare: number;
  perKmFee: number;
  perMinuteFee: number;
  minimumFare: number;
  commissionPercent: number;
  distanceKm: number;
  durationMin: number;
  surgeMultiplier: number;
}) {
  const distanceFee = params.distanceKm * params.perKmFee;
  const timeFee = params.durationMin * params.perMinuteFee;
  const subtotal = params.baseFare + distanceFee + timeFee;
  const surgedSubtotal = subtotal * params.surgeMultiplier;
  const totalFare = Math.max(params.minimumFare, surgedSubtotal);
  const commission = totalFare * (params.commissionPercent / 100);
  const riderEarnings = Math.max(0, totalFare - commission);
  const surgeAmount = surgedSubtotal - subtotal;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    surgeAmount: Math.round(surgeAmount * 100) / 100,
    totalFare: Math.round(totalFare * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    riderEarnings: Math.round(riderEarnings * 100) / 100
  };
}

function minuteOfDayLabel(mins: number | null | undefined): string {
  if (mins == null) return "—";
  return minutesToTime(mins);
}

/* ── Demand Heatmap Markers ── */

function computeDemandMarkers(rides: RideRecord[], zones: ServiceZoneRecord[]) {
  const zoneDemand = new Map<string, { count: number; name: string; lat: number; lng: number }>();

  for (const zone of zones) {
    zoneDemand.set(zone.id, { count: 0, name: zone.name, lat: ACCRA_MAP_CENTER[0], lng: ACCRA_MAP_CENTER[1] });
  }

  for (const ride of rides) {
    const zoneId = ride.serviceZone?.id;
    if (zoneId && zoneDemand.has(zoneId)) {
      const entry = zoneDemand.get(zoneId)!;
      entry.count++;
    }
  }

  const maxCount = Math.max(1, ...Array.from(zoneDemand.values()).map((d) => d.count));

    return Array.from(zoneDemand.entries()).map(([zoneId, data]) => {
      const intensity = data.count / maxCount;
      const zone = zones.find((z) => z.id === zoneId);
      const lat = zone ? ACCRA_MAP_CENTER[0] + (Math.random() - 0.5) * 0.05 : ACCRA_MAP_CENTER[0];
      const lng = zone ? ACCRA_MAP_CENTER[1] + (Math.random() - 0.5) * 0.05 : ACCRA_MAP_CENTER[1];
      return {
        id: `demand-${zoneId}`,
        position: [lat, lng] as [number, number],
        label: `${data.name}: ${data.count} rides`,
        variant: intensity > 0.7 ? "driverTrip" as const : intensity > 0.3 ? "driverOnline" as const : "driver" as const
      };
    });
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function DynamicPricingScreen({
  zones,
  rides,
  ridersPerZone,
  ridesPerZone,
  adminCurrency,
  dataLoading = false
}: DynamicPricingScreenProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [editingRule, setEditingRule] = useState<RuleDraft | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [previewZone, setPreviewZone] = useState<string>(zones[0]?.id ?? "");
  const [previewDistance, setPreviewDistance] = useState("5");
  const [previewDuration, setPreviewDuration] = useState("15");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [previewRan, setPreviewRan] = useState(false);

  const demandMarkers = useMemo(() => computeDemandMarkers(rides, zones), [rides, zones]);

  const demandByZone = useMemo(() => {
    const map = new Map<string, number>();
    for (const ride of rides) {
      const zoneId = ride.serviceZone?.id;
      if (zoneId) {
        map.set(zoneId, (map.get(zoneId) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([zoneId, count]) => {
        const zone = zones.find((z) => z.id === zoneId);
        return { zoneId, zoneName: zone?.name ?? "Unknown", count, currency: zone?.currency ?? adminCurrency };
      })
      .sort((a, b) => b.count - a.count);
  }, [rides, zones, adminCurrency]);

  const activeRules = useMemo(() => rules.filter((r) => r.isActive), [rules]);
  const avgSurge = useMemo(() => {
    const surges = rules.filter((r) => r.surgeMultiplier && r.surgeMultiplier > 1).map((r) => r.surgeMultiplier!);
    return surges.length > 0 ? surges.reduce((a, b) => a + b, 0) / surges.length : 1;
  }, [rules]);

  const peakDemandZone = demandByZone[0];

  const handleCreateRule = useCallback(() => {
    const draft: RuleDraft = {
      name: "",
      scope: "ZONE",
      serviceZoneId: zones[0]?.id ?? null,
      rideType: null,
      dayOfWeek: null,
      startMinuteOfDay: null,
      endMinuteOfDay: null,
      surgeMultiplier: 1.5,
      baseFareOverride: null,
      perKmFeeOverride: null,
      perMinuteOverride: null,
      minimumFareOverride: null,
      appliesToScheduled: false,
      isActive: true
    };
    setEditingRule(draft);
    setShowRuleForm(true);
  }, [zones]);

  const handleSaveRule = useCallback(() => {
    if (!editingRule || !editingRule.name.trim()) return;
    const newRule: PricingRule = {
      ...editingRule,
      id: `rule-${Date.now()}`
    };
    setRules((prev) => [...prev, newRule]);
    setEditingRule(null);
    setShowRuleForm(false);
  }, [editingRule]);

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleToggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const handlePreview = useCallback(() => {
    setPreviewRan(true);
  }, []);

  const selectedZone = zones.find((z) => z.id === previewZone);

  const previewBaseFare = parseNumber(selectedZone?.baseFare);
  const previewPerKm = parseNumber(selectedZone?.perKmFee);
  const previewPerMin = parseNumber(selectedZone?.perMinuteFee);
  const previewMinFare = parseNumber(selectedZone?.minimumFare);

  const previewResult = useMemo(() => {
    const activeSurgeRule = rules.find(
      (r) => r.isActive && r.surgeMultiplier && r.surgeMultiplier > 1 && (!r.serviceZoneId || r.serviceZoneId === previewZone)
    );
    const surge = activeSurgeRule?.surgeMultiplier ?? 1;

    return computeFarePreview({
      baseFare: editingRule?.baseFareOverride ?? previewBaseFare,
      perKmFee: editingRule?.perKmFeeOverride ?? previewPerKm,
      perMinuteFee: editingRule?.perMinuteOverride ?? previewPerMin,
      minimumFare: editingRule?.minimumFareOverride ?? previewMinFare,
      commissionPercent: 10,
      distanceKm: parseFloat(previewDistance) || 5,
      durationMin: parseInt(previewDuration) || 15,
      surgeMultiplier: editingRule?.surgeMultiplier ?? surge
    });
  }, [rules, previewZone, previewBaseFare, previewPerKm, previewPerMin, previewMinFare, previewDistance, previewDuration, editingRule]);

  const previewWithSurge = useMemo(() => {
    return computeFarePreview({
      baseFare: previewBaseFare,
      perKmFee: previewPerKm,
      perMinuteFee: previewPerMin,
      minimumFare: previewMinFare,
      commissionPercent: 10,
      distanceKm: parseFloat(previewDistance) || 5,
      durationMin: parseInt(previewDuration) || 15,
      surgeMultiplier: 1
    });
  }, [previewBaseFare, previewPerKm, previewPerMin, previewMinFare, previewDistance, previewDuration]);

  const fareImpact = previewResult.totalFare - previewWithSurge.totalFare;

  return (
    <div className="dp-mgmt">
      <AdminPageHeader
        title="Dynamic Pricing"
        subtitle="Configure demand-based pricing rules, surge multipliers, and preview fare impact."
      />

      {/* ── KPI Cards ── */}
      <section className="dp-mgmt-kpis">
        <article className="dp-kpi dp-kpi--info">
          <div className="dp-kpi-icon"><Zap size={18} /></div>
          <div className="dp-kpi-body">
            <span className="dp-kpi-label">Active Rules</span>
            <strong className="dp-kpi-value">{activeRules.length}</strong>
          </div>
        </article>
        <article className="dp-kpi dp-kpi--accent">
          <div className="dp-kpi-icon"><TrendingUp size={18} /></div>
          <div className="dp-kpi-body">
            <span className="dp-kpi-label">Avg Surge</span>
            <strong className="dp-kpi-value">{avgSurge.toFixed(1)}×</strong>
          </div>
        </article>
        <article className="dp-kpi dp-kpi--success">
          <div className="dp-kpi-icon"><MapPin size={18} /></div>
          <div className="dp-kpi-body">
            <span className="dp-kpi-label">Peak Demand</span>
            <strong className="dp-kpi-value">{peakDemandZone?.zoneName ?? "—"}</strong>
          </div>
        </article>
        <article className="dp-kpi dp-kpi--warning">
          <div className="dp-kpi-icon"><BarChart3 size={18} /></div>
          <div className="dp-kpi-body">
            <span className="dp-kpi-label">Total Rides</span>
            <strong className="dp-kpi-value">{rides.length}</strong>
          </div>
        </article>
      </section>

      {/* ── Map + Demand ── */}
      <section className="dp-map-section">
        <div className="dp-map-layout">
          <div className="dp-map-container">
            <OperationsMap
              center={ACCRA_MAP_CENTER}
              zoom={ACCRA_MAP_ZOOM_CITY}
              emptyTitle="No demand data"
              emptyDescription="Ride demand by zone will appear here."
              markers={demandMarkers}
            />
          </div>
          <div className="dp-demand-sidebar">
            <h3 className="dp-section-title"><Activity size={15} /> Demand by Zone</h3>
            <div className="dp-demand-list">
              {demandByZone.length === 0 ? (
                <span className="dp-empty-text">No ride data available.</span>
              ) : (
                demandByZone.map((d, i) => {
                  const maxCount = demandByZone[0]?.count ?? 1;
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={d.zoneId} className="dp-demand-row">
                      <div className="dp-demand-rank">#{i + 1}</div>
                      <div className="dp-demand-info">
                        <span className="dp-demand-name">{d.zoneName}</span>
                        <div className="dp-demand-bar">
                          <div className="dp-demand-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="dp-demand-count">{d.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Rules ── */}
      <section className="dp-rules-section">
        <div className="dp-rules-header">
          <h3 className="dp-section-title"><Zap size={15} /> Pricing Rules</h3>
          <button type="button" className="dp-btn dp-btn--primary" onClick={handleCreateRule}>
            <Plus size={13} /> Create Rule
          </button>
        </div>

        {rules.length === 0 && !showRuleForm ? (
          <div className="dp-rules-empty">
            <Zap size={32} />
            <p>No pricing rules configured yet.</p>
            <button type="button" className="dp-btn dp-btn--primary" onClick={handleCreateRule}>
              <Plus size={13} /> Create Your First Rule
            </button>
          </div>
        ) : (
          <div className="dp-rules-list">
            {rules.map((rule) => (
              <article key={rule.id} className={`dp-rule-card${rule.isActive ? "" : " dp-rule-card--inactive"}`}>
                <button type="button" className="dp-rule-header" onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)}>
                  <div className="dp-rule-header-left">
                    <span className={`dp-rule-status ${rule.isActive ? "dp-rule-status--active" : "dp-rule-status--inactive"}`} />
                    <div className="dp-rule-info">
                      <h4>{rule.name}</h4>
                      <span className="dp-rule-meta">
                        {rule.scope} · {rule.surgeMultiplier ?? 1}× surge
                        {rule.serviceZoneId && ` · ${zones.find((z) => z.id === rule.serviceZoneId)?.name ?? "Zone"}`}
                        {rule.dayOfWeek != null && ` · ${DAY_NAMES[rule.dayOfWeek]}`}
                        {rule.startMinuteOfDay != null && rule.endMinuteOfDay != null && ` · ${minuteOfDayLabel(rule.startMinuteOfDay)}–${minuteOfDayLabel(rule.endMinuteOfDay)}`}
                      </span>
                    </div>
                  </div>
                  <div className="dp-rule-header-right">
                    <button type="button" className="dp-rule-toggle" onClick={(e) => { e.stopPropagation(); handleToggleRule(rule.id); }}>
                      {rule.isActive ? "Disable" : "Enable"}
                    </button>
                    <button type="button" className="dp-rule-delete" onClick={(e) => { e.stopPropagation(); handleDeleteRule(rule.id); }}>
                      <Trash2 size={14} />
                    </button>
                    {expandedRuleId === rule.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {expandedRuleId === rule.id && (
                  <div className="dp-rule-body">
                    <div className="dp-rule-detail-grid">
                      <div className="dp-rule-detail">
                        <span className="dp-rule-detail-label">Scope</span>
                        <span className="dp-rule-detail-value">{rule.scope}</span>
                      </div>
                      <div className="dp-rule-detail">
                        <span className="dp-rule-detail-label">Surge Multiplier</span>
                        <span className="dp-rule-detail-value">{rule.surgeMultiplier ?? 1}×</span>
                      </div>
                      <div className="dp-rule-detail">
                        <span className="dp-rule-detail-label">Service Type</span>
                        <span className="dp-rule-detail-value">{rule.rideType ?? "All"}</span>
                      </div>
                      <div className="dp-rule-detail">
                        <span className="dp-rule-detail-label">Day of Week</span>
                        <span className="dp-rule-detail-value">{rule.dayOfWeek != null ? DAY_NAMES[rule.dayOfWeek] : "Every day"}</span>
                      </div>
                      <div className="dp-rule-detail">
                        <span className="dp-rule-detail-label">Time Window</span>
                        <span className="dp-rule-detail-value">
                          {rule.startMinuteOfDay != null && rule.endMinuteOfDay != null
                            ? `${minuteOfDayLabel(rule.startMinuteOfDay)} – ${minuteOfDayLabel(rule.endMinuteOfDay)}`
                            : "All day"}
                        </span>
                      </div>
                      <div className="dp-rule-detail">
                        <span className="dp-rule-detail-label">Fare Overrides</span>
                        <span className="dp-rule-detail-value">
                          {[
                            rule.baseFareOverride != null && `Base: ${rule.baseFareOverride}`,
                            rule.perKmFeeOverride != null && `Per km: ${rule.perKmFeeOverride}`,
                            rule.perMinuteOverride != null && `Per min: ${rule.perMinuteOverride}`,
                            rule.minimumFareOverride != null && `Min: ${rule.minimumFareOverride}`
                          ].filter(Boolean).join(", ") || "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* ── Rule Editor Form ── */}
        {showRuleForm && editingRule && (
          <div className="dp-rule-form">
            <div className="dp-rule-form-header">
              <h3><Plus size={15} /> New Pricing Rule</h3>
              <button type="button" className="dp-btn dp-btn--ghost" onClick={() => { setShowRuleForm(false); setEditingRule(null); }}>
                <X size={14} />
              </button>
            </div>

            <div className="dp-form-grid">
              <div className="dp-form-field dp-form-field--wide">
                <label className="dp-form-label">Rule Name</label>
                <input
                  type="text"
                  className="dp-form-input"
                  placeholder="e.g. Morning Rush Surge"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                />
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label">Scope</label>
                <select
                  className="dp-form-select"
                  value={editingRule.scope}
                  onChange={(e) => setEditingRule({ ...editingRule, scope: e.target.value as PricingRule["scope"] })}
                >
                  <option value="CITY">City-wide</option>
                  <option value="ZONE">Zone-specific</option>
                  <option value="SERVICE_TYPE">Service Type</option>
                  <option value="SCHEDULED_RIDE">Scheduled Ride</option>
                </select>
              </div>

              {editingRule.scope === "ZONE" && (
                <div className="dp-form-field">
                  <label className="dp-form-label">Service Zone</label>
                  <select
                    className="dp-form-select"
                    value={editingRule.serviceZoneId ?? ""}
                    onChange={(e) => setEditingRule({ ...editingRule, serviceZoneId: e.target.value || null })}
                  >
                    <option value="">Select zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingRule.scope === "SERVICE_TYPE" && (
                <div className="dp-form-field">
                  <label className="dp-form-label">Service Type</label>
                  <select
                    className="dp-form-select"
                    value={editingRule.rideType ?? ""}
                    onChange={(e) => setEditingRule({ ...editingRule, rideType: e.target.value || null })}
                  >
                    <option value="">Select type</option>
                    {SERVICE_TYPES.map((st) => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="dp-form-field">
                <label className="dp-form-label">Day of Week</label>
                <select
                  className="dp-form-select"
                  value={editingRule.dayOfWeek ?? ""}
                  onChange={(e) => setEditingRule({ ...editingRule, dayOfWeek: e.target.value === "" ? null : parseInt(e.target.value) })}
                >
                  <option value="">Every day</option>
                  {DAY_NAMES.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label">Start Time</label>
                <input
                  type="time"
                  className="dp-form-input"
                  value={editingRule.startMinuteOfDay != null ? minutesToTime(editingRule.startMinuteOfDay) : ""}
                  onChange={(e) => setEditingRule({ ...editingRule, startMinuteOfDay: e.target.value ? timeToMinutes(e.target.value) : null })}
                />
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label">End Time</label>
                <input
                  type="time"
                  className="dp-form-input"
                  value={editingRule.endMinuteOfDay != null ? minutesToTime(editingRule.endMinuteOfDay) : ""}
                  onChange={(e) => setEditingRule({ ...editingRule, endMinuteOfDay: e.target.value ? timeToMinutes(e.target.value) : null })}
                />
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label"><Zap size={13} /> Surge Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  className="dp-form-input"
                  value={editingRule.surgeMultiplier ?? 1}
                  onChange={(e) => setEditingRule({ ...editingRule, surgeMultiplier: parseFloat(e.target.value) || 1 })}
                />
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label"><DollarSign size={13} /> Base Fare Override</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="dp-form-input"
                  placeholder={selectedZone ? String(parseNumber(selectedZone.baseFare)) : "0"}
                  value={editingRule.baseFareOverride ?? ""}
                  onChange={(e) => setEditingRule({ ...editingRule, baseFareOverride: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label"><MapPin size={13} /> Per KM Override</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="dp-form-input"
                  placeholder={selectedZone ? String(parseNumber(selectedZone.perKmFee)) : "0"}
                  value={editingRule.perKmFeeOverride ?? ""}
                  onChange={(e) => setEditingRule({ ...editingRule, perKmFeeOverride: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label"><Clock size={13} /> Per Min Override</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="dp-form-input"
                  placeholder={selectedZone ? String(parseNumber(selectedZone.perMinuteFee)) : "0"}
                  value={editingRule.perMinuteOverride ?? ""}
                  onChange={(e) => setEditingRule({ ...editingRule, perMinuteOverride: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>

              <div className="dp-form-field">
                <label className="dp-form-label"><TrendingUp size={13} /> Min Fare Override</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="dp-form-input"
                  placeholder={selectedZone ? String(parseNumber(selectedZone.minimumFare)) : "0"}
                  value={editingRule.minimumFareOverride ?? ""}
                  onChange={(e) => setEditingRule({ ...editingRule, minimumFareOverride: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>

              {/* ── Preset Quick-Fill ── */}
              <div className="dp-form-field dp-form-field--wide">
                <label className="dp-form-label"><Timer size={13} /> Quick Presets</label>
                <div className="dp-preset-chips">
                  {PRESET_TIME_PERIODS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="dp-preset-chip"
                      onClick={() => {
                        if (preset.start && preset.end) {
                          setEditingRule({
                            ...editingRule,
                            startMinuteOfDay: timeToMinutes(preset.start),
                            endMinuteOfDay: timeToMinutes(preset.end),
                            name: editingRule.name || preset.label
                          });
                        }
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="dp-form-actions">
              <button type="button" className="dp-btn dp-btn--outline" onClick={() => { setShowRuleForm(false); setEditingRule(null); }}>
                Cancel
              </button>
              <button type="button" className="dp-btn dp-btn--primary" onClick={handleSaveRule} disabled={!editingRule.name.trim()}>
                <Save size={13} /> Save Rule
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Fare Preview ── */}
      <section className="dp-preview-section">
        <h3 className="dp-section-title"><Calculator size={15} /> Fare Impact Preview</h3>

        <div className="dp-preview-layout">
          <div className="dp-preview-inputs">
            <div className="dp-form-field">
              <label className="dp-form-label"><MapPin size={13} /> Zone</label>
              <select
                className="dp-form-select"
                value={previewZone}
                onChange={(e) => setPreviewZone(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name} — {z.city}</option>
                ))}
              </select>
            </div>

            <div className="dp-preview-row">
              <div className="dp-form-field">
                <label className="dp-form-label">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="dp-form-input"
                  value={previewDistance}
                  onChange={(e) => setPreviewDistance(e.target.value)}
                />
              </div>
              <div className="dp-form-field">
                <label className="dp-form-label">Duration (min)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="dp-form-input"
                  value={previewDuration}
                  onChange={(e) => setPreviewDuration(e.target.value)}
                />
              </div>
            </div>

            {editingRule && (
              <div className="dp-preview-rule-banner">
                <Zap size={14} />
                <span>Preview uses <strong>{editingRule.name || "new rule"}</strong> parameters ({editingRule.surgeMultiplier ?? 1}× surge)</span>
              </div>
            )}

            <button type="button" className="dp-btn dp-btn--primary dp-btn--full" onClick={handlePreview}>
              <Play size={13} /> Run Preview
            </button>
          </div>

          <div className={`dp-preview-results${previewRan ? " dp-preview-results--active" : ""}`}>
            {!previewRan ? (
              <div className="dp-preview-empty">
                <Calculator size={32} />
                <p>Select a zone, enter trip details, and click <strong>Run Preview</strong>.</p>
              </div>
            ) : (
              <>
                <div className="dp-preview-cards">
                  <div className="dp-preview-card dp-preview-card--base">
                    <span className="dp-preview-card-label">Base Fare</span>
                    <strong className="dp-preview-card-value">{formatMoney(adminCurrency, previewResult.subtotal)}</strong>
                    <small>Before surge</small>
                  </div>
                  <div className="dp-preview-card dp-preview-card--surge">
                    <span className="dp-preview-card-label">With Surge</span>
                    <strong className="dp-preview-card-value">{formatMoney(adminCurrency, previewResult.totalFare)}</strong>
                    <small>{editingRule?.surgeMultiplier ?? 1}× multiplier</small>
                  </div>
                  <div className="dp-preview-card dp-preview-card--rider">
                    <span className="dp-preview-card-label">Rider Earns</span>
                    <strong className="dp-preview-card-value">{formatMoney(adminCurrency, previewResult.riderEarnings)}</strong>
                    <small>After 10% commission</small>
                  </div>
                  <div className="dp-preview-card dp-preview-card--commission">
                    <span className="dp-preview-card-label">OkadaGo</span>
                    <strong className="dp-preview-card-value">{formatMoney(adminCurrency, previewResult.commission)}</strong>
                    <small>Platform cut</small>
                  </div>
                </div>

                {fareImpact > 0.01 && (
                  <div className="dp-preview-impact">
                    <ArrowUp size={14} />
                    <span>Passenger pays <strong>{formatMoney(adminCurrency, fareImpact)}</strong> more than standard fare</span>
                  </div>
                )}
                {fareImpact < -0.01 && (
                  <div className="dp-preview-impact dp-preview-impact--down">
                    <ArrowDown size={14} />
                    <span>Passenger pays <strong>{formatMoney(adminCurrency, Math.abs(fareImpact))}</strong> less than standard fare</span>
                  </div>
                )}
                {Math.abs(fareImpact) <= 0.01 && (
                  <div className="dp-preview-impact dp-preview-impact--neutral">
                    <Check size={14} />
                    <span>No fare impact — rule matches base pricing</span>
                  </div>
                )}

                <div className="dp-preview-zone-rates">
                  <span className="dp-preview-zone-label">Zone Base Rates</span>
                  <span>{selectedZone?.name}: Base {formatMoney(adminCurrency, previewBaseFare)} · Per KM {formatMoney(adminCurrency, previewPerKm)} · Per Min {formatMoney(adminCurrency, previewPerMin)} · Min {formatMoney(adminCurrency, previewMinFare)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
