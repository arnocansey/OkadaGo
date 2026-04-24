"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { hasExternalApiBaseUrl, postJson } from "@/lib/api";

interface SettlementPreviewResponse {
  currency: "GHS" | "NGN";
  paymentMethod: "cash" | "card" | "wallet" | "mobile_money";
  riderNetSettlement: number;
  platformNetRevenue: number;
  lineItems: Array<{
    label: string;
    amount: number;
  }>;
}

export function SettlementPreviewWorkbench() {
  const [form, setForm] = useState({
    currency: "GHS",
    paymentMethod: "cash",
    totalFare: "",
    platformCommissionPercent: "",
    gatewayFee: "0",
    riderBonus: "0",
    refundAmount: "0"
  });

  const mutation = useMutation({
    mutationFn: async () =>
      postJson<SettlementPreviewResponse, unknown>("/wallets/settlement-preview", {
        currency: form.currency,
        paymentMethod: form.paymentMethod,
        totalFare: Number(form.totalFare),
        platformCommissionPercent: Number(form.platformCommissionPercent),
        gatewayFee: Number(form.gatewayFee),
        riderBonus: Number(form.riderBonus),
        refundAmount: Number(form.refundAmount)
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
        <p className="kicker">Rider finance surface</p>
        <h4>Rider payout preview</h4>
        <p className="body-muted">
          Test commission and payout outcomes before wiring real ride settlements.
        </p>
      </div>

      {!hasExternalApiBaseUrl ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Set `NEXT_PUBLIC_API_BASE_URL` to enable settlement previews.</strong>
          <p>This workbench needs the standalone backend service.</p>
        </div>
      ) : null}

      <div className="four-up" style={{ marginTop: 18 }}>
        <div className="field-group">
          <label className="field-label">Currency</label>
          <select
            className="select"
            value={form.currency}
            onChange={(event) => updateField("currency", event.target.value)}
          >
            <option value="GHS">GHS</option>
            <option value="NGN">NGN</option>
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Payment method</label>
          <select
            className="select"
            value={form.paymentMethod}
            onChange={(event) => updateField("paymentMethod", event.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="wallet">Wallet</option>
            <option value="mobile_money">Mobile money</option>
          </select>
        </div>
        {[
          ["totalFare", "Total fare"],
          ["platformCommissionPercent", "Commission %"],
          ["gatewayFee", "Gateway fee"],
          ["riderBonus", "Rider bonus"],
          ["refundAmount", "Refund amount"]
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
        <button
          className="button"
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !hasExternalApiBaseUrl}
        >
          {mutation.isPending ? "Calculating..." : "Preview settlement"}
        </button>
      </div>

      {mutation.isError ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Settlement preview failed.</strong>
          <p>{mutation.error.message}</p>
        </div>
      ) : null}

      {mutation.data ? (
        <div className="two-up" style={{ marginTop: 18 }}>
          <article className="workbench-subcard">
            <h4>Net values</h4>
            <div className="workbench-metric-list">
              <p className="body-muted">
                Rider net settlement: <strong>{mutation.data.riderNetSettlement}</strong>
              </p>
              <p className="body-muted">
                Platform net revenue: <strong>{mutation.data.platformNetRevenue}</strong>
              </p>
            </div>
          </article>
          <article className="workbench-subcard">
            <h4>Line items</h4>
            <ul className="workbench-list">
              {mutation.data.lineItems.map((line) => (
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
