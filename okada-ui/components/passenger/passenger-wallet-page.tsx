"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { CreditCard, History, Phone, Plus, Wallet } from "lucide-react";
import { fetchJson, requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { PassengerAccessState, PassengerShell } from "@/components/passenger/passenger-shell";

type WalletRecord = {
  id: string;
  type: string;
  currency: string;
  availableBalance: string | number;
  lockedBalance: string | number;
};

type WalletTransactionRecord = {
  id: string;
  walletId: string;
  type: string;
  status: string;
  amount: string | number;
  currency: string;
  direction: string;
  reference: string;
  description: string | null;
  createdAt: string;
  wallet: WalletRecord;
  ride: {
    id: string;
    pickupAddress: string;
    destinationAddress: string;
  } | null;
};

function formatWalletType(value: string) {
  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTransactionTitle(transaction: WalletTransactionRecord) {
  if (transaction.description) {
    return transaction.description;
  }

  if (transaction.type === "TOP_UP") {
    return "Wallet top-up";
  }

  if (transaction.type === "DEBIT" && transaction.ride) {
    return "Ride payment";
  }

  if (transaction.type === "CREDIT" && transaction.ride) {
    return "Trip credit";
  }

  return formatWalletType(transaction.type);
}

function formatTransactionTime(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getTransactionIcon(transaction: WalletTransactionRecord) {
  if (transaction.type === "TOP_UP") {
    return Plus;
  }

  return History;
}

export function PassengerWalletPage() {
  const { session, status, signOut } = useAuth();
  const searchParams = useSearchParams();
  const isPassenger = session?.user.role === "passenger";
  const userId = session?.user.id;
  const [topUpAmount, setTopUpAmount] = useState("1000");

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const transactionsQuery = useQuery({
    queryKey: ["wallet-transactions", userId],
    queryFn: () => fetchJson<WalletTransactionRecord[]>(`/wallets/users/${userId}/transactions`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const preferredWallet =
    (walletsQuery.data ?? []).find((wallet) => wallet.currency === session?.user.preferredCurrency) ??
    walletsQuery.data?.[0] ??
    null;

  const totalAvailable = useMemo(
    () =>
      (walletsQuery.data ?? []).reduce((sum, wallet) => {
        const amount =
          typeof wallet.availableBalance === "number"
            ? wallet.availableBalance
            : Number(wallet.availableBalance ?? 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [walletsQuery.data]
  );

  const topUpMutation = useMutation({
    mutationFn: async () => {
      if (!session?.token) {
        throw new Error("You need to be signed in to top up a wallet.");
      }

      const amount = Number(topUpAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid amount before continuing to Paystack.");
      }

      return requestJson<{ authorizationUrl: string }>("/wallets/top-up/paystack/initialize", {
        method: "POST",
        token: session.token,
        body: JSON.stringify({
          amount,
          currency: session?.user.preferredCurrency ?? "GHS",
          walletType: "passenger_cashless"
        })
      });
    },
    onSuccess: (payload) => {
      window.location.href = payload.authorizationUrl;
    }
  });

  const topUpStatus = searchParams.get("topup");
  const topUpMessage = searchParams.get("message");
  const topUpReference = searchParams.get("reference");

  if (status === "loading") {
    return (
      <PassengerAccessState
        title="Loading your wallet"
        body="Checking your passenger session before opening your wallet."
        actionLabel="Go to login"
        actionHref="/login"
      />
    );
  }

  if (status !== "authenticated" || !isPassenger || !session) {
    return (
      <PassengerAccessState
        title="Passenger sign in required"
        body="Use a passenger account to access your wallet."
        actionLabel="Go to passenger login"
        actionHref="/login"
      />
    );
  }

  return (
    <PassengerShell
      session={session}
      preferredWallet={preferredWallet}
      activeTab="wallet"
      signOut={signOut}
    >
      <section className="exact-passenger-content">
        <div>
          <p className="kicker">Wallet</p>
          <h1 className="m-0 font-display text-[clamp(2rem,4vw,3rem)] tracking-[-0.05em] text-slate-900">
            Wallet & Payments
          </h1>
          <p className="body-muted mt-2 max-w-2xl">
            Manage your passenger balance and review the real payment activity tied to your account.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <section className="relative overflow-hidden rounded-[28px] bg-emerald-700 p-6 text-white shadow-lg">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-6 translate-x-6 rounded-full bg-white/10 blur-2xl" />
            <div className="relative space-y-5">
              <div>
                <p className="text-sm font-medium text-emerald-100">Available balance</p>
                <h2 className="mt-2 text-4xl font-bold">
                  {formatMoney(session.user.preferredCurrency, totalAvailable)}
                </h2>
                <p className="mt-2 text-sm text-emerald-100">
                  {preferredWallet
                    ? `${formatWalletType(preferredWallet.type)} is currently your main wallet.`
                    : "A wallet will appear here once your account is provisioned."}
                </p>
              </div>

              {topUpStatus === "success" ? (
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white">
                  {topUpReference
                    ? `Wallet top-up confirmed for ${topUpReference}.`
                    : "Wallet top-up confirmed successfully."}
                </div>
              ) : null}

              {topUpStatus === "failed" ? (
                <div className="rounded-2xl border border-red-200/60 bg-red-500/15 px-4 py-3 text-sm text-white">
                  {topUpMessage ?? "Paystack could not confirm the payment."}
                </div>
              ) : null}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-emerald-100">Top-up amount</label>
                <input
                  className="min-h-12 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-white outline-none placeholder:text-emerald-100/80"
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                  placeholder="Top-up amount"
                />
                <button
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-400 px-4 font-semibold text-slate-900 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => topUpMutation.mutate()}
                  disabled={topUpMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  {topUpMutation.isPending ? "Redirecting..." : "Continue to Paystack"}
                </button>
              </div>

              {topUpMutation.isError ? (
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white">
                  {topUpMutation.error.message}
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Wallet accounts</h3>
                <p className="mt-1 text-sm text-slate-500">Live balances and locked amounts across your account.</p>
              </div>
            </div>

            {(walletsQuery.data ?? []).length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No wallet accounts have been created yet.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {(walletsQuery.data ?? []).map((wallet) => (
                  <div key={wallet.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        {wallet.type === "PROMO_CREDIT" ? (
                          <Plus className="h-5 w-5" />
                        ) : wallet.type === "PASSENGER_CASHLESS" ? (
                          <Phone className="h-5 w-5" />
                        ) : (
                          <CreditCard className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{formatWalletType(wallet.type)}</p>
                        <p className="text-xs text-slate-500">
                          Locked {formatMoney(wallet.currency, wallet.lockedBalance)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatMoney(wallet.currency, wallet.availableBalance)}
                      </p>
                      <p className="text-xs text-slate-500">{wallet.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Recent transactions</h3>
          </div>

          <div className="px-6 py-5">
            {(transactionsQuery.data ?? []).length === 0 ? (
              <div className="text-sm text-slate-500">
                Wallet activity will appear here after top-ups, ride payments, or credits are posted.
              </div>
            ) : (
              <div className="space-y-4">
                {(transactionsQuery.data ?? []).map((transaction) => {
                  const TransactionIcon = getTransactionIcon(transaction);
                  const isCredit = transaction.direction === "credit";

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isCredit ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <TransactionIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {formatTransactionTitle(transaction)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatTransactionTime(transaction.createdAt)}
                          </p>
                          {transaction.ride ? (
                            <p className="mt-1 text-xs text-slate-400">
                              {transaction.ride.pickupAddress} to {transaction.ride.destinationAddress}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-semibold ${isCredit ? "text-emerald-700" : "text-slate-900"}`}>
                          {isCredit ? "+" : "-"}
                          {formatMoney(transaction.currency, transaction.amount)}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </section>
    </PassengerShell>
  );
}
