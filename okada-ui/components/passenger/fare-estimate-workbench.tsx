"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { hasExternalApiBaseUrl, postJson } from "@/lib/api";

interface RideEstimateResponse {
  pricing: {
    subtotal: number;
    totalFare: number;
    riderEarnings: number;
    platformCommission: number;
    surgeAmount: number;
    waitingAmount: number;
    discountAmount: number;
    breakdown: Array<{
      label: string;
      amount: number;
    }>;
  };
  serviceAdvice: {
    countryCode: "GH" | "NG";
    rideType: "standard_bike" | "express_bike";
    recommendedRealtimeChannel: string;
    lightweightModeRecommended: boolean;
  };
}

export function FareEstimateWorkbench() {
  const [form, setForm] = useState({
    pickupAddress: "",
    pickupLatitude: "",
    pickupLongitude: "",
    destinationAddress: "",
    destinationLatitude: "",
    destinationLongitude: "",
    countryCode: "GH",
    currency: "GHS",
    rideType: "standard_bike",
    baseFare: "",
    perKmFee: "",
    perMinuteFee: "",
    minimumFare: "",
    commissionPercent: "",
    surgeMultiplier: "1",
    zoneFee: "0",
    promoDiscount: "0",
    referralDiscount: "0",
    estimatedDistanceKm: "",
    estimatedDurationMinutes: "",
    waitingFeePerMinute: "0",
    waitingMinutes: "0",
    cancellationFee: "0"
  });

  const mutation = useMutation({
    mutationFn: async () =>
      postJson<RideEstimateResponse, unknown>("/rides/estimate", {
        pickup: {
          address: form.pickupAddress,
          latitude: Number(form.pickupLatitude),
          longitude: Number(form.pickupLongitude)
        },
        destination: {
          address: form.destinationAddress,
          latitude: Number(form.destinationLatitude),
          longitude: Number(form.destinationLongitude)
        },
        pricing: {
          countryCode: form.countryCode,
          currency: form.currency,
          rideType: form.rideType,
          baseFare: Number(form.baseFare),
          perKmFee: Number(form.perKmFee),
          perMinuteFee: Number(form.perMinuteFee),
          minimumFare: Number(form.minimumFare),
          cancellationFee: Number(form.cancellationFee),
          waitingFeePerMinute: Number(form.waitingFeePerMinute),
          commissionPercent: Number(form.commissionPercent),
          surgeMultiplier: Number(form.surgeMultiplier),
          zoneFee: Number(form.zoneFee),
          promoDiscount: Number(form.promoDiscount),
          referralDiscount: Number(form.referralDiscount),
          estimatedDistanceKm: Number(form.estimatedDistanceKm),
          estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
          waitingMinutes: Number(form.waitingMinutes)
        }
      })
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  return (
    <section className="workbench-card">
      <div className="workbench-header">
        <p className="kicker">Live pricing surface</p>
        <h4>Fare engine preview</h4>
        <p className="body-muted">
          Use this with live pricing rules or operator-provided values. Nothing is pre-seeded.
        </p>
      </div>

      {!hasExternalApiBaseUrl ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Set `NEXT_PUBLIC_API_BASE_URL` to enable this form.</strong>
          <p>The PWA can talk to the standalone backend once the backend URL is configured.</p>
        </div>
      ) : null}

      <div className="two-up" style={{ marginTop: 18 }}>
        <div className="field-group">
          <label className="field-label">Pickup address</label>
          <input
            className="input"
            value={form.pickupAddress}
            onChange={(event) => updateField("pickupAddress", event.target.value)}
            placeholder="Enter pickup address"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Destination address</label>
          <input
            className="input"
            value={form.destinationAddress}
            onChange={(event) => updateField("destinationAddress", event.target.value)}
            placeholder="Enter destination address"
          />
        </div>
      </div>

      <div className="four-up" style={{ marginTop: 18 }}>
        {[
          ["pickupLatitude", "Pickup latitude"],
          ["pickupLongitude", "Pickup longitude"],
          ["destinationLatitude", "Destination latitude"],
          ["destinationLongitude", "Destination longitude"],
          ["baseFare", "Base fare"],
          ["perKmFee", "Per km fee"],
          ["perMinuteFee", "Per minute fee"],
          ["minimumFare", "Minimum fare"],
          ["commissionPercent", "Commission %"],
          ["estimatedDistanceKm", "Distance km"],
          ["estimatedDurationMinutes", "Duration minutes"],
          ["surgeMultiplier", "Surge multiplier"],
          ["zoneFee", "Zone fee"],
          ["promoDiscount", "Promo discount"],
          ["referralDiscount", "Referral discount"],
          ["waitingMinutes", "Waiting minutes"]
        ].map(([name, label]) => (
          <div className="field-group" key={name}>
            <label className="field-label">{label}</label>
            <input
              className="input"
              value={form[name as keyof typeof form]}
              onChange={(event) => updateField(name as keyof typeof form, event.target.value)}
              placeholder={label}
            />
          </div>
        ))}
      </div>

      <div className="button-row" style={{ marginTop: 18 }}>
        <select
          className="select"
          value={form.countryCode}
          onChange={(event) => updateField("countryCode", event.target.value)}
          style={{ maxWidth: 140 }}
        >
          <option value="GH">Ghana</option>
          <option value="NG">Nigeria</option>
        </select>
        <select
          className="select"
          value={form.currency}
          onChange={(event) => updateField("currency", event.target.value)}
          style={{ maxWidth: 140 }}
        >
          <option value="GHS">GHS</option>
          <option value="NGN">NGN</option>
        </select>
        <select
          className="select"
          value={form.rideType}
          onChange={(event) => updateField("rideType", event.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="standard_bike">Standard bike</option>
          <option value="express_bike">Express bike</option>
        </select>
        <button
          className="button"
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !hasExternalApiBaseUrl}
        >
          {mutation.isPending ? "Calculating..." : "Calculate fare"}
        </button>
      </div>

      {mutation.isError ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Estimate request failed.</strong>
          <p>{mutation.error.message}</p>
        </div>
      ) : null}

      {mutation.data ? (
        <div className="two-up" style={{ marginTop: 18 }}>
          <article className="workbench-subcard">
            <h4>Total fare</h4>
            <div className="workbench-metric-list">
              <p className="body-muted">
                Total: <strong>{mutation.data.pricing.totalFare}</strong>
              </p>
              <p className="body-muted">
                Rider earnings: <strong>{mutation.data.pricing.riderEarnings}</strong>
              </p>
              <p className="body-muted">
                Platform commission: <strong>{mutation.data.pricing.platformCommission}</strong>
              </p>
              <p className="body-muted">
                Realtime channel:{" "}
                <strong>{mutation.data.serviceAdvice.recommendedRealtimeChannel}</strong>
              </p>
            </div>
          </article>
          <article className="workbench-subcard">
            <h4>Fare breakdown</h4>
            <ul className="workbench-list">
              {mutation.data.pricing.breakdown.map((line) => (
                <li key={line.label}>
                  <span>{line.label}</span>
                  <strong>{line.amount}</strong>
                </li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}
    </section>
  );
}
