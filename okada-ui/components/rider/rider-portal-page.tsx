"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  Bike,
  CalendarClock,
  LogOut,
  Star,
  TrendingUp,
  Wallet
} from "lucide-react";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { OperationsMap } from "@/components/maps/operations-map";
import { fetchJson, patchJson, postJson, requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";

type WalletRecord = {
  id: string;
  type: string;
  currency: string;
  availableBalance: string | number;
  lockedBalance: string | number;
};

type RideRecord = {
  id: string;
  riderId: string | null;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare: string | number | null;
  finalFare: string | number | null;
  currency: string;
  createdAt: string;
  passenger: {
    user: {
      fullName: string;
    };
  };
};

type RiderRecord = {
  id: string;
  userId: string;
  onlineStatus: boolean;
  city: string | null;
  commissionPercent: string | number;
  currentLatitude: string | number | null;
  currentLongitude: string | number | null;
  serviceZone: {
    id: string;
    name: string;
  } | null;
  vehicle: {
    make: string;
    model: string;
    plateNumber: string;
    color: string | null;
    year: number | null;
  } | null;
  user: {
    fullName: string;
  };
};

type SettlementPreviewResponse = {
  currency: "GHS" | "NGN";
  paymentMethod: "cash" | "card" | "wallet" | "mobile_money";
  riderNetSettlement: number;
  platformNetRevenue: number;
  lineItems: Array<{
    label: string;
    amount: number;
  }>;
};

type PayoutEligibilityResponse = {
  eligible: boolean;
  availableBalance: number;
  requestedAmount: number;
  remainingBalance: number;
};

type RiderPayoutRequestRecord = {
  id: string;
  method: "BANK_ACCOUNT" | "MOBILE_MONEY";
  status: string;
  amount: string | number;
  currency: string;
  destinationLabel: string;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
};

export type RiderPortalScreen = "dashboard" | "earnings" | "trips";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const riderDeficitWarningThreshold = 100;
const riderDeficitOfflineThreshold = 200;

function formatStatus(status: string) {
  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function AccessState({
  title,
  body,
  actionLabel,
  actionHref
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <ImmersivePage className="exact-rider-page">
      <div className="flow-auth-wall">
        <div className="flow-auth-wall-card">
          <p className="workspace-tag">rider access</p>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="button-row">
            <a href={actionHref} className="button">
              {actionLabel}
            </a>
          </div>
        </div>
      </div>
    </ImmersivePage>
  );
}

function EarningsContent({
  settlementWallet,
  completedRides,
  todayEarnings,
  completedCount,
  riderCommissionPercent,
  token,
  deficitAmount,
  isDeficitWarning,
  isDeficitLocked
}: {
  settlementWallet: WalletRecord | null;
  completedRides: RideRecord[];
  todayEarnings: number;
  completedCount: number;
  riderCommissionPercent: number;
  token: string;
  deficitAmount: number;
  isDeficitWarning: boolean;
  isDeficitLocked: boolean;
}) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const currency = settlementWallet?.currency ?? completedRides[0]?.currency ?? "GHS";
  const availableBalance = parseNumber(settlementWallet?.availableBalance);
  const lockedBalance = parseNumber(settlementWallet?.lockedBalance);
  const averageFare = completedCount === 0 ? 0 : todayEarnings / completedCount;
  const hasDeficit = deficitAmount > 0;
  const deficitRecoveryAmount = isDeficitLocked
    ? roundCurrency(Math.max(1, deficitAmount - riderDeficitOfflineThreshold + 1))
    : 0;
  const [selectedRideId, setSelectedRideId] = useState("");
  const [settlementForm, setSettlementForm] = useState({
    paymentMethod: "mobile_money",
    gatewayFee: "0",
    riderBonus: "0",
    refundAmount: "0"
  });
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    method: "MOBILE_MONEY",
    destinationLabel: ""
  });
  const [deficitTopUpAmount, setDeficitTopUpAmount] = useState("");

  useEffect(() => {
    if (deficitAmount > 0) {
      setDeficitTopUpAmount(String(roundCurrency(deficitAmount)));
    }
  }, [deficitAmount]);

  useEffect(() => {
    if (!selectedRideId && completedRides[0]) {
      setSelectedRideId(completedRides[0].id);
    }
  }, [completedRides, selectedRideId]);

  const payoutRequestsQuery = useQuery({
    queryKey: ["rider-payout-requests", token],
    queryFn: () =>
      requestJson<RiderPayoutRequestRecord[]>("/wallets/rider/payout-requests", {
        token
      }),
    enabled: Boolean(token)
  });

  const selectedRide = useMemo(
    () =>
      completedRides.find((ride) => ride.id === selectedRideId) ??
      completedRides[0] ??
      null,
    [completedRides, selectedRideId]
  );

  const topUpStatus = searchParams.get("topup");
  const topUpMessage = searchParams.get("message");
  const topUpReference = searchParams.get("reference");

  const settlementPreviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRide) {
        throw new Error("Choose a completed ride first to preview settlement.");
      }

      return postJson<SettlementPreviewResponse, unknown>("/wallets/settlement-preview", {
        currency: selectedRide.currency,
        paymentMethod: settlementForm.paymentMethod,
        totalFare: parseNumber(selectedRide.finalFare ?? selectedRide.estimatedFare),
        platformCommissionPercent: riderCommissionPercent,
        gatewayFee: parseNumber(settlementForm.gatewayFee),
        riderBonus: parseNumber(settlementForm.riderBonus),
        refundAmount: parseNumber(settlementForm.refundAmount)
      });
    }
  });

  const payoutEligibilityMutation = useMutation({
    mutationFn: async () =>
      postJson<PayoutEligibilityResponse, unknown>("/wallets/payout-eligibility", {
        availableBalance,
        requestedAmount: parseNumber(payoutForm.amount),
        minimumPayoutAmount: 20,
        hasPendingComplianceIssue: false,
        hasPendingPayout: (payoutRequestsQuery.data ?? []).some((request) =>
          ["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"].includes(request.status)
        )
      })
  });

  const payoutRequestMutation = useMutation({
    mutationFn: async () =>
      requestJson<{
        payoutRequest: RiderPayoutRequestRecord;
        remainingBalance: number;
        minimumPayoutAmount: number;
      }>("/wallets/rider/payout-requests", {
        method: "POST",
        body: JSON.stringify({
          amount: parseNumber(payoutForm.amount),
          method: payoutForm.method,
          destinationLabel: payoutForm.destinationLabel
        }),
        token
      }),
    onSuccess: async () => {
      setPayoutForm((current) => ({
        ...current,
        amount: ""
      }));
      await queryClient.invalidateQueries({ queryKey: ["wallets"] });
      await queryClient.invalidateQueries({ queryKey: ["rider-payout-requests", token] });
    }
  });

  const deficitTopUpMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(deficitTopUpAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid amount to settle the rider deficit.");
      }

      return requestJson<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", {
        method: "POST",
        token,
        body: JSON.stringify({
          amount,
          currency,
          walletType: "rider_settlement",
          description: "Rider settlement deficit payment"
        })
      });
    },
    onSuccess: (payload) => {
      window.location.href = payload.authorizationUrl;
    }
  });

  return (
    <main className="exact-rider-content">
      <section className="exact-rider-page-head">
        <div>
          <p className="workspace-tag">rider earnings</p>
          <h1>Earnings overview</h1>
          <p className="body-muted">
            Live settlement balances and completed-trip payouts, based on the same backend wallet and ride records.
          </p>
        </div>
      </section>

      <section className="exact-rider-stat-grid">
        <article className="exact-rider-stat-card accent">
          <span>Available balance</span>
          <strong>{formatMoney(currency, availableBalance)}</strong>
          <small>Ready for payout</small>
        </article>
        <article className="exact-rider-stat-card">
          <span>Locked balance</span>
          <strong>{formatMoney(currency, lockedBalance)}</strong>
          <small>Pending settlement</small>
        </article>
        <article className="exact-rider-stat-card">
          <span>Completed trips</span>
          <strong>{completedCount}</strong>
          <small>Closed backend ride records</small>
        </article>
        <article className="exact-rider-stat-card">
          <span>Average trip fare</span>
          <strong>{formatMoney(currency, averageFare)}</strong>
          <small>Across completed rides</small>
        </article>
      </section>

      <section className="exact-rider-policy-grid">
        <article className="workbench-card exact-rider-policy-card">
          <div className="workbench-header">
            <p className="kicker">Deficit policy</p>
            <h3>Keep your rider account online</h3>
            <p className="body-muted">
              Settlement deficit rules now control when the rider can stay available for new trips.
            </p>
          </div>
          <div className="exact-rider-policy-list">
            <div className="exact-rider-policy-row">
              <span>Caution threshold</span>
              <strong>{formatMoney(currency, riderDeficitWarningThreshold)}</strong>
              <small>Warnings appear and payouts stay restricted while the rider is in deficit.</small>
            </div>
            <div className="exact-rider-policy-row">
              <span>Auto-offline threshold</span>
              <strong>{formatMoney(currency, riderDeficitOfflineThreshold)}</strong>
              <small>The rider is forced offline automatically at this deficit level.</small>
            </div>
            <div className="exact-rider-policy-row">
              <span>Back online rule</span>
              <strong>Below {formatMoney(currency, riderDeficitOfflineThreshold)}</strong>
              <small>You only need to pay enough to move below the hard lock threshold, not always back to zero.</small>
            </div>
          </div>
        </article>

        <article className="workbench-card exact-rider-policy-card exact-rider-policy-card-state">
          <div className="workbench-header">
            <p className="kicker">Account standing</p>
            <h3>
              {isDeficitLocked
                ? "Offline lock active"
                : isDeficitWarning
                  ? "Warning zone"
                  : hasDeficit
                    ? "Minor deficit"
                    : "Healthy balance"}
            </h3>
            <p className="body-muted">
              {isDeficitLocked
                ? "Your rider account stays offline until the deficit drops below the hard limit."
                : hasDeficit
                  ? "You can pay down the deficit here before it grows into an offline lock."
                  : "No active deficit is blocking payouts or availability right now."}
            </p>
          </div>
          <div className={`exact-rider-policy-state ${isDeficitLocked ? "locked" : isDeficitWarning ? "warning" : hasDeficit ? "watch" : "healthy"}`}>
            <span>Current deficit</span>
            <strong>{formatMoney(currency, deficitAmount)}</strong>
            <small>
              {isDeficitLocked
                ? `Pay at least ${formatMoney(currency, deficitRecoveryAmount)} to unlock online access.`
                : hasDeficit
                  ? "Settle early to avoid the automatic offline threshold."
                  : "No rider settlement debt at the moment."}
            </small>
          </div>

          <div className="exact-rider-deficit-actions exact-rider-deficit-actions-inline">
            <div className="field-group">
              <label className="field-label" htmlFor="rider-deficit-top-up">
                Pay deficit amount
              </label>
              <input
                id="rider-deficit-top-up"
                className="input"
                value={deficitTopUpAmount}
                onChange={(event) => setDeficitTopUpAmount(event.target.value)}
                placeholder={hasDeficit ? "200.00" : "No active deficit"}
                disabled={!hasDeficit}
              />
            </div>
            <div className="exact-rider-inline-actions">
              <button
                className="button"
                type="button"
                onClick={() => deficitTopUpMutation.mutate()}
                disabled={deficitTopUpMutation.isPending || !hasDeficit}
              >
                {deficitTopUpMutation.isPending ? "Redirecting..." : "Pay deficit"}
              </button>
              {isDeficitLocked ? (
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => setDeficitTopUpAmount(String(deficitRecoveryAmount))}
                >
                  Use unlock amount
                </button>
              ) : null}
            </div>
            {!hasDeficit ? (
              <p className="body-muted">
                No active rider deficit yet. This action becomes available as soon as settlement debt appears.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      {isDeficitWarning ? (
        <section className={`exact-rider-deficit-banner ${isDeficitLocked ? "locked" : "warning"}`}>
          <div>
            <p className="workspace-tag">
              {isDeficitLocked ? "auto offline threshold reached" : "deficit warning"}
            </p>
            <h3>
              Rider deficit: {formatMoney(currency, deficitAmount)}
            </h3>
            <p>
              {isDeficitLocked
                ? `Your rider account stays offline once the deficit reaches GHS ${riderDeficitOfflineThreshold}. Pay at least ${formatMoney(currency, deficitRecoveryAmount)} to move back below the lock threshold.`
                : `You are approaching the automatic offline threshold at GHS ${riderDeficitOfflineThreshold}. Settle the deficit early to keep your rider account available.`}
            </p>
          </div>
          <div className="exact-rider-deficit-banner-side">
            <div className="exact-rider-summary-row compact">
              <span>Current deficit</span>
              <strong>{formatMoney(currency, deficitAmount)}</strong>
            </div>
            <div className="exact-rider-summary-row compact">
              <span>Unlock target</span>
              <strong>
                {isDeficitLocked
                  ? formatMoney(currency, deficitRecoveryAmount)
                  : formatMoney(currency, Math.max(0, riderDeficitOfflineThreshold - deficitAmount))}
              </strong>
            </div>
          </div>
        </section>
      ) : null}

      {topUpStatus === "success" ? (
        <div className="exact-rider-eligibility-card success">
          <strong>Deficit payment confirmed</strong>
          <p>
            {topUpReference
              ? `Settlement top-up confirmed for ${topUpReference}.`
              : "Settlement top-up confirmed successfully."}
          </p>
        </div>
      ) : null}

      {topUpStatus === "failed" ? (
        <div className="empty-state empty-state-spaced">
          <strong>Deficit payment failed.</strong>
          <p>{topUpMessage ?? "Paystack could not confirm the rider deficit payment."}</p>
        </div>
      ) : null}

      {deficitTopUpMutation.isError ? (
        <div className="empty-state empty-state-spaced">
          <strong>Could not start deficit payment.</strong>
          <p>{deficitTopUpMutation.error.message}</p>
        </div>
      ) : null}

      <section className="exact-rider-earnings-columns">
        <div className="exact-rider-earnings-column">
          <article className="workbench-card">
          <div className="workbench-header">
            <p className="kicker">Latest payouts source</p>
            <h3>Recent earnings activity</h3>
            <p className="body-muted">
              Each completed ride below contributes to your settlement balance and payout history.
            </p>
          </div>
          {completedRides.length === 0 ? (
            <div className="empty-state empty-state-spaced">
              <strong>No earnings yet.</strong>
              <p>Once you complete trips, your payout activity will appear here automatically.</p>
            </div>
          ) : (
            <div className="exact-rider-records">
              {completedRides.map((ride) => (
                <article className="exact-rider-record-card" key={ride.id}>
                  <div className="exact-rider-record-main">
                    <div className="exact-rider-record-icon">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <strong>{ride.destinationAddress}</strong>
                      <span>
                        {ride.passenger.user.fullName} • {formatDateTime(ride.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="exact-rider-record-side">
                    <strong>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</strong>
                    <span>{formatStatus(ride.status)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
          </article>

          <article className="workbench-card">
            <div className="workbench-header">
              <p className="kicker">Settlement option</p>
              <h3>Preview trip settlement</h3>
              <p className="body-muted">
                Inspect how a completed trip settles into rider earnings using your live commission setup.
              </p>
            </div>

            {completedRides.length === 0 ? (
              <div className="empty-state empty-state-spaced">
                <strong>No completed rides yet.</strong>
                <p>Settlement previews will unlock once you have at least one completed trip.</p>
              </div>
            ) : (
              <>
                <div className="exact-rider-form-grid exact-rider-form-grid-spaced">
                  <div className="field-group">
                    <label className="field-label" htmlFor="rider-settlement-trip">
                      Completed trip
                    </label>
                    <select
                      id="rider-settlement-trip"
                      className="select"
                      value={selectedRide?.id ?? ""}
                      onChange={(event) => setSelectedRideId(event.target.value)}
                    >
                      {completedRides.map((ride) => (
                        <option key={ride.id} value={ride.id}>
                          {ride.passenger.user.fullName} - {ride.destinationAddress}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="rider-settlement-payment-method">
                      Payment method
                    </label>
                    <select
                      id="rider-settlement-payment-method"
                      className="select"
                      value={settlementForm.paymentMethod}
                      onChange={(event) =>
                        setSettlementForm((current) => ({
                          ...current,
                          paymentMethod: event.target.value
                        }))
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="wallet">Wallet</option>
                      <option value="mobile_money">Mobile money</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="rider-settlement-gateway-fee">
                      Gateway fee
                    </label>
                    <input
                      id="rider-settlement-gateway-fee"
                      className="input"
                      value={settlementForm.gatewayFee}
                      onChange={(event) =>
                        setSettlementForm((current) => ({
                          ...current,
                          gatewayFee: event.target.value
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="rider-settlement-rider-bonus">
                      Rider bonus
                    </label>
                    <input
                      id="rider-settlement-rider-bonus"
                      className="input"
                      value={settlementForm.riderBonus}
                      onChange={(event) =>
                        setSettlementForm((current) => ({
                          ...current,
                          riderBonus: event.target.value
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="rider-settlement-refund-amount">
                      Refund amount
                    </label>
                    <input
                      id="rider-settlement-refund-amount"
                      className="input"
                      value={settlementForm.refundAmount}
                      onChange={(event) =>
                        setSettlementForm((current) => ({
                          ...current,
                          refundAmount: event.target.value
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="exact-rider-inline-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => settlementPreviewMutation.mutate()}
                    disabled={settlementPreviewMutation.isPending}
                  >
                    {settlementPreviewMutation.isPending ? "Previewing..." : "Preview settlement"}
                  </button>
                  {selectedRide ? (
                    <p className="body-muted">
                      Base fare:{" "}
                      <strong>
                        {formatMoney(
                          selectedRide.currency,
                          selectedRide.finalFare ?? selectedRide.estimatedFare
                        )}
                      </strong>{" "}
                      with {riderCommissionPercent}% platform commission.
                    </p>
                  ) : null}
                </div>

                {settlementPreviewMutation.isError ? (
                  <div className="empty-state empty-state-spaced">
                    <strong>Settlement preview failed.</strong>
                    <p>{settlementPreviewMutation.error.message}</p>
                  </div>
                ) : null}

                {settlementPreviewMutation.data ? (
                  <div className="exact-rider-finance-grid">
                    <article className="workbench-subcard">
                      <h4>Net values</h4>
                      <div className="exact-rider-summary-stack">
                        <div className="exact-rider-summary-row">
                          <span>Rider net settlement</span>
                          <strong>
                            {formatMoney(
                              settlementPreviewMutation.data.currency,
                              settlementPreviewMutation.data.riderNetSettlement
                            )}
                          </strong>
                        </div>
                        <div className="exact-rider-summary-row">
                          <span>Platform net revenue</span>
                          <strong>
                            {formatMoney(
                              settlementPreviewMutation.data.currency,
                              settlementPreviewMutation.data.platformNetRevenue
                            )}
                          </strong>
                        </div>
                      </div>
                    </article>
                    <article className="workbench-subcard">
                      <h4>Settlement line items</h4>
                      <div className="exact-rider-payout-list compact">
                        {settlementPreviewMutation.data.lineItems.map((line) => (
                          <div className="exact-rider-payout-row" key={line.label}>
                            <span>{line.label}</span>
                            <strong>
                              {formatMoney(settlementPreviewMutation.data.currency, line.amount)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                ) : null}
              </>
            )}
          </article>
        </div>

        <div className="exact-rider-earnings-column">
          <article className="workbench-card">
          <div className="workbench-header">
            <p className="kicker">Cash-out context</p>
            <h3>Settlement summary</h3>
            <p className="body-muted">
              The live rider wallet remains the source of truth for what is available to withdraw.
            </p>
          </div>
          <div className="exact-rider-summary-stack">
            <div className="exact-rider-summary-row">
              <span>Available now</span>
              <strong>{formatMoney(currency, availableBalance)}</strong>
            </div>
            <div className="exact-rider-summary-row">
              <span>In settlement</span>
              <strong>{formatMoney(currency, lockedBalance)}</strong>
            </div>
            <div className="exact-rider-summary-row">
              <span>Today&apos;s earnings</span>
              <strong>{formatMoney(currency, todayEarnings)}</strong>
            </div>
            <div className="exact-rider-summary-note">
              <ArrowUpRight size={16} />
              <p>Use the settlement preview below to inspect rider net values, then request payout from your live available balance.</p>
            </div>
          </div>
          </article>

          <article className="workbench-card">
          <div className="workbench-header">
            <p className="kicker">Payout option</p>
            <h3>Request settlement payout</h3>
            <p className="body-muted">
              Send a withdrawal request from your available rider settlement balance.
            </p>
          </div>

          <div className="exact-rider-form-grid exact-rider-form-grid-spaced">
            <div className="field-group">
              <label className="field-label" htmlFor="rider-payout-amount">
                Amount
              </label>
              <input
                id="rider-payout-amount"
                className="input"
                value={payoutForm.amount}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    amount: event.target.value
                  }))
                }
                placeholder="20.00"
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="rider-payout-method">
                Payout method
              </label>
              <select
                id="rider-payout-method"
                className="select"
                value={payoutForm.method}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    method: event.target.value
                  }))
                }
              >
                <option value="MOBILE_MONEY">Mobile money</option>
                <option value="BANK_ACCOUNT">Bank account</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="rider-payout-destination">
                Settlement destination
              </label>
              <input
                id="rider-payout-destination"
                className="input"
                value={payoutForm.destinationLabel}
                onChange={(event) =>
                  setPayoutForm((current) => ({
                    ...current,
                    destinationLabel: event.target.value
                  }))
                }
                placeholder="MTN MoMo - 024 XXX XXXX"
              />
            </div>
          </div>

          {availableBalance > 0 ? (
            <div className="exact-rider-chip-row">
              {[
                { label: "Min", value: 20 },
                { label: "Half", value: roundCurrency(availableBalance / 2) },
                { label: "Max", value: availableBalance }
              ].map((preset) => (
                <button
                  key={preset.label}
                  className="exact-rider-chip-button"
                  type="button"
                  onClick={() =>
                    setPayoutForm((current) => ({
                      ...current,
                      amount: preset.value > 0 ? String(preset.value) : ""
                    }))
                  }
                >
                  {preset.label}: {formatMoney(currency, preset.value)}
                </button>
              ))}
            </div>
          ) : null}

          <div className="exact-rider-inline-actions">
            <button
              className="button-secondary"
              type="button"
              onClick={() => payoutEligibilityMutation.mutate()}
              disabled={payoutEligibilityMutation.isPending || isDeficitWarning || availableBalance <= 0}
            >
              {payoutEligibilityMutation.isPending ? "Checking..." : "Check payout"}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => payoutRequestMutation.mutate()}
              disabled={payoutRequestMutation.isPending || isDeficitWarning || availableBalance <= 0}
            >
              {payoutRequestMutation.isPending ? "Requesting..." : "Request payout"}
            </button>
            <p className="body-muted">
              {isDeficitWarning
                ? "Payouts unlock again once the rider deficit is cleared below the warning threshold."
                : (
                  <>
                    Minimum payout is <strong>{formatMoney(currency, 20)}</strong>.
                  </>
                )}
            </p>
          </div>

          {payoutEligibilityMutation.isError ? (
            <div className="empty-state empty-state-spaced">
              <strong>Payout check failed.</strong>
              <p>{payoutEligibilityMutation.error.message}</p>
            </div>
          ) : null}

          {payoutEligibilityMutation.data ? (
            <div className="exact-rider-eligibility-card">
              <strong>Payout eligible</strong>
              <p>
                Requesting {formatMoney(currency, payoutEligibilityMutation.data.requestedAmount)} leaves{" "}
                {formatMoney(currency, payoutEligibilityMutation.data.remainingBalance)} available.
              </p>
            </div>
          ) : null}

          {payoutRequestMutation.isError ? (
            <div className="empty-state empty-state-spaced">
              <strong>Payout request failed.</strong>
              <p>{payoutRequestMutation.error.message}</p>
            </div>
          ) : null}

          {payoutRequestMutation.isSuccess ? (
            <div className="exact-rider-eligibility-card success">
              <strong>Payout request sent</strong>
              <p>
                {formatMoney(
                  payoutRequestMutation.data.payoutRequest.currency,
                  payoutRequestMutation.data.payoutRequest.amount
                )}{" "}
                is now queued for review to {payoutRequestMutation.data.payoutRequest.destinationLabel}.
              </p>
            </div>
          ) : null}

          <div className="exact-rider-payout-history">
            <div className="workbench-header workbench-header-spaced">
              <p className="kicker">Recent requests</p>
              <h4>Payout timeline</h4>
            </div>

            {payoutRequestsQuery.isLoading ? (
              <p className="body-muted body-muted-spaced">
                Loading payout requests...
              </p>
            ) : payoutRequestsQuery.isError ? (
              <div className="empty-state empty-state-spaced">
                <strong>Could not load payout requests.</strong>
                <p>{payoutRequestsQuery.error.message}</p>
              </div>
            ) : (payoutRequestsQuery.data ?? []).length === 0 ? (
              <div className="empty-state empty-state-spaced">
                <strong>No payout requests yet.</strong>
                <p>Your rider payout requests will appear here once you submit one.</p>
              </div>
            ) : (
              <div className="exact-rider-payout-list">
                {(payoutRequestsQuery.data ?? []).map((request) => (
                  <div className="exact-rider-payout-row" key={request.id}>
                    <div>
                      <strong>{request.destinationLabel}</strong>
                      <span>
                        {request.method === "MOBILE_MONEY" ? "Mobile money" : "Bank account"} -{" "}
                        {formatDateTime(request.requestedAt)}
                      </span>
                      {request.rejectionReason ? <small>{request.rejectionReason}</small> : null}
                    </div>
                    <div className="exact-rider-payout-meta">
                      <strong>{formatMoney(request.currency, request.amount)}</strong>
                      <span className={`exact-rider-status-chip is-${request.status.toLowerCase()}`}>
                        {formatStatus(request.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function TripsContent({
  riderRides,
  activeRide
}: {
  riderRides: RideRecord[];
  activeRide: RideRecord | null;
}) {
  return (
    <main className="exact-rider-content">
      <section className="exact-rider-page-head">
        <div>
          <p className="workspace-tag">rider trips</p>
          <h1>Trip history</h1>
          <p className="body-muted">
            Separate trip management view inspired by the reference rider history state, now wired to live ride records.
          </p>
        </div>
      </section>

      {activeRide ? (
        <section className="workbench-card">
          <div className="workbench-header">
            <p className="kicker">Active trip</p>
            <h3>Current ride in progress</h3>
          </div>
          <div className="exact-rider-highlight">
            <div>
              <strong>{activeRide.passenger.user.fullName}</strong>
              <span>{formatStatus(activeRide.status)}</span>
            </div>
            <p>
              {activeRide.pickupAddress} to {activeRide.destinationAddress}
            </p>
          </div>
        </section>
      ) : null}

      <section className="workbench-card">
        <div className="workbench-header">
          <p className="kicker">All rider trips</p>
          <h3>Ride history timeline</h3>
          <p className="body-muted">
            Every ride assigned to this rider profile, sorted newest first from the backend.
          </p>
        </div>
        {riderRides.length === 0 ? (
          <div className="empty-state empty-state-spaced">
            <strong>No rides assigned yet.</strong>
            <p>Trip history will populate here as soon as dispatch starts assigning rides to this rider.</p>
          </div>
        ) : (
          <div className="exact-rider-records">
            {riderRides.map((ride) => (
              <article className="exact-rider-record-card" key={ride.id}>
                <div className="exact-rider-record-main">
                  <div className="exact-rider-record-icon muted">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <strong>{ride.passenger.user.fullName}</strong>
                    <span>
                      {ride.pickupAddress} to {ride.destinationAddress}
                    </span>
                  </div>
                </div>
                <div className="exact-rider-record-side">
                  <strong>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</strong>
                  <span>{formatStatus(ride.status)}</span>
                  <small>{formatDateTime(ride.createdAt)}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export function RiderPortalPage({
  screen = "dashboard"
}: {
  screen?: RiderPortalScreen;
}) {
  const { session, status, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [availabilityOverride, setAvailabilityOverride] = useState<boolean | null>(null);

  const isRider = session?.user.role === "rider";
  const userId = session?.user.id;
  const riderProfileId = session?.user.riderProfileId;

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled: status === "authenticated" && Boolean(riderProfileId),
    refetchInterval: 10_000
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchJson<RiderRecord[]>("/bootstrap/riders?limit=100"),
    enabled: status === "authenticated" && Boolean(riderProfileId),
    refetchInterval: 10_000
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const rider = useMemo(
    () => (ridersQuery.data ?? []).find((entry) => entry.id === riderProfileId) ?? null,
    [riderProfileId, ridersQuery.data]
  );

  const riderRides = useMemo(
    () =>
      (ridesQuery.data ?? [])
        .filter((ride) => ride.riderId === riderProfileId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [riderProfileId, ridesQuery.data]
  );

  const activeRide =
    riderRides.find((ride) => ["assigned", "arriving", "arrived", "started"].includes(ride.status)) ??
    null;
  const completedRides = riderRides.filter((ride) => ride.status === "completed");
  const completedCount = completedRides.length;
  const todayEarnings = completedRides.reduce(
    (sum, ride) => sum + parseNumber(ride.finalFare ?? ride.estimatedFare),
    0
  );
  const completionRate = riderRides.length === 0 ? 0 : Math.round((completedCount / riderRides.length) * 100);

  const settlementWallet =
    (walletsQuery.data ?? []).find((wallet) => wallet.type === "RIDER_SETTLEMENT") ??
    walletsQuery.data?.[0] ??
    null;
  const currency = settlementWallet?.currency ?? completedRides[0]?.currency ?? "GHS";
  const settlementAvailableBalance = parseNumber(settlementWallet?.availableBalance);
  const deficitAmount = settlementAvailableBalance < 0 ? Math.abs(settlementAvailableBalance) : 0;
  const isDeficitWarning = deficitAmount >= riderDeficitWarningThreshold;
  const isDeficitLocked = deficitAmount >= riderDeficitOfflineThreshold;
  const isOnline = availabilityOverride ?? rider?.onlineStatus ?? false;
  const displayIsOnline = !isDeficitLocked && isOnline;

  useEffect(() => {
    if (!riderProfileId) {
      return;
    }

    if (!(displayIsOnline || activeRide) || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        void patchJson(`/riders/${riderProfileId}/availability`, {
          onlineStatus: displayIsOnline,
          latitude,
          longitude
        });

        if (activeRide) {
          void postJson(`/rides/${activeRide.id}/location`, {
            riderProfileId,
            source: "rider_web",
            latitude,
            longitude,
            speedKph:
              position.coords.speed != null && position.coords.speed >= 0
                ? position.coords.speed * 3.6
                : undefined,
            heading:
              position.coords.heading != null && position.coords.heading >= 0
                ? position.coords.heading
                : undefined,
            accuracyM: position.coords.accuracy
          });
        }
      },
      () => {
        // Live rider tracking should fail softly if browser location is unavailable.
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 10_000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeRide, displayIsOnline, riderProfileId]);

  const mapMarkers =
    rider && rider.currentLatitude !== null && rider.currentLongitude !== null
      ? [
          {
            id: rider.id,
            position: [parseNumber(rider.currentLatitude), parseNumber(rider.currentLongitude)] as [
              number,
              number
            ],
            label: rider.user.fullName,
            variant: "driver" as const
          }
        ]
      : [];

  const currentMapPosition = mapMarkers[0]?.position ?? null;
  const dashboardMapCenter = currentMapPosition ?? ([5.6037, -0.187] as [number, number]);

  const updateAvailability = useMutation({
    mutationFn: async (onlineStatus: boolean) =>
      patchJson(`/riders/${riderProfileId}/availability`, {
        onlineStatus
      }),
    onMutate: async (onlineStatus) => {
      setAvailabilityOverride(onlineStatus);
      await queryClient.cancelQueries({ queryKey: ["riders"] });

      const previousRiders = queryClient.getQueryData<RiderRecord[]>(["riders"]);
      queryClient.setQueryData<RiderRecord[]>(["riders"], (current = []) =>
        current.map((entry) =>
          entry.id === riderProfileId ? { ...entry, onlineStatus } : entry
        )
      );

      return { previousRiders };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRiders) {
        queryClient.setQueryData(["riders"], context.previousRiders);
      }
      setAvailabilityOverride(null);
    },
    onSettled: async () => {
      setAvailabilityOverride(null);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    }
  });

  const advanceRideStatus = useMutation({
    mutationFn: async (nextStatus: string) => {
      if (!activeRide || !userId) {
        throw new Error("No active ride is available.");
      }

      return patchJson(`/rides/${activeRide.id}/status`, {
        nextStatus,
        actorRole: "rider",
        actorUserId: userId
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      await queryClient.invalidateQueries({ queryKey: ["wallets", userId] });
    }
  });

  if (status === "loading") {
    return (
      <AccessState
        title="Loading your rider workspace"
        body="Checking your rider session before opening the live dashboard."
        actionLabel="Go to rider login"
        actionHref="/rider/login"
      />
    );
  }

  if (status !== "authenticated" || !isRider) {
    return (
      <AccessState
        title="Rider sign in required"
        body="Use a rider account to access the live rider operations portal."
        actionLabel="Go to rider login"
        actionHref="/rider/login"
      />
    );
  }

  const nextActionLabel =
    activeRide?.status === "assigned"
      ? "Mark arriving"
      : activeRide?.status === "arriving"
        ? "Mark arrived"
        : activeRide?.status === "arrived"
          ? "Start trip"
          : activeRide?.status === "started"
            ? "Complete trip"
            : null;

  const nextActionStatus =
    activeRide?.status === "assigned"
      ? "arriving"
      : activeRide?.status === "arriving"
        ? "arrived"
        : activeRide?.status === "arrived"
          ? "started"
          : activeRide?.status === "started"
            ? "completed"
            : null;

  return (
    <ImmersivePage className="exact-rider-page">
      <div className="exact-rider-statebar">
        {displayIsOnline ? "LIVE RIDER DASHBOARD - ONLINE" : "LIVE RIDER DASHBOARD - OFFLINE"}
      </div>

      <div className="exact-rider-shell">
        <header className="exact-rider-topnav">
          <div className="exact-rider-topnav-left">
            <div className="exact-logo-box">
              <Bike size={20} />
            </div>
            <span className="exact-rider-wordmark">OKADAGO</span>
            <span className="exact-rider-chip">Rider Portal</span>
            <nav className="exact-rider-navlinks">
              <a href="/rider" className={screen === "dashboard" ? "active" : undefined}>
                Dashboard
              </a>
              <a href="/rider/earnings" className={screen === "earnings" ? "active" : undefined}>
                Earnings
              </a>
              <a href="/rider/trips" className={screen === "trips" ? "active" : undefined}>
                Trips
              </a>
            </nav>
          </div>

          <div className="exact-rider-topnav-right">
            <button
              className={`exact-online-toggle ${displayIsOnline ? "is-online" : "is-offline"} ${
                updateAvailability.isPending ? "is-pending" : ""
              }`}
              data-state={displayIsOnline ? "online" : "offline"}
              type="button"
              role="switch"
              aria-checked={displayIsOnline}
              aria-label={
                isDeficitLocked
                  ? "Rider offline due to deficit lock"
                  : displayIsOnline
                    ? "Set rider offline"
                    : "Set rider online"
              }
              title={
                isDeficitLocked
                  ? "Rider offline due to deficit lock"
                  : displayIsOnline
                    ? "Set rider offline"
                    : "Set rider online"
              }
              disabled={updateAvailability.isPending || !riderProfileId || isDeficitLocked}
              onClick={() => updateAvailability.mutate(!displayIsOnline)}
            >
              <span>
                {isDeficitLocked
                  ? "OFFLINE LOCKED"
                  : updateAvailability.isPending
                  ? displayIsOnline
                    ? "GOING ONLINE..."
                    : "GOING OFFLINE..."
                  : displayIsOnline
                    ? "ONLINE"
                    : "OFFLINE"}
              </span>
              <div className="exact-toggle-track" data-state={displayIsOnline ? "online" : "offline"}>
                <div className="exact-toggle-thumb" />
              </div>
            </button>
            <button
              className="exact-icon-button"
              type="button"
              aria-label="Open rider notifications"
              title="Open rider notifications"
            >
              <Bell size={18} />
            </button>
            <button
              className="exact-icon-button"
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                void signOut().then(() => {
                  window.location.href = "/rider/login";
                });
              }}
            >
              <LogOut size={16} />
            </button>
            <button className="exact-profile-button rider" type="button">
              <div className="exact-avatar">
                {session.user.fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <strong>{session.user.fullName}</strong>
                <span>
                  {rider?.vehicle
                    ? `${rider.vehicle.make} ${rider.vehicle.model}`
                    : "No vehicle on file"}
                </span>
              </div>
            </button>
          </div>
        </header>

        <div className="exact-rider-body">
          <aside className="exact-rider-sidebar">
            <div className="exact-rider-week">
              <h2>
                {screen === "dashboard"
                  ? "Today's earnings"
                  : screen === "earnings"
                    ? "Earnings center"
                    : "Trips center"}
              </h2>
              <p>
                {screen === "dashboard"
                  ? "Live backend settlement"
                  : screen === "earnings"
                    ? "Separate earnings workspace"
                    : "Separate trip history workspace"}
              </p>
            </div>

            <section className="exact-rider-hero-card">
              <div className="exact-rider-hero-head">
                <div>
                  <span>Available balance</span>
                  <h3>
                    {settlementWallet
                      ? formatMoney(settlementWallet.currency, settlementWallet.availableBalance)
                      : "No settlement wallet"}
                  </h3>
                </div>
                <div className="exact-rider-hero-icon">
                  <Wallet size={18} />
                </div>
              </div>
              <div className="exact-rider-bonus-card">
                <span>{rider?.serviceZone?.name ?? "No service zone assigned"}</span>
                <p>{rider?.city ?? "Update your rider profile city to improve dispatch matching."}</p>
              </div>
            </section>

            <div className="exact-rider-metric-grid">
              <article className="exact-rider-metric-card">
                <span>Trips</span>
                <strong>{completedCount}</strong>
              </article>
              <article className="exact-rider-metric-card">
                <span>Status</span>
                <strong>
                  {activeRide
                    ? "Active"
                    : isDeficitLocked
                      ? "Locked"
                      : displayIsOnline
                        ? "Online"
                        : "Offline"}
                </strong>
              </article>
              <article className="exact-rider-metric-card wide">
                <div className="exact-rating-row">
                  <span>Completion</span>
                  <div className="exact-stars">
                    {[0, 1, 2, 3, 4].map((item) => (
                      <Star key={item} size={12} className={item < Math.max(1, Math.round(completionRate / 25)) ? "filled" : ""} />
                    ))}
                  </div>
                </div>
                <strong>{completionRate}% completed</strong>
              </article>
            </div>

            <div className="exact-rider-module-stack">
              {isDeficitWarning ? (
                <section className={`exact-rider-finance-alert ${isDeficitLocked ? "locked" : "warning"}`}>
                  <strong>
                    {isDeficitLocked
                      ? `Offline locked at ${formatMoney(currency, deficitAmount)} deficit`
                      : `Warning: ${formatMoney(currency, deficitAmount)} rider deficit`}
                  </strong>
                  <p>
                    {isDeficitLocked
                      ? `Pay the deficit from earnings to go back online. The hard lock triggers at GHS ${riderDeficitOfflineThreshold}.`
                      : `Once the deficit reaches GHS ${riderDeficitOfflineThreshold}, the rider account is forced offline automatically.`}
                  </p>
                  <a href="/rider/earnings">Open earnings</a>
                </section>
              ) : null}

              <section className="workbench-card" id="rides">
                <div className="workbench-header">
                  <p className="kicker">Current trip</p>
                  <h4>Live ride state</h4>
                  <p className="body-muted">
                    Progress your currently assigned ride with real backend lifecycle updates.
                  </p>
                </div>
                {!activeRide ? (
                  <div className="empty-state empty-state-spaced">
                    <strong>No active ride.</strong>
                    <p>Go online and wait for a dispatch assignment to appear here.</p>
                  </div>
                ) : (
                  <div className="exact-rider-live-ride-details">
                    <p className="body-muted">
                      <strong>{formatStatus(activeRide.status)}</strong> for {activeRide.passenger.user.fullName}
                    </p>
                    <p className="body-muted">
                      Pickup: <strong>{activeRide.pickupAddress}</strong>
                    </p>
                    <p className="body-muted">
                      Destination: <strong>{activeRide.destinationAddress}</strong>
                    </p>
                    <p className="body-muted">
                      Fare:{" "}
                      <strong>
                        {formatMoney(activeRide.currency, activeRide.finalFare ?? activeRide.estimatedFare)}
                      </strong>
                    </p>
                    {nextActionLabel && nextActionStatus ? (
                      <button
                        className="button"
                        type="button"
                        onClick={() => advanceRideStatus.mutate(nextActionStatus)}
                        disabled={advanceRideStatus.isPending}
                      >
                        {advanceRideStatus.isPending ? "Updating..." : nextActionLabel}
                      </button>
                    ) : null}
                  </div>
                )}
                {advanceRideStatus.isError ? (
                  <div className="empty-state empty-state-spaced">
                    <strong>Ride update failed.</strong>
                    <p>{advanceRideStatus.error.message}</p>
                  </div>
                ) : null}
              </section>
            </div>
          </aside>

          {screen === "dashboard" ? (
            <section className="exact-rider-map">
              <OperationsMap
                center={dashboardMapCenter}
                zoom={12}
                bare
                markers={mapMarkers}
                currentPosition={
                  currentMapPosition
                    ? {
                        position: currentMapPosition,
                        label: "Your live location"
                      }
                    : null
                }
                emptyTitle="No live rider location yet"
                emptyDescription="Update rider availability with coordinates and your live Accra map position will render here."
              />

              <div className="exact-rider-status-pill">
                <div className="exact-live-dot" />
                <span>
                  {isDeficitLocked
                    ? "Offline due to deficit"
                    : displayIsOnline
                      ? "You're online"
                      : "You're offline"}
                </span>
                <small>
                  {isDeficitLocked
                    ? `Settle ${formatMoney(currency, deficitAmount)} to restore access`
                    : activeRide
                      ? formatStatus(activeRide.status)
                      : "Waiting for trips"}
                </small>
              </div>

              <div className="exact-rider-badge">
                {activeRide ? `${formatStatus(activeRide.status)} ride active` : "No active trips"}
              </div>

            </section>
          ) : null}

          {screen === "earnings" ? (
            <EarningsContent
              settlementWallet={settlementWallet}
              completedRides={completedRides}
              todayEarnings={todayEarnings}
              completedCount={completedCount}
              riderCommissionPercent={parseNumber(rider?.commissionPercent) || 12}
              token={session.token}
              deficitAmount={deficitAmount}
              isDeficitWarning={isDeficitWarning}
              isDeficitLocked={isDeficitLocked}
            />
          ) : null}

          {screen === "trips" ? <TripsContent riderRides={riderRides} activeRide={activeRide} /> : null}
        </div>
      </div>
    </ImmersivePage>
  );
}
