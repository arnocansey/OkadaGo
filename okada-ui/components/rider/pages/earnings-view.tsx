"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { postJson, requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { RiderAppFrame } from "@/components/rider/layout/app-frame";
import { useRiderData } from "@/components/rider/hooks/use-rider-data";
import { rdrToast } from "@/components/rider/lib/toast";
import { EarningsSkeleton } from "@/components/rider/ui/skeletons";
import {
  formatDateTime,
  formatStatus,
  parseNumber,
  riderDeficitOfflineThreshold,
  riderDeficitWarningThreshold,
  roundCurrency,
  type PayoutEligibilityResponse,
  type RiderPayoutRequestRecord,
  type SettlementPreviewResponse
} from "@/components/rider/types";

export function EarningsView() {
  const { session } = useAuth();
  const data = useRiderData();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const token = session?.token ?? "";

  const availableBalance = parseNumber(data.settlementWallet?.availableBalance);
  const lockedBalance = parseNumber(data.settlementWallet?.lockedBalance);
  const averageFare = data.completedCount === 0 ? 0 : data.todayEarnings / data.completedCount;
  const hasDeficit = data.deficitAmount > 0;
  const deficitRecoveryAmount = data.isDeficitLocked
    ? roundCurrency(Math.max(1, data.deficitAmount - riderDeficitOfflineThreshold + 1))
    : 0;

  const [selectedRideId, setSelectedRideId] = useState("");
  const [deficitTopUpAmount, setDeficitTopUpAmount] = useState("");
  const [payoutForm, setPayoutForm] = useState({ amount: "", method: "MOBILE_MONEY", destinationLabel: "" });
  const [settlementForm, setSettlementForm] = useState({
    paymentMethod: "mobile_money",
    gatewayFee: "0",
    riderBonus: "0",
    refundAmount: "0"
  });

  useEffect(() => {
    if (data.deficitAmount > 0) setDeficitTopUpAmount(String(roundCurrency(data.deficitAmount)));
  }, [data.deficitAmount]);

  useEffect(() => {
    if (!selectedRideId && data.completedRides[0]) setSelectedRideId(data.completedRides[0].id);
  }, [data.completedRides, selectedRideId]);

  const payoutRequestsQuery = useQuery({
    queryKey: ["rider-payout-requests", token],
    queryFn: () => requestJson<RiderPayoutRequestRecord[]>("/wallets/rider/payout-requests", { token }),
    enabled: Boolean(token)
  });

  const selectedRide = useMemo(
    () => data.completedRides.find((ride) => ride.id === selectedRideId) ?? data.completedRides[0] ?? null,
    [data.completedRides, selectedRideId]
  );

  const topUpStatus = searchParams.get("topup");

  const settlementPreviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRide) throw new Error("Choose a completed ride first.");
      return postJson<SettlementPreviewResponse, Record<string, unknown>>("/wallets/settlement-preview", {
        currency: selectedRide.currency,
        paymentMethod: settlementForm.paymentMethod,
        totalFare: parseNumber(selectedRide.finalFare ?? selectedRide.estimatedFare),
        platformCommissionPercent: data.riderCommissionPercent,
        gatewayFee: parseNumber(settlementForm.gatewayFee),
        riderBonus: parseNumber(settlementForm.riderBonus),
        refundAmount: parseNumber(settlementForm.refundAmount)
      });
    },
    onError: (error) => rdrToast.error("Settlement preview failed", (error as Error).message)
  });

  const payoutEligibilityMutation = useMutation({
    mutationFn: async () =>
      postJson<PayoutEligibilityResponse, Record<string, unknown>>("/wallets/payout-eligibility", {
        availableBalance,
        requestedAmount: parseNumber(payoutForm.amount),
        minimumPayoutAmount: 20,
        hasPendingComplianceIssue: false,
        hasPendingPayout: (payoutRequestsQuery.data ?? []).some((request) =>
          ["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"].includes(request.status)
        )
      }),
    onError: (error) => rdrToast.error("Payout check failed", (error as Error).message)
  });

  const payoutRequestMutation = useMutation({
    mutationFn: async () =>
      requestJson<{ payoutRequest: RiderPayoutRequestRecord }>("/wallets/rider/payout-requests", {
        method: "POST",
        token,
        body: JSON.stringify({
          amount: parseNumber(payoutForm.amount),
          method: payoutForm.method,
          destinationLabel: payoutForm.destinationLabel
        })
      }),
    onSuccess: async () => {
      setPayoutForm((current) => ({ ...current, amount: "" }));
      rdrToast.success("Payout request submitted");
      await queryClient.invalidateQueries({ queryKey: ["wallets"] });
      await queryClient.invalidateQueries({ queryKey: ["rider-payout-requests", token] });
    },
    onError: (error) => rdrToast.error("Payout request failed", (error as Error).message)
  });

  const deficitTopUpMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(deficitTopUpAmount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount.");
      return requestJson<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", {
        method: "POST",
        token,
        body: JSON.stringify({
          amount,
          currency: data.currency,
          walletType: "rider_settlement",
          description: "Rider settlement deficit payment"
        })
      });
    },
    onSuccess: (payload) => {
      window.location.href = payload.authorizationUrl;
    },
    onError: (error) => rdrToast.error("Could not start payment", (error as Error).message)
  });

  return (
    <RiderAppFrame>
      <div className="rdr-page">
        <div className="rdr-page-header">
          <h1>Earnings</h1>
        </div>
        <div className="rdr-page-content">
          <h1 className="rdr-page-title">Earnings</h1>

          {data.isLoading ? (
            <EarningsSkeleton />
          ) : (
            <>
              <div className="rdr-stat-grid mb-6">
                <article className="rdr-stat-card rdr-stat-card--accent">
                  <span>Available</span>
                  <strong>{formatMoney(data.currency, availableBalance)}</strong>
                </article>
                <article className="rdr-stat-card">
                  <span>Locked</span>
                  <strong>{formatMoney(data.currency, lockedBalance)}</strong>
                </article>
                <article className="rdr-stat-card">
                  <span>Completed</span>
                  <strong>{data.completedCount}</strong>
                </article>
                <article className="rdr-stat-card">
                  <span>Avg fare</span>
                  <strong>{formatMoney(data.currency, averageFare)}</strong>
                </article>
              </div>

              {topUpStatus === "success" ? (
                <div className="rdr-alert rdr-alert--success mb-4">Deficit payment confirmed.</div>
              ) : null}
              {topUpStatus === "failed" ? (
                <div className="rdr-alert rdr-alert--warning mb-4">Deficit payment failed. Try again.</div>
              ) : null}

              {data.isDeficitWarning ? (
                <div className={`rdr-alert mb-6 ${data.isDeficitLocked ? "rdr-alert--danger" : "rdr-alert--warning"}`}>
                  <strong>
                    {data.isDeficitLocked ? "Offline lock active" : "Deficit warning"} —{" "}
                    {formatMoney(data.currency, data.deficitAmount)}
                  </strong>
                  <p className="text-sm mt-1 rdr-text-secondary">
                    {data.isDeficitLocked
                      ? `Pay at least ${formatMoney(data.currency, deficitRecoveryAmount)} to unlock online access.`
                      : `Auto-offline at ${formatMoney(data.currency, riderDeficitOfflineThreshold)}.`}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="rdr-input flex-1"
                      value={deficitTopUpAmount}
                      onChange={(e) => setDeficitTopUpAmount(e.target.value)}
                      disabled={!hasDeficit}
                    />
                    <button
                      type="button"
                      className="rdr-btn-primary"
                      disabled={deficitTopUpMutation.isPending || !hasDeficit}
                      onClick={() => deficitTopUpMutation.mutate()}
                    >
                      {deficitTopUpMutation.isPending ? "Redirecting…" : "Pay deficit"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rdr-card mb-6 p-4">
                <h3 className="font-bold mb-4">Request payout</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="rdr-field-label">Amount</label>
                    <input
                      className="rdr-input"
                      value={payoutForm.amount}
                      onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="20.00"
                    />
                  </div>
                  <div>
                    <label className="rdr-field-label">Method</label>
                    <select
                      className="rdr-input"
                      value={payoutForm.method}
                      onChange={(e) => setPayoutForm((f) => ({ ...f, method: e.target.value }))}
                    >
                      <option value="MOBILE_MONEY">Mobile money</option>
                      <option value="BANK_ACCOUNT">Bank account</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="rdr-field-label">Destination</label>
                    <input
                      className="rdr-input"
                      value={payoutForm.destinationLabel}
                      onChange={(e) => setPayoutForm((f) => ({ ...f, destinationLabel: e.target.value }))}
                      placeholder="MTN MoMo - 024 XXX XXXX"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rdr-btn-secondary"
                    disabled={payoutEligibilityMutation.isPending || data.isDeficitWarning || availableBalance <= 0}
                    onClick={() => payoutEligibilityMutation.mutate()}
                  >
                    Check payout
                  </button>
                  <button
                    type="button"
                    className="rdr-btn-primary"
                    disabled={payoutRequestMutation.isPending || data.isDeficitWarning || availableBalance <= 0}
                    onClick={() => payoutRequestMutation.mutate()}
                  >
                    Request payout
                  </button>
                </div>
                {payoutEligibilityMutation.data ? (
                  <p className="text-sm mt-3 rdr-text-secondary">
                    Eligible — leaves {formatMoney(data.currency, payoutEligibilityMutation.data.remainingBalance)}{" "}
                    available.
                  </p>
                ) : null}
              </div>

              {data.completedRides.length > 0 ? (
                <div className="rdr-card mb-6 p-4">
                  <h3 className="font-bold mb-4">Settlement preview</h3>
                  <div className="mb-3">
                    <label className="rdr-field-label">Completed trip</label>
                    <select
                      className="rdr-input"
                      value={selectedRide?.id ?? ""}
                      onChange={(e) => setSelectedRideId(e.target.value)}
                    >
                      {data.completedRides.map((ride) => (
                        <option key={ride.id} value={ride.id}>
                          {ride.passenger.user.fullName} — {ride.destinationAddress}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="rdr-btn-secondary"
                    disabled={settlementPreviewMutation.isPending}
                    onClick={() => settlementPreviewMutation.mutate()}
                  >
                    {settlementPreviewMutation.isPending ? "Previewing…" : "Preview settlement"}
                  </button>
                  {settlementPreviewMutation.data ? (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Rider net</span>
                        <strong>
                          {formatMoney(
                            settlementPreviewMutation.data.currency,
                            settlementPreviewMutation.data.riderNetSettlement
                          )}
                        </strong>
                      </div>
                      {settlementPreviewMutation.data.lineItems.map((line) => (
                        <div key={line.label} className="flex justify-between rdr-text-secondary">
                          <span>{line.label}</span>
                          <span>{formatMoney(settlementPreviewMutation.data!.currency, line.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <h3 className="rdr-section-title">Recent earnings</h3>
              {data.completedRides.length === 0 ? (
                <div className="rdr-empty">
                  <strong>No earnings yet</strong>
                  <p>Completed trips will appear here.</p>
                </div>
              ) : (
                <div className="rdr-trip-list">
                  {data.completedRides.map((ride) => (
                    <article key={ride.id} className="rdr-trip-card">
                      <div className="rdr-trip-card-icon">
                        <TrendingUp size={18} />
                      </div>
                      <div className="rdr-trip-card-body">
                        <strong>{ride.destinationAddress.split(",")[0]}</strong>
                        <p className="text-sm rdr-text-secondary">
                          {ride.passenger.user.fullName} · {formatDateTime(ride.createdAt)}
                        </p>
                      </div>
                      <div className="rdr-trip-card-fare">
                        {formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {(payoutRequestsQuery.data ?? []).length > 0 ? (
                <>
                  <h3 className="rdr-section-title mt-8">Payout requests</h3>
                  <div className="rdr-trip-list">
                    {(payoutRequestsQuery.data ?? []).map((request) => (
                      <article key={request.id} className="rdr-trip-card">
                        <div className="rdr-trip-card-body">
                          <strong>{request.destinationLabel}</strong>
                          <p className="text-sm rdr-text-secondary">
                            {formatStatus(request.status)} · {formatDateTime(request.requestedAt)}
                          </p>
                        </div>
                        <div className="rdr-trip-card-fare">{formatMoney(request.currency, request.amount)}</div>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </RiderAppFrame>
  );
}
