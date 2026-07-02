"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { History, Plus } from "lucide-react";
import { fetchJson, requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { paxToast } from "@/components/passenger/lib/toast";
import { ListRowsSkeleton, WalletSkeleton } from "@/components/passenger/ui/skeletons";
import { type Wallet, type WalletTransaction } from "@/components/passenger/types";

function formatTxTime(value: string) {
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function txTitle(tx: WalletTransaction) {
  if (tx.description) return tx.description;
  if (tx.type === "TOP_UP") return "Wallet top-up";
  if (tx.ride) return tx.direction === "DEBIT" ? "Ride payment" : "Trip credit";
  return tx.type.replace(/_/g, " ");
}

export function WalletView() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [topUpAmount, setTopUpAmount] = useState("50");
  const [showTopUp, setShowTopUp] = useState(false);

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<Wallet[]>(`/wallets/users/${userId}`),
    enabled: Boolean(userId)
  });

  const txQuery = useQuery({
    queryKey: ["wallet-transactions", userId],
    queryFn: () => fetchJson<WalletTransaction[]>(`/wallets/users/${userId}/transactions`),
    enabled: Boolean(userId)
  });

  const preferredWallet = useMemo(() => {
    const wallets = walletsQuery.data ?? [];
    return wallets.find((w) => w.currency === session?.user.preferredCurrency) ?? wallets[0] ?? null;
  }, [walletsQuery.data, session?.user.preferredCurrency]);

  const currency = preferredWallet?.currency ?? session?.user.preferredCurrency ?? "GHS";
  const balance = preferredWallet?.availableBalance ?? 0;

  const topUpMutation = useMutation({
    mutationFn: async () => {
      if (!session?.token || !preferredWallet) {
        throw new Error("Wallet not available.");
      }
      const amount = Number(topUpAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid amount.");
      }
      return requestJson(`/wallets/${preferredWallet.id}/top-up`, {
        method: "POST",
        token: session.token,
        body: JSON.stringify({ amount, currency, paymentMethod: "mobile_money" })
      });
    },
    onSuccess: async () => {
      paxToast.success("Top-up successful", "Your wallet balance has been updated.");
      await walletsQuery.refetch();
      await txQuery.refetch();
      setShowTopUp(false);
    },
    onError: (error) => {
      paxToast.error("Top-up failed", (error as Error).message);
    }
  });

  return (
    <PassengerAppFrame>
      <div className="pax-page">
        <div className="pax-page-header">
          <h1>Wallet</h1>
        </div>

        <div className="pax-page-content">
          <h1 className="pax-page-title">Wallet</h1>

          {walletsQuery.isLoading ? (
            <WalletSkeleton />
          ) : (
            <>
          <div className="pax-wallet-card mb-6">
            <div className="pax-wallet-card-label">Available balance</div>
            <div className="pax-wallet-card-balance">{formatMoney(currency, balance)}</div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowTopUp(true)} className="pax-btn-secondary flex-1">
                <Plus size={16} /> Add money
              </button>
              <button type="button" className="pax-btn-secondary flex-1">
                Send
              </button>
            </div>
          </div>

          {showTopUp ? (
            <div className="pax-card mb-6 p-4">
              <label className="pax-field-label">Top-up amount ({currency})</label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="pax-input mb-3 text-lg font-semibold"
              />
              {topUpMutation.error ? (
                <p className="mb-2 text-sm pax-text-danger">{(topUpMutation.error as Error).message}</p>
              ) : null}
              <div className="flex gap-2">
                <button type="button" className="pax-btn-secondary flex-1" onClick={() => setShowTopUp(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="pax-btn-primary flex-1 !h-11"
                  disabled={topUpMutation.isPending}
                  onClick={() => topUpMutation.mutate()}
                >
                  {topUpMutation.isPending ? "Processing…" : "Confirm"}
                </button>
              </div>
            </div>
          ) : null}

          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold pax-text-secondary">
            <History size={16} /> Recent transactions
          </h2>

          {txQuery.isLoading ? (
            <ListRowsSkeleton count={4} />
          ) : (txQuery.data ?? []).length === 0 ? (
            <p className="pax-empty text-sm">No transactions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(txQuery.data ?? []).slice(0, 20).map((tx) => (
                <div key={tx.id} className="pax-card flex items-center gap-3 p-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      tx.direction === "CREDIT" ? "bg-[var(--pax-warning-light)] pax-text-primary" : "bg-[var(--pax-danger-light)] pax-text-danger"
                    }`}
                  >
                    {tx.type === "TOP_UP" ? <Plus size={18} /> : <History size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{txTitle(tx)}</div>
                    <div className="text-xs pax-text-secondary">{formatTxTime(tx.createdAt)}</div>
                  </div>
                  <div className={`shrink-0 text-sm font-bold ${tx.direction === "CREDIT" ? "pax-text-primary" : ""}`}>
                    {tx.direction === "CREDIT" ? "+" : "−"}
                    {formatMoney(tx.currency, tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </PassengerAppFrame>
  );
}
