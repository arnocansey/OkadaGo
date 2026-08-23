"use client";

import { useState, useMemo } from "react";
import { formatMoney } from "@/lib/currency";
import type { ServiceZoneRecord } from "./types";
import { parseNumber } from "./utils";
import {
  Calculator,
  Play,
  RotateCcw,
  MapPin,
  Clock,
  Banknote,
  TrendingUp,
  Wallet,
  ChevronDown
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type FareSimulatorProps = {
  zones: ServiceZoneRecord[];
  activeService: string;
  adminCurrency: string;
};

type FareBreakdownLine = {
  label: string;
  amount: number;
};

type FareResult = {
  totalFare: number;
  riderEarnings: number;
  platformCommission: number;
  breakdown: FareBreakdownLine[];
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function computeFare(params: {
  baseFare: number;
  perKmFee: number;
  perMinuteFee: number;
  minimumFare: number;
  commissionPercent: number;
  bookingFee: number;
  distanceKm: number;
  durationMin: number;
  surgeMultiplier: number;
  waitingMinutes: number;
  waitingFeePerMin: number;
}): FareResult {
  const distanceFee = params.distanceKm * params.perKmFee;
  const timeFee = params.durationMin * params.perMinuteFee;
  const waitingFee = params.waitingMinutes * params.waitingFeePerMin;
  const subtotal = params.baseFare + distanceFee + timeFee + waitingFee + params.bookingFee;
  const surgedSubtotal = subtotal * params.surgeMultiplier;
  const surgeAmount = surgedSubtotal - subtotal;
  const totalFare = Math.max(params.minimumFare, surgedSubtotal);
  const platformCommission = totalFare * (params.commissionPercent / 100);
  const riderEarnings = Math.max(0, totalFare - platformCommission);

  const breakdown: FareBreakdownLine[] = [
    { label: "Base fare", amount: params.baseFare },
    { label: "Distance fee", amount: Math.round(distanceFee * 100) / 100 },
    { label: "Time fee", amount: Math.round(timeFee * 100) / 100 },
  ];

  if (waitingFee > 0) {
    breakdown.push({ label: "Waiting fee", amount: Math.round(waitingFee * 100) / 100 });
  }

  if (params.bookingFee > 0) {
    breakdown.push({ label: "Booking fee", amount: params.bookingFee });
  }

  if (surgeAmount > 0.01) {
    breakdown.push({ label: "Surge adjustment", amount: Math.round(surgeAmount * 100) / 100 });
  }

  if (params.minimumFare > totalFare) {
    breakdown.push({ label: "Minimum fare applied", amount: params.minimumFare });
  }

  return {
    totalFare: Math.round(totalFare * 100) / 100,
    riderEarnings: Math.round(riderEarnings * 100) / 100,
    platformCommission: Math.round(platformCommission * 100) / 100,
    breakdown
  };
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function FareSimulator({
  zones,
  activeService,
  adminCurrency
}: FareSimulatorProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id ?? "");
  const [distanceKm, setDistanceKm] = useState("5");
  const [durationMin, setDurationMin] = useState("15");
  const [surgeMultiplier, setSurgeMultiplier] = useState("1.0");
  const [waitingMinutes, setWaitingMinutes] = useState("0");
  const [commissionOverride, setCommissionOverride] = useState("");
  const [bookingFeeOverride, setBookingFeeOverride] = useState("");
  const [hasRun, setHasRun] = useState(false);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? zones[0],
    [zones, selectedZoneId]
  );

  const serviceCommissions: Record<string, number> = {
    standard_bike: 10,
    express_bike: 15,
    cargo_tricycle: 12
  };

  const params = useMemo(() => ({
    baseFare: parseNumber(selectedZone?.baseFare),
    perKmFee: parseNumber(selectedZone?.perKmFee),
    perMinuteFee: parseNumber(selectedZone?.perMinuteFee),
    minimumFare: parseNumber(selectedZone?.minimumFare),
    commissionPercent: commissionOverride ? parseFloat(commissionOverride) || 10 : serviceCommissions[activeService] ?? 10,
    bookingFee: bookingFeeOverride ? parseFloat(bookingFeeOverride) || 0 : 0,
    distanceKm: parseFloat(distanceKm) || 0,
    durationMin: parseInt(durationMin) || 0,
    surgeMultiplier: parseFloat(surgeMultiplier) || 1,
    waitingMinutes: parseInt(waitingMinutes) || 0,
    waitingFeePerMin: parseNumber(selectedZone?.waitingFeePerMin)
  }), [selectedZone, distanceKm, durationMin, surgeMultiplier, waitingMinutes, commissionOverride, bookingFeeOverride, activeService]);

  const result = useMemo(() => computeFare(params), [params]);

  const handleSimulate = () => {
    setHasRun(true);
  };

  const handleReset = () => {
    setDistanceKm("5");
    setDurationMin("15");
    setSurgeMultiplier("1.0");
    setWaitingMinutes("0");
    setCommissionOverride("");
    setBookingFeeOverride("");
    setHasRun(false);
  };

  return (
    <div className="fs-sim">
      <div className="fs-sim-layout">
        {/* ── Left: Input Form ── */}
        <div className="fs-sim-inputs">
          <div className="fs-sim-zone-select">
            <label className="fs-sim-label">
              <MapPin size={13} /> Service Zone
            </label>
            <div className="fs-sim-select-wrap">
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="fs-sim-select"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {z.city}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="fs-sim-select-icon" />
            </div>
          </div>

          <div className="fs-sim-row">
            <div className="fs-sim-field">
              <label className="fs-sim-label">
                <MapPin size={13} /> Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="fs-sim-input"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
              />
            </div>
            <div className="fs-sim-field">
              <label className="fs-sim-label">
                <Clock size={13} /> Duration (min)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="fs-sim-input"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
          </div>

          <div className="fs-sim-row">
            <div className="fs-sim-field">
              <label className="fs-sim-label">
                <TrendingUp size={13} /> Surge Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                className="fs-sim-input"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(e.target.value)}
              />
            </div>
            <div className="fs-sim-field">
              <label className="fs-sim-label">
                <Clock size={13} /> Waiting (min)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="fs-sim-input"
                value={waitingMinutes}
                onChange={(e) => setWaitingMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="fs-sim-row">
            <div className="fs-sim-field">
              <label className="fs-sim-label">
                <Banknote size={13} /> Commission Override %
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                className="fs-sim-input"
                placeholder={`${serviceCommissions[activeService] ?? 10}`}
                value={commissionOverride}
                onChange={(e) => setCommissionOverride(e.target.value)}
              />
            </div>
            <div className="fs-sim-field">
              <label className="fs-sim-label">
                <Banknote size={13} /> Booking Fee
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="fs-sim-input"
                placeholder="0.00"
                value={bookingFeeOverride}
                onChange={(e) => setBookingFeeOverride(e.target.value)}
              />
            </div>
          </div>

          <div className="fs-sim-actions">
            <button type="button" className="fs-sim-btn fs-sim-btn--primary" onClick={handleSimulate}>
              <Play size={13} /> Simulate Fare
            </button>
            <button type="button" className="fs-sim-btn fs-sim-btn--outline" onClick={handleReset}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className={`fs-sim-results${hasRun ? " fs-sim-results--active" : ""}`}>
          {!hasRun ? (
            <div className="fs-sim-empty">
              <Calculator size={32} />
              <p>Configure trip parameters and click <strong>Simulate Fare</strong> to preview.</p>
            </div>
          ) : (
            <>
              {/* ── Primary Cards ── */}
              <div className="fs-sim-cards">
                <div className="fs-sim-card fs-sim-card--fare">
                  <span className="fs-sim-card-label">Passenger Pays</span>
                  <strong className="fs-sim-card-value">{formatMoney(adminCurrency, result.totalFare)}</strong>
                </div>
                <div className="fs-sim-card fs-sim-card--rider">
                  <span className="fs-sim-card-label">Rider Earns</span>
                  <strong className="fs-sim-card-value">{formatMoney(adminCurrency, result.riderEarnings)}</strong>
                </div>
                <div className="fs-sim-card fs-sim-card--commission">
                  <span className="fs-sim-card-label">OkadaGo Commission</span>
                  <strong className="fs-sim-card-value">{formatMoney(adminCurrency, result.platformCommission)}</strong>
                </div>
              </div>

              {/* ── Breakdown ── */}
              <div className="fs-sim-breakdown">
                <h4 className="fs-sim-breakdown-title">Fare Breakdown</h4>
                <div className="fs-sim-breakdown-list">
                  {result.breakdown.map((line) => (
                    <div key={line.label} className="fs-sim-breakdown-line">
                      <span>{line.label}</span>
                      <span className="fs-sim-breakdown-amount">
                        {line.amount < 0 ? "−" : ""}{formatMoney(adminCurrency, Math.abs(line.amount))}
                      </span>
                    </div>
                  ))}
                  <div className="fs-sim-divider" />
                  <div className="fs-sim-breakdown-line fs-sim-breakdown-total">
                    <span>Total Fare</span>
                    <span>{formatMoney(adminCurrency, result.totalFare)}</span>
                  </div>
                  <div className="fs-sim-breakdown-line fs-sim-breakdown-commission">
                    <span>OkadaGo ({params.commissionPercent}%)</span>
                    <span>{formatMoney(adminCurrency, result.platformCommission)}</span>
                  </div>
                  <div className="fs-sim-breakdown-line fs-sim-breakdown-rider">
                    <span>Rider Earnings</span>
                    <span>{formatMoney(adminCurrency, result.riderEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* ── Zone Info ── */}
              {selectedZone && (
                <div className="fs-sim-zone-info">
                  <span className="fs-sim-zone-info-label">Zone Base Rates</span>
                  <span>{selectedZone.name}: Base {formatMoney(selectedZone.currency, parseNumber(selectedZone.baseFare))} · Per KM {formatMoney(selectedZone.currency, parseNumber(selectedZone.perKmFee))} · Per Min {formatMoney(selectedZone.currency, parseNumber(selectedZone.perMinuteFee))}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
