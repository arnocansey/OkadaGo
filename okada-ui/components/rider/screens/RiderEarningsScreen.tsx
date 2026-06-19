"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { postJson, requestJson } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import {
  parseNumber,
  roundCurrency,
  formatStatus,
  formatDateTime,
  riderDeficitWarningThreshold,
  riderDeficitOfflineThreshold,
  type WalletRecord,
  type RideRecord,
  type SettlementPreviewResponse,
  type PayoutEligibilityResponse,
  type RiderPayoutRequestRecord
} from "../rider-portal-types";

export function RiderEarningsScreen({
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
