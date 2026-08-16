"use client";

import { useState, useMemo, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { ServiceZoneRecord } from "./types";
import { parseNumber } from "./utils";
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
  Check,
  Edit3,
  X,
  Plus,
  Minus,
  Bike,
  Package,
  ArrowRight,
  Shield,
  Info,
  ChevronRight
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ══════════════════════════════════════════════════════════════════════════════ */

export type PricingManagementScreenProps = {
  zones: ServiceZoneRecord[];
  ridersPerZone: Record<string, number>;
  ridesPerZone: Record<string, number>;
  adminCurrency: string;
  onSavePricing?: (zoneId: string, updates: Partial<ServiceZoneRecord>) => void;
  isMutating?: boolean;
  dataLoading?: boolean;
};

type ServiceTab = "passenger" | "delivery";

type PricingField = {
  key: string;
  label: string;
  icon: typeof DollarSign;
  zoneKey: keyof ServiceZoneRecord;
  description: string;
  suffix?: string;
};

const SERVICE_TABS: Array<{ key: ServiceTab; label: string; icon: typeof Bike }> = [
  { key: "passenger", label: "Passenger Rides", icon: Bike },
  { key: "delivery", label: "Deliveries", icon: Package }
];

const PASSENGER_FIELDS: PricingField[] = [
  { key: "baseFare", label: "Base Fare", icon: DollarSign, zoneKey: "baseFare", description: "Fixed charge when a ride starts" },
  { key: "perKmFee", label: "Per Kilometer", icon: MapPin, zoneKey: "perKmFee", description: "Charge per kilometer traveled" },
  { key: "perMinuteFee", label: "Per Minute", icon: Clock, zoneKey: "perMinuteFee", description: "Charge per minute of ride time" },
  { key: "minimumFare", label: "Minimum Fare", icon: Tag, zoneKey: "minimumFare", description: "Lowest fare for any completed trip" },
  { key: "cancellationFee", label: "Cancellation Fee", icon: AlertTriangle, zoneKey: "cancellationFee", description: "Fee charged when a ride is cancelled" },
  { key: "waitingFeePerMin", label: "Waiting Fee", icon: Clock, zoneKey: "waitingFeePerMin", description: "Fee per minute while rider waits" }
];

const DELIVERY_FIELDS: PricingField[] = [
  { key: "baseFare", label: "Base Fare", icon: DollarSign, zoneKey: "baseFare", description: "Fixed charge when a delivery starts" },
  { key: "perKmFee", label: "Per Kilometer", icon: MapPin, zoneKey: "perKmFee", description: "Charge per kilometer for delivery" },
  { key: "perMinuteFee", label: "Per Minute", icon: Clock, zoneKey: "perMinuteFee", description: "Charge per minute of delivery time" },
  { key: "minimumFare", label: "Minimum Fare", icon: Tag, zoneKey: "minimumFare", description: "Lowest fare for any completed delivery" },
  { key: "cancellationFee", label: "Cancellation Fee", icon: AlertTriangle, zoneKey: "cancellationFee", description: "Fee when a delivery is cancelled" },
  { key: "waitingFeePerMin", label: "Waiting Fee", icon: Clock, zoneKey: "waitingFeePerMin", description: "Fee per minute at pickup/dropoff" }
];

const COMMISSION_RATES: Record<ServiceTab, Array<{ label: string; rate: number }>> = {
  passenger: [
    { label: "OkadaGo Standard", rate: 10 },
    { label: "OkadaX Express", rate: 15 },
    { label: "Cargo Tricycle", rate: 12 }
  ],
  delivery: [
    { label: "Standard Delivery", rate: 10 },
    { label: "Express Delivery", rate: 15 },
    { label: "Cargo Delivery", rate: 12 }
  ]
};

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Fare computation                                                           */
/* ══════════════════════════════════════════════════════════════════════════════ */

function computeFare(params: {
  baseFare: number;
  perKmFee: number;
  perMinuteFee: number;
  minimumFare: number;
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
  const passengerFare = Math.max(params.minimumFare, surgedSubtotal);
  const commission = passengerFare * (params.commissionPercent / 100);
  const riderEarnings = Math.max(0, passengerFare - commission);

  return {
    distanceFee: Math.round(distanceFee * 100) / 100,
    timeFee: Math.round(timeFee * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    surgeAmount: Math.round(surgeAmount * 100) / 100,
    passengerFare: Math.round(passengerFare * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    riderEarnings: Math.round(riderEarnings * 100) / 100,
    bookingFee: params.bookingFee
  };
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
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
  /* ── State ── */
  const [serviceTab, setServiceTab] = useState<ServiceTab>("passenger");
  const [selectedZone, setSelectedZone] = useState<string>(zones[0]?.id ?? "");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishPassword, setPublishPassword] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Array<{ zoneId: string; field: string; oldValue: number; newValue: number }>>([]);
  const [periodSurges, setPeriodSurges] = useState<Record<string, number>>({
    default: 1.0, peak: 1.5, night: 1.3, weekend: 1.2, holiday: 1.8
  });

  /* ── Derived ── */
  const zone = useMemo(() => zones.find((z) => z.id === selectedZone) ?? zones[0], [zones, selectedZone]);
  const activeFields = serviceTab === "passenger" ? PASSENGER_FIELDS : DELIVERY_FIELDS;
  const commissionRates = COMMISSION_RATES[serviceTab];

  /* ── Simulator state ── */
  const [simDistance, setSimDistance] = useState("5");
  const [simDuration, setSimDuration] = useState("15");
  const [simSurge, setSimSurge] = useState("1.0");
  const [simTimePeriod, setSimTimePeriod] = useState("default");

  const simResult = useMemo(() => {
    if (!zone) return null;
    const surge = parseFloat(simSurge) || 1.0;
    const bookingFee = serviceTab === "passenger" ? 2.0 : 3.0;
    return computeFare({
      baseFare: parseNumber(zone.baseFare),
      perKmFee: parseNumber(zone.perKmFee),
      perMinuteFee: parseNumber(zone.perMinuteFee),
      minimumFare: parseNumber(zone.minimumFare),
      bookingFee,
      commissionPercent: commissionRates[0].rate,
      distanceKm: parseFloat(simDistance) || 0,
      durationMin: parseFloat(simDuration) || 0,
      surgeMultiplier: surge
    });
  }, [zone, simDistance, simDuration, simSurge, serviceTab, commissionRates]);

  /* ── Handlers ── */
  const startEdit = useCallback((cardKey: string, currentValue: number) => {
    setEditingCard(cardKey);
    setEditValues({ [cardKey]: String(currentValue) });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingCard(null);
    setEditValues({});
  }, []);

  const saveEdit = useCallback((cardKey: string, field: PricingField) => {
    if (!zone || !onSavePricing) return;
    const newVal = parseFloat(editValues[cardKey]) || 0;
    const rawVal = zone[field.zoneKey];
    const oldVal = parseNumber(typeof rawVal === "number" || typeof rawVal === "string" ? rawVal : 0);
    if (newVal !== oldVal) {
      setPendingChanges((prev) => [
        ...prev.filter((c) => !(c.zoneId === zone.id && c.field === cardKey)),
        { zoneId: zone.id, field: cardKey, oldValue: oldVal, newValue: newVal }
      ]);
    }
    setEditingCard(null);
    setEditValues({});
  }, [zone, editValues, onSavePricing]);

  const handlePublish = useCallback(() => {
    if (!zone || !onSavePricing) return;
    pendingChanges.forEach((change) => {
      const field = activeFields.find((f) => f.key === change.field);
      if (field) {
        onSavePricing(zone.id, { [field.zoneKey]: change.newValue });
      }
    });
    setPendingChanges([]);
    setPublishConfirmOpen(false);
    setPublishPassword("");
  }, [zone, pendingChanges, activeFields, onSavePricing]);

  const revertAll = useCallback(() => {
    setPendingChanges([]);
    setEditingCard(null);
    setEditValues({});
  }, []);

  /* ── Loading ── */
  if (dataLoading) {
    return <AdminPageSkeleton variant="dashboard" kpis={4} />;
  }

  return (
    <div className="pm-mgmt">
      {/* ═══ Header ═══ */}
      <div className="pm-mgmt-header">
        <div className="pm-mgmt-header-left">
          <h1 className="pm-mgmt-title">Pricing Management</h1>
          <p className="pm-mgmt-subtitle">Control fares, fees and rider earnings across OkadaGo services.</p>
        </div>
        <div className="pm-mgmt-header-right">
          {pendingChanges.length > 0 && (
            <span className="pm-mgmt-pending-badge">
              <AlertTriangle size={13} /> {pendingChanges.length} unsaved change{pendingChanges.length > 1 ? "s" : ""}
            </span>
          )}
          <button type="button" className="pm-btn pm-btn--outline" onClick={() => setSimulatorOpen(true)}>
            <Calculator size={14} /> Fare Simulator
          </button>
          <button
            type="button"
            className="pm-btn pm-btn--primary"
            disabled={pendingChanges.length === 0 || isMutating}
            onClick={() => setPublishConfirmOpen(true)}
          >
            <Save size={14} /> Publish Changes
          </button>
        </div>
      </div>

      {/* ═══ Service Tabs ═══ */}
      <div className="pm-mgmt-tabs">
        {SERVICE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              className={`pm-mgmt-tab ${serviceTab === tab.key ? "active" : ""}`}
              onClick={() => { setServiceTab(tab.key); setEditingCard(null); }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ Zone Selector ═══ */}
      <div className="pm-mgmt-toolbar">
        <div className="pm-zone-select">
          <MapPin size={14} />
          <select
            className="pm-zone-dropdown"
            value={selectedZone}
            onChange={(e) => { setSelectedZone(e.target.value); setEditingCard(null); }}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name} — {z.city}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pm-zone-chevron" />
        </div>
        <div className="pm-mgmt-toolbar-right">
          {zone && (
            <>
              <span className={`pm-status-badge ${zone.isActive ? "active" : "inactive"}`}>
                {zone.isActive ? "Active" : "Inactive"}
              </span>
              <span className="pm-zone-meta">{ridersPerZone[zone.id] ?? 0} riders · {ridesPerZone[zone.id] ?? 0} rides</span>
            </>
          )}
        </div>
      </div>

      {/* ═══ Main Layout: Cards + Fare Breakdown ═══ */}
      <div className="pm-mgmt-body">
        {/* ── Pricing Cards Grid ── */}
        <div className="pm-cards-section">
          <div className="pm-cards-header">
            <h2 className="pm-section-title">Pricing Components</h2>
            <span className="pm-section-hint">{serviceTab === "passenger" ? "Passenger ride" : "Delivery"} fares for {zone?.name ?? "—"}</span>
          </div>
          <div className="pm-cards-grid">
            {activeFields.map((field) => {
              const Icon = field.icon;
              const rawFieldVal = zone ? zone[field.zoneKey] : 0;
              const rawVal = parseNumber(typeof rawFieldVal === "number" || typeof rawFieldVal === "string" ? rawFieldVal : 0);
              const isEditing = editingCard === field.key;
              const pending = pendingChanges.find((c) => c.zoneId === zone?.id && c.field === field.key);
              const displayVal = pending ? pending.newValue : rawVal;

              return (
                <article key={field.key} className={`pm-pricing-card ${isEditing ? "editing" : ""} ${pending ? "modified" : ""}`}>
                  <div className="pm-card-header">
                    <div className="pm-card-icon"><Icon size={16} /></div>
                    <div className="pm-card-title-group">
                      <h3 className="pm-card-label">{field.label}</h3>
                      <p className="pm-card-desc">{field.description}</p>
                    </div>
                    {!isEditing && (
                      <button type="button" className="pm-card-edit-btn" onClick={() => startEdit(field.key, displayVal)}>
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="pm-card-value-row">
                    {isEditing ? (
                      <div className="pm-card-edit-row">
                        <input
                          type="number"
                          step="0.1"
                          className="pm-card-edit-input"
                          value={editValues[field.key] ?? ""}
                          onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                          autoFocus
                        />
                        <span className="pm-card-currency">{zone?.currency ?? adminCurrency}</span>
                        <button type="button" className="pm-card-save-btn" onClick={() => saveEdit(field.key, field)}>
                          <Check size={14} />
                        </button>
                        <button type="button" className="pm-card-cancel-btn" onClick={cancelEdit}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="pm-card-value-display">
                        <span className="pm-card-value">{formatMoney(zone?.currency ?? adminCurrency, displayVal)}</span>
                        {pending && (
                          <span className="pm-card-change-badge">
                            was {formatMoney(zone?.currency ?? adminCurrency, rawVal)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pm-card-meta">
                    <span className="pm-card-service-tag">
                      {serviceTab === "passenger" ? "Ride" : "Delivery"}
                    </span>
                    <span className="pm-card-updated">Last updated: {zone?.id ? "Recently" : "—"}</span>
                  </div>
                </article>
              );
            })}

            {/* Commission Card */}
            <article className="pm-pricing-card pm-pricing-card--commission">
              <div className="pm-card-header">
                <div className="pm-card-icon pm-card-icon--orange"><TrendingUp size={16} /></div>
                <div className="pm-card-title-group">
                  <h3 className="pm-card-label">Platform Commission</h3>
                  <p className="pm-card-desc">Percentage earned by OkadaGo per trip</p>
                </div>
              </div>
              <div className="pm-commission-list">
                {commissionRates.map((cr) => (
                  <div key={cr.label} className="pm-commission-row">
                    <span className="pm-commission-label">{cr.label}</span>
                    <span className="pm-commission-value">{cr.rate}%</span>
                  </div>
                ))}
              </div>
              <div className="pm-card-meta">
                <span className="pm-card-service-tag">All services</span>
                <span className="pm-card-updated">Configurable</span>
              </div>
            </article>

            {/* Taxes Card */}
            <article className="pm-pricing-card pm-pricing-card--taxes">
              <div className="pm-card-header">
                <div className="pm-card-icon pm-card-icon--purple"><Tag size={16} /></div>
                <div className="pm-card-title-group">
                  <h3 className="pm-card-label">Applicable Taxes</h3>
                  <p className="pm-card-desc">VAT and other taxes applied to fares</p>
                </div>
              </div>
              <div className="pm-commission-list">
                <div className="pm-commission-row">
                  <span className="pm-commission-label">VAT (Ghana)</span>
                  <span className="pm-commission-value">15%</span>
                </div>
                <div className="pm-commission-row">
                  <span className="pm-commission-label">NHIL</span>
                  <span className="pm-commission-value">2.5%</span>
                </div>
                <div className="pm-commission-row">
                  <span className="pm-commission-label">GETFund</span>
                  <span className="pm-commission-value">2.5%</span>
                </div>
              </div>
              <div className="pm-card-meta">
                <span className="pm-card-service-tag">Government</span>
                <span className="pm-card-updated">Fixed rates</span>
              </div>
            </article>

            {/* Time-Based Pricing Card */}
            <article className="pm-pricing-card pm-pricing-card--surge pm-pricing-card--wide">
              <div className="pm-card-header">
                <div className="pm-card-icon pm-card-icon--yellow"><Zap size={16} /></div>
                <div className="pm-card-title-group">
                  <h3 className="pm-card-label">Time-Based Surge Pricing</h3>
                  <p className="pm-card-desc">Multipliers for different time periods</p>
                </div>
              </div>
              <div className="pm-surge-grid">
                {[
                  { id: "default", label: "Default", desc: "Standard hours" },
                  { id: "peak", label: "Peak Hours", desc: "Mon–Fri 7–9, 17–19" },
                  { id: "night", label: "Night", desc: "22:00–05:00" },
                  { id: "weekend", label: "Weekend", desc: "Sat–Sun" },
                  { id: "holiday", label: "Public Holiday", desc: "National holidays" }
                ].map((tp) => {
                  const val = periodSurges[tp.id] ?? 1.0;
                  const isDefault = tp.id === "default";
                  return (
                    <div key={tp.id} className="pm-surge-item">
                      <div className="pm-surge-info">
                        <span className="pm-surge-label">{tp.label}</span>
                        <span className="pm-surge-desc">{tp.desc}</span>
                      </div>
                      <div className="pm-surge-control">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="5.0"
                          className="pm-surge-input"
                          value={val}
                          disabled={isDefault}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 1.0;
                            setPeriodSurges((prev) => ({ ...prev, [tp.id]: Math.max(0.5, Math.min(5.0, v)) }));
                          }}
                        />
                        <span className="pm-surge-x">×</span>
                        <span className={`pm-surge-status ${val > 1.0 ? "active" : ""}`}>
                          {isDefault ? "—" : val > 1.0 ? "Active" : "Off"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>

        {/* ── Fare Breakdown Preview Panel ── */}
        <aside className="pm-breakdown-panel">
          <div className="pm-breakdown-sticky">
            <h2 className="pm-section-title">Fare Breakdown Preview</h2>
            <p className="pm-section-hint">Estimated fare for a sample trip</p>

            <div className="pm-breakdown-zone">
              <MapPin size={13} />
              <span>{zone?.name ?? "Select zone"}</span>
            </div>

            {simResult && (
              <>
                <div className="pm-breakdown-lines">
                  <div className="pm-breakdown-row">
                    <span>Base Fare</span>
                    <span>{formatMoney(adminCurrency, parseNumber(zone?.baseFare))}</span>
                  </div>
                  <div className="pm-breakdown-row">
                    <span>Distance (5 km × {formatMoney(adminCurrency, parseNumber(zone?.perKmFee))}/km)</span>
                    <span>{formatMoney(adminCurrency, simResult.distanceFee)}</span>
                  </div>
                  <div className="pm-breakdown-row">
                    <span>Time (15 min × {formatMoney(adminCurrency, parseNumber(zone?.perMinuteFee))}/min)</span>
                    <span>{formatMoney(adminCurrency, simResult.timeFee)}</span>
                  </div>
                  <div className="pm-breakdown-row">
                    <span>Booking Fee</span>
                    <span>{formatMoney(adminCurrency, simResult.bookingFee)}</span>
                  </div>
                  {simResult.surgeAmount > 0 && (
                    <div className="pm-breakdown-row pm-breakdown-row--surge">
                      <span>Surge ({simSurge}×)</span>
                      <span>+{formatMoney(adminCurrency, simResult.surgeAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="pm-breakdown-divider" />

                <div className="pm-breakdown-row pm-breakdown-row--fare">
                  <span>Passenger Fare</span>
                  <span>{formatMoney(adminCurrency, simResult.passengerFare)}</span>
                </div>
                <div className="pm-breakdown-row pm-breakdown-row--commission">
                  <span>− OkadaGo Commission ({commissionRates[0].rate}%)</span>
                  <span>−{formatMoney(adminCurrency, simResult.commission)}</span>
                </div>

                <div className="pm-breakdown-divider" />

                <div className="pm-breakdown-row pm-breakdown-row--earnings">
                  <span>= Rider Earnings</span>
                  <span>{formatMoney(adminCurrency, simResult.riderEarnings)}</span>
                </div>

                <button
                  type="button"
                  className="pm-btn pm-btn--ghost pm-btn--full"
                  onClick={() => setSimulatorOpen(true)}
                >
                  <Calculator size={13} /> Open Full Simulator
                </button>
              </>
            )}

            {/* Publish Warning */}
            {pendingChanges.length > 0 && (
              <div className="pm-publish-warning">
                <AlertTriangle size={14} />
                <p>Changing pricing may affect passenger fares and rider earnings. An authorized administrator must confirm.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ═══ Fare Simulator Drawer ═══ */}
      {simulatorOpen && (
        <div className="pm-drawer-backdrop" onClick={() => setSimulatorOpen(false)}>
          <div className="pm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="pm-drawer-header">
              <h2><Calculator size={18} /> Fare Simulator</h2>
              <button type="button" className="pm-drawer-close" onClick={() => setSimulatorOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="pm-drawer-body">
              <div className="pm-sim-grid">
                <div className="pm-sim-field">
                  <label className="pm-sim-label">
                    <MapPin size={13} /> Pickup Location
                  </label>
                  <input type="text" className="pm-sim-input" placeholder="e.g. Osu, Accra" defaultValue="Osu, Accra" />
                </div>
                <div className="pm-sim-field">
                  <label className="pm-sim-label">
                    <MapPin size={13} /> Destination
                  </label>
                  <input type="text" className="pm-sim-input" placeholder="e.g. Airport City" defaultValue="Airport City" />
                </div>
                <div className="pm-sim-field">
                  <label className="pm-sim-label">
                    <MapPin size={13} /> Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="pm-sim-input"
                    value={simDistance}
                    onChange={(e) => setSimDistance(e.target.value)}
                  />
                </div>
                <div className="pm-sim-field">
                  <label className="pm-sim-label">
                    <Clock size={13} /> Duration (min)
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="pm-sim-input"
                    value={simDuration}
                    onChange={(e) => setSimDuration(e.target.value)}
                  />
                </div>
                <div className="pm-sim-field">
                  <label className="pm-sim-label">
                    <Tag size={13} /> Service Type
                  </label>
                  <select className="pm-sim-input" value={serviceTab} onChange={(e) => setServiceTab(e.target.value as ServiceTab)}>
                    {SERVICE_TABS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div className="pm-sim-field">
                  <label className="pm-sim-label">
                    <Clock size={13} /> Time of Day
                  </label>
                  <select className="pm-sim-input" value={simTimePeriod} onChange={(e) => {
                    setSimTimePeriod(e.target.value);
                    setSimSurge(String(periodSurges[e.target.value] ?? 1.0));
                  }}>
                    {Object.entries(periodSurges).map(([k, v]) => (
                      <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)} ({v}×)</option>
                    ))}
                  </select>
                </div>
                <div className="pm-sim-field pm-sim-field--full">
                  <label className="pm-sim-label">
                    <Zap size={13} /> Dynamic Pricing Multiplier
                  </label>
                  <div className="pm-sim-slider-row">
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      className="pm-sim-slider"
                      value={simSurge}
                      onChange={(e) => setSimSurge(e.target.value)}
                    />
                    <span className="pm-sim-slider-value">{simSurge}×</span>
                  </div>
                </div>
              </div>

              {simResult && (
                <div className="pm-sim-result">
                  <h3 className="pm-sim-result-title">Estimated Fare</h3>
                  <div className="pm-sim-result-grid">
                    <div className="pm-sim-result-item pm-sim-result-item--fare">
                      <span className="pm-sim-result-label">Passenger Fare</span>
                      <span className="pm-sim-result-value">{formatMoney(adminCurrency, simResult.passengerFare)}</span>
                    </div>
                    <div className="pm-sim-result-item pm-sim-result-item--rider">
                      <span className="pm-sim-result-label">Rider Earnings</span>
                      <span className="pm-sim-result-value">{formatMoney(adminCurrency, simResult.riderEarnings)}</span>
                    </div>
                    <div className="pm-sim-result-item pm-sim-result-item--platform">
                      <span className="pm-sim-result-label">OkadaGo Revenue</span>
                      <span className="pm-sim-result-value">{formatMoney(adminCurrency, simResult.commission)}</span>
                    </div>
                    <div className="pm-sim-result-item pm-sim-result-item--fee">
                      <span className="pm-sim-result-label">Booking Fee</span>
                      <span className="pm-sim-result-value">{formatMoney(adminCurrency, simResult.bookingFee)}</span>
                    </div>
                  </div>
                  <div className="pm-sim-breakdown">
                    <div className="pm-sim-breakdown-row"><span>Base Fare</span><span>{formatMoney(adminCurrency, parseNumber(zone?.baseFare))}</span></div>
                    <div className="pm-sim-breakdown-row"><span>Distance ({simDistance} km)</span><span>{formatMoney(adminCurrency, simResult.distanceFee)}</span></div>
                    <div className="pm-sim-breakdown-row"><span>Time ({simDuration} min)</span><span>{formatMoney(adminCurrency, simResult.timeFee)}</span></div>
                    <div className="pm-sim-breakdown-row"><span>Booking Fee</span><span>{formatMoney(adminCurrency, simResult.bookingFee)}</span></div>
                    {simResult.surgeAmount > 0 && (
                      <div className="pm-sim-breakdown-row pm-sim-breakdown-row--surge"><span>Surge ({simSurge}×)</span><span>+{formatMoney(adminCurrency, simResult.surgeAmount)}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Publish Confirmation Modal ═══ */}
      {publishConfirmOpen && (
        <div className="pm-modal-backdrop" onClick={() => setPublishConfirmOpen(false)}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-icon"><AlertTriangle size={28} /></div>
            <h3 className="pm-modal-title">Confirm Pricing Change</h3>
            <p className="pm-modal-desc">
              Changing pricing may affect passenger fares and rider earnings. This action requires admin authorization.
            </p>
            <div className="pm-modal-changes">
              {pendingChanges.map((c, i) => {
                const field = activeFields.find((f) => f.key === c.field);
                return (
                  <div key={i} className="pm-modal-change-row">
                    <span>{field?.label ?? c.field}</span>
                    <span className="pm-modal-change-old">{formatMoney(adminCurrency, c.oldValue)}</span>
                    <ChevronRight size={14} />
                    <span className="pm-modal-change-new">{formatMoney(adminCurrency, c.newValue)}</span>
                  </div>
                );
              })}
            </div>
            <div className="pm-modal-field">
              <label className="pm-modal-label">
                <Shield size={13} /> Admin Password
              </label>
              <input
                type="password"
                className="pm-modal-input"
                placeholder="Enter your admin password"
                value={publishPassword}
                onChange={(e) => setPublishPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="pm-modal-actions">
              <button type="button" className="pm-btn pm-btn--ghost" onClick={() => { setPublishConfirmOpen(false); setPublishPassword(""); }}>
                Cancel
              </button>
              <button
                type="button"
                className="pm-btn pm-btn--primary"
                disabled={publishPassword.length < 3 || isMutating}
                onClick={handlePublish}
              >
                {isMutating ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
