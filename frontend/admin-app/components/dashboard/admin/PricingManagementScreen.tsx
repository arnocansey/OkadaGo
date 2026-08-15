"use client";

import { useState, useMemo } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { FareSimulator } from "./FareSimulator";
import type { ServiceZoneRecord } from "./types";
import { parseNumber, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY } from "./utils";
import {
  DollarSign,
  MapPin,
  Clock,
  Tag,
  TrendingUp,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calculator,
  Zap,
  AlertTriangle,
  Check
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type PricingManagementScreenProps = {
  zones: ServiceZoneRecord[];
  ridersPerZone: Record<string, number>;
  ridesPerZone: Record<string, number>;
  adminCurrency: string;
  onSavePricing?: (zoneId: string, updates: Partial<ServiceZoneRecord>) => void;
  isMutating?: boolean;
  dataLoading?: boolean;
};

type ServiceType = "standard_bike" | "express_bike" | "cargo_tricycle";

const SERVICE_TYPES: Array<{ id: ServiceType; label: string; tag: string; color: string; commission: number }> = [
  { id: "standard_bike", label: "OkadaGo", tag: "Standard", color: "#22c55e", commission: 10 },
  { id: "express_bike", label: "OkadaX", tag: "Express", color: "#ff6b00", commission: 15 },
  { id: "cargo_tricycle", label: "Cargo", tag: "Tricycle", color: "#3b82f6", commission: 12 }
];

const TIME_PERIODS = [
  { id: "default", label: "Default", description: "Standard hours" },
  { id: "peak", label: "Peak Hours", description: "Mon–Fri 7:00–9:00, 17:00–19:00" },
  { id: "night", label: "Night", description: "22:00–05:00" },
  { id: "weekend", label: "Weekend", description: "Sat–Sun" },
  { id: "holiday", label: "Public Holiday", description: "National holidays" }
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function computeFareBreakdown(params: {
  baseFare: number;
  perKmFee: number;
  perMinuteFee: number;
  minimumFare: number;
  cancellationFee: number;
  bookingFee: number;
  commissionPercent: number;
  distanceKm: number;
  durationMin: number;
  surgeMultiplier: number;
}) {
  const distanceFee = params.distanceKm * params.perKmFee;
  const timeFee = params.durationMin * params.perMinuteFee;
  const subtotal = params.baseFare + distanceFee + timeFee + params.bookingFee;
  const surgedSubtotal = subtotal * params.surgeMultiplier;
  const surgeAmount = surgedSubtotal - subtotal;
  const totalFare = Math.max(params.minimumFare, surgedSubtotal);
  const commission = totalFare * (params.commissionPercent / 100);
  const riderEarnings = Math.max(0, totalFare - commission);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    surgeAmount: Math.round(surgeAmount * 100) / 100,
    totalFare: Math.round(totalFare * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    riderEarnings: Math.round(riderEarnings * 100) / 100,
    distanceFee: Math.round(distanceFee * 100) / 100,
    timeFee: Math.round(timeFee * 100) / 100,
    breakdown: [
      { label: "Base fare", amount: params.baseFare },
      { label: "Distance fee", amount: Math.round(distanceFee * 100) / 100 },
      { label: "Time fee", amount: Math.round(timeFee * 100) / 100 },
      { label: "Booking fee", amount: params.bookingFee },
      ...(surgeAmount > 0 ? [{ label: "Surge adjustment", amount: Math.round(surgeAmount * 100) / 100 }] : [])
    ]
  };
}

/* ── Pricing Zone Card ────────────────────────────────────────────────────── */

function PricingZoneCard({
  zone,
  currency,
  rides,
  riders,
  isExpanded,
  onToggle,
  editingFields,
  onFieldChange,
  isSaving
}: {
  zone: ServiceZoneRecord;
  currency: string;
  rides: number;
  riders: number;
  isExpanded: boolean;
  onToggle: () => void;
  editingFields: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  isSaving: boolean;
}) {
  const fields = [
    { key: "baseFare", label: "Base Fare", icon: DollarSign },
    { key: "perKmFee", label: "Per KM Rate", icon: MapPin },
    { key: "perMinuteFee", label: "Per Minute Rate", icon: Clock },
    { key: "minimumFare", label: "Minimum Fare", icon: TrendingUp },
    { key: "cancellationFee", label: "Cancellation Fee", icon: AlertTriangle },
    { key: "waitingFeePerMin", label: "Waiting Fee/min", icon: Clock }
  ];

  return (
    <article className={`prc-zone-card${zone.isActive ? "" : " prc-zone-card--inactive"}`}>
      <button type="button" className="prc-zone-header" onClick={onToggle}>
        <div className="prc-zone-header-left">
          <div className="prc-zone-header-info">
            <h3>{zone.name}</h3>
            <span className="prc-zone-meta">
              {zone.city} · {currency}
              {zone.isActive ? (
                <span className="prc-badge prc-badge-success">Active</span>
              ) : (
                <span className="prc-badge prc-badge-neutral">Inactive</span>
              )}
            </span>
          </div>
        </div>
        <div className="prc-zone-header-right">
          <span className="prc-zone-stats">
            <span>{riders} riders</span>
            <span>{rides} rides</span>
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="prc-zone-body">
          <div className="prc-zone-fields">
            {fields.map((f) => {
              const Icon = f.icon;
              const zoneVal = (zone as unknown as Record<string, string | number | null | undefined>)[f.key];
              const originalValue = parseNumber(zoneVal ?? 0).toFixed(2);
              const editedValue = editingFields[f.key] ?? "";
              const isDirty = editedValue !== "" && editedValue !== originalValue;
              return (
                <div key={f.key} className={`prc-field${isDirty ? " prc-field--dirty" : ""}`}>
                  <label className="prc-field-label">
                    <Icon size={13} />
                    {f.label}
                  </label>
                  <div className="prc-field-input-wrap">
                    <span className="prc-field-prefix">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="prc-field-input"
                      placeholder={originalValue}
                      value={editedValue}
                      onChange={(e) => onFieldChange(f.key, e.target.value)}
                    />
                    {isDirty && <Check size={13} className="prc-field-check" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="prc-zone-extras">
            <div className="prc-field prc-field--wide">
              <label className="prc-field-label">
                <Tag size={13} />
                Commission %
              </label>
              <div className="prc-field-input-wrap">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="prc-field-input"
                  placeholder="10.00"
                  value={editingFields["commissionPercent"] ?? ""}
                  onChange={(e) => onFieldChange("commissionPercent", e.target.value)}
                />
                <span className="prc-field-suffix">%</span>
                {(editingFields["commissionPercent"] ?? "") !== "" && <Check size={13} className="prc-field-check" />}
              </div>
            </div>

            <div className="prc-field prc-field--wide">
              <label className="prc-field-label">
                <DollarSign size={13} />
                Booking Fee
              </label>
              <div className="prc-field-input-wrap">
                <span className="prc-field-prefix">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="prc-field-input"
                  placeholder="0.00"
                  value={editingFields["bookingFee"] ?? ""}
                  onChange={(e) => onFieldChange("bookingFee", e.target.value)}
                />
                {(editingFields["bookingFee"] ?? "") !== "" && <Check size={13} className="prc-field-check" />}
              </div>
            </div>

            <div className="prc-zone-extras-note">
              <small>
                Changes to this zone will affect all {zone.name} riders.
                {Object.keys(editingFields).length > 0 && (
                  <> <strong>{Object.keys(editingFields).length} field(s) modified.</strong></>
                )}
              </small>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function PricingManagementScreen({
  zones,
  ridersPerZone,
  ridesPerZone,
  adminCurrency,
  onSavePricing,
  isMutating = false,
  dataLoading = false
}: PricingManagementScreenProps) {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [editedZones, setEditedZones] = useState<Record<string, Record<string, string>>>({});
  const [activeServiceTab, setActiveServiceTab] = useState<ServiceType>("standard_bike");
  const [showSimulator, setShowSimulator] = useState(true);

  const handleFieldChange = (zoneId: string, field: string, value: string) => {
    setEditedZones((prev) => ({
      ...prev,
      [zoneId]: { ...(prev[zoneId] ?? {}), [field]: value }
    }));
  };

  const handleSaveZone = (zoneId: string) => {
    if (!onSavePricing) return;
    const edits = editedZones[zoneId] ?? {};
    const updates: Partial<ServiceZoneRecord> = {};
    for (const [key, val] of Object.entries(edits)) {
      if (val === "") continue;
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        (updates as Record<string, unknown>)[key] = numVal;
      }
    }
    if (Object.keys(updates).length > 0) {
      onSavePricing(zoneId, updates);
      setEditedZones((prev) => {
        const next = { ...prev };
        delete next[zoneId];
        return next;
      });
    }
  };

  const handleSaveAll = () => {
    for (const zoneId of Object.keys(editedZones)) {
      handleSaveZone(zoneId);
    }
  };

  const handleReset = () => {
    setEditedZones({});
  };

  const totalEdits = useMemo(
    () => Object.values(editedZones).reduce((sum, zoneEdits) => sum + Object.keys(zoneEdits).length, 0),
    [editedZones]
  );

  const currentService = SERVICE_TYPES.find((s) => s.id === activeServiceTab)!;

  return (
    <div className="prc-mgmt">
      <AdminPageHeader
        title="Pricing Management"
        subtitle="Configure base fares, rates, and commissions across service zones and time periods."
      />

      {/* ── KPI Cards ── */}
      <section className="prc-mgmt-kpis">
        <article className="prc-kpi prc-kpi--info">
          <div className="prc-kpi-icon"><MapPin size={18} /></div>
          <div className="prc-kpi-body">
            <span className="prc-kpi-label">Active Zones</span>
            <strong className="prc-kpi-value">{zones.filter((z) => z.isActive).length}</strong>
          </div>
        </article>
        <article className="prc-kpi prc-kpi--accent">
          <div className="prc-kpi-icon"><Tag size={18} /></div>
          <div className="prc-kpi-body">
            <span className="prc-kpi-label">Service Types</span>
            <strong className="prc-kpi-value">{SERVICE_TYPES.length}</strong>
          </div>
        </article>
        <article className="prc-kpi prc-kpi--success">
          <div className="prc-kpi-icon"><Calculator size={18} /></div>
          <div className="prc-kpi-body">
            <span className="prc-kpi-label">Avg Commission</span>
            <strong className="prc-kpi-value">10–15%</strong>
          </div>
        </article>
        <article className="prc-kpi prc-kpi--warning">
          <div className="prc-kpi-icon"><Zap size={18} /></div>
          <div className="prc-kpi-body">
            <span className="prc-kpi-label">Pending Changes</span>
            <strong className="prc-kpi-value">{totalEdits}</strong>
          </div>
        </article>
      </section>

      {/* ── Service Type Tabs ── */}
      <div className="prc-service-tabs">
        {SERVICE_TYPES.map((st) => (
          <button
            key={st.id}
            type="button"
            className={`prc-service-tab${activeServiceTab === st.id ? " active" : ""}`}
            style={{ "--tab-color": st.color } as React.CSSProperties}
            onClick={() => setActiveServiceTab(st.id)}
          >
            <span className="prc-service-dot" />
            {st.label}
            <span className="prc-service-tag">{st.tag}</span>
          </button>
        ))}
      </div>

      {/* ── Service Type Overview ── */}
      <div className="prc-service-overview">
        <div className="prc-service-card" style={{ borderColor: currentService.color }}>
          <div className="prc-service-card-header">
            <h3>{currentService.label} Pricing</h3>
            <span className="prc-badge" style={{ background: currentService.color + "20", color: currentService.color }}>
              {currentService.tag}
            </span>
          </div>
          <p className="prc-service-desc">
            {activeServiceTab === "standard_bike" && "Standard motorcycle rides — the core OkadaGo experience."}
            {activeServiceTab === "express_bike" && "Premium express rides with faster pickup and priority matching."}
            {activeServiceTab === "cargo_tricycle" && "Tricycle cargo delivery — package and goods transport."}
          </p>
          <div className="prc-service-rates">
            <div className="prc-rate-item">
              <span>Commission</span>
              <strong>{currentService.commission}%</strong>
            </div>
            <div className="prc-rate-item">
              <span>Surge Cap</span>
              <strong>2.5×</strong>
            </div>
            <div className="prc-rate-item">
              <span>Min Fare</span>
              <strong>Zone base</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Time Periods ── */}
      <div className="prc-periods">
        <h3 className="prc-section-title"><Clock size={15} /> Time-Based Pricing</h3>
        <div className="prc-period-grid">
          {TIME_PERIODS.map((tp) => (
            <article key={tp.id} className="prc-period-card">
              <div className="prc-period-header">
                <span className="prc-period-label">{tp.label}</span>
                <span className="prc-period-desc">{tp.description}</span>
              </div>
              <div className="prc-period-rates">
                <span>Surge: 1.0×</span>
                <span>Active: {tp.id === "default" ? "—" : "Rules"}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── Zone Pricing ── */}
      <div className="prc-zones">
        <div className="prc-zones-header">
          <h3 className="prc-section-title"><MapPin size={15} /> Zone Pricing</h3>
          <div className="prc-zones-actions">
            {totalEdits > 0 && (
              <>
                <button type="button" className="prc-btn prc-btn--outline" onClick={handleReset}>
                  <RotateCcw size={13} /> Reset ({totalEdits})
                </button>
                <button type="button" className="prc-btn prc-btn--primary" onClick={handleSaveAll}>
                  <Save size={13} /> Save All ({totalEdits})
                </button>
              </>
            )}
          </div>
        </div>

        <div className="prc-zone-list">
          {zones.map((zone) => (
            <PricingZoneCard
              key={zone.id}
              zone={zone}
              currency={zone.currency || adminCurrency}
              rides={ridesPerZone[zone.id] ?? 0}
              riders={ridersPerZone[zone.id] ?? 0}
              isExpanded={expandedZone === zone.id}
              onToggle={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
              editingFields={editedZones[zone.id] ?? {}}
              onFieldChange={(field, value) => handleFieldChange(zone.id, field, value)}
              isSaving={isMutating}
            />
          ))}
        </div>
      </div>

      {/* ── Fare Simulator ── */}
      <div className="prc-simulator">
        <div className="prc-simulator-header">
          <h3 className="prc-section-title"><Calculator size={15} /> Fare Simulator</h3>
          <button
            type="button"
            className="prc-btn prc-btn--ghost"
            onClick={() => setShowSimulator(!showSimulator)}
          >
            {showSimulator ? "Collapse" : "Expand"}
          </button>
        </div>
        {showSimulator && (
          <FareSimulator
            zones={zones}
            activeService={activeServiceTab}
            adminCurrency={adminCurrency}
          />
        )}
      </div>
    </div>
  );
}
