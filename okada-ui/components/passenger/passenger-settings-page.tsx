"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PassengerAccessState, PassengerShell } from "@/components/passenger/passenger-shell";

type WalletRecord = {
  id: string;
  currency: string;
  availableBalance: string | number;
};

type PassengerSettingsResponse = {
  fullName: string;
  email: string | null;
  phoneCountryCode: string;
  phoneLocal: string;
  phoneE164: string;
  preferredCurrency: string;
  defaultServiceCity: string | null;
  preferredPayment: "cash" | "card" | "wallet" | "mobile_money" | null;
  referralCode: string | null;
};

type PassengerSettingsUpdateResponse = {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    role: "passenger";
    accountStatus: string;
    fullName: string;
    email: string | null;
    phoneCountryCode: string;
    phoneLocal: string;
    phoneE164: string;
    preferredCurrency: string;
    passengerProfileId: string | null;
    riderProfileId: string | null;
    riderApprovalStatus: string | null;
    adminProfileId: string | null;
    dispatcherProfileId: string | null;
  };
  settings: PassengerSettingsResponse;
};

export function PassengerSettingsPage() {
  const { session, status, signOut, setSession } = useAuth();
  const queryClient = useQueryClient();
  const isPassenger = session?.user.role === "passenger";
  const userId = session?.user.id;
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    defaultServiceCity: "",
    preferredPayment: "cash"
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => requestJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const settingsQuery = useQuery({
    queryKey: ["passenger-settings", session?.token],
    queryFn: () =>
      requestJson<PassengerSettingsResponse>("/auth/passenger/settings", {
        token: session?.token
      }),
    enabled: status === "authenticated" && isPassenger && Boolean(session?.token)
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    setForm({
      fullName: settingsQuery.data.fullName,
      email: settingsQuery.data.email ?? "",
      defaultServiceCity: settingsQuery.data.defaultServiceCity ?? "",
      preferredPayment: settingsQuery.data.preferredPayment ?? "cash"
    });
  }, [settingsQuery.data]);

  const preferredWallet =
    (walletsQuery.data ?? []).find((wallet) => wallet.currency === session?.user.preferredCurrency) ??
    walletsQuery.data?.[0] ??
    null;

  const saveMutation = useMutation({
    mutationFn: async () =>
      requestJson<PassengerSettingsUpdateResponse>("/auth/passenger/settings", {
        method: "PATCH",
        token: session?.token,
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          defaultServiceCity: form.defaultServiceCity.trim() || null,
          preferredPayment: form.preferredPayment || null
        })
      }),
    onSuccess: async (payload) => {
      setSession({
        token: payload.token,
        expiresAt: payload.expiresAt,
        user: payload.user
      });
      queryClient.setQueryData(["passenger-settings", payload.token], payload.settings);
      await queryClient.invalidateQueries({ queryKey: ["wallets", userId] });
    }
  });

  if (status === "loading") {
    return (
      <PassengerAccessState
        title="Loading your settings"
        body="Checking your passenger session before opening account settings."
        actionLabel="Go to login"
        actionHref="/login"
      />
    );
  }

  if (status !== "authenticated" || !isPassenger || !session) {
    return (
      <PassengerAccessState
        title="Passenger sign in required"
        body="Use a passenger account to access your account settings."
        actionLabel="Go to passenger login"
        actionHref="/login"
      />
    );
  }

  return (
    <PassengerShell
      session={session}
      preferredWallet={preferredWallet}
      activeTab="settings"
      signOut={signOut}
    >
      <section className="exact-passenger-content">
        <div className="exact-passenger-pagehead">
          <div>
            <p className="kicker">Settings</p>
            <h1>Your passenger account</h1>
            <p className="body-muted">
              Update the account details and ride preferences that drive your passenger experience.
            </p>
          </div>
        </div>

        <div className="exact-passenger-summary-grid">
          <article className="exact-passenger-summary-card">
            <span>Phone</span>
            <strong>{settingsQuery.data?.phoneE164 ?? session.user.phoneE164}</strong>
          </article>
          <article className="exact-passenger-summary-card">
            <span>Currency</span>
            <strong>{settingsQuery.data?.preferredCurrency ?? session.user.preferredCurrency}</strong>
          </article>
          <article className="exact-passenger-summary-card">
            <span>Referral code</span>
            <strong>{settingsQuery.data?.referralCode ?? "Not assigned"}</strong>
          </article>
        </div>

        <section className="exact-passenger-panel">
          <div className="workbench-header">
            <p className="kicker">Profile</p>
            <h4>Identity and contact</h4>
            <p className="body-muted">These details are used across booking, wallet receipts, and support.</p>
          </div>

          <div className="two-up" style={{ marginTop: 18 }}>
            <div className="field-group">
              <label className="field-label">Full name</label>
              <input
                className="input"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="two-up" style={{ marginTop: 18 }}>
            <div className="field-group">
              <label className="field-label">Phone number</label>
              <input className="input" value={settingsQuery.data?.phoneE164 ?? session.user.phoneE164} readOnly />
            </div>
            <div className="field-group">
              <label className="field-label">Preferred currency</label>
              <input
                className="input"
                value={settingsQuery.data?.preferredCurrency ?? session.user.preferredCurrency}
                readOnly
              />
            </div>
          </div>
        </section>

        <section className="exact-passenger-panel">
          <div className="workbench-header">
            <p className="kicker">Ride preferences</p>
            <h4>Booking defaults</h4>
            <p className="body-muted">These defaults help us preload the right city and payment experience.</p>
          </div>

          <div className="two-up" style={{ marginTop: 18 }}>
            <div className="field-group">
              <label className="field-label">Default service city</label>
              <input
                className="input"
                value={form.defaultServiceCity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultServiceCity: event.target.value }))
                }
                placeholder="Accra"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Preferred payment</label>
              <select
                className="select"
                value={form.preferredPayment}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preferredPayment: event.target.value as "cash" | "card" | "wallet" | "mobile_money"
                  }))
                }
              >
                <option value="cash">Cash</option>
                <option value="wallet">Wallet</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile money</option>
              </select>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: 18 }}>
            <button
              className="button"
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save settings"}
            </button>
          </div>

          {saveMutation.isError ? (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <strong>Unable to save your settings.</strong>
              <p>{saveMutation.error.message}</p>
            </div>
          ) : null}

          {saveMutation.isSuccess ? (
            <div className="exact-passenger-inline-success" style={{ marginTop: 18 }}>
              Your passenger settings were updated successfully.
            </div>
          ) : null}
        </section>
      </section>
    </PassengerShell>
  );
}
