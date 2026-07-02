"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { paxToast } from "@/components/passenger/lib/toast";
import { SubPageShell } from "@/components/passenger/ui/sub-page-shell";
import { PaymentMethodsSkeleton } from "@/components/passenger/ui/skeletons";
import type { PassengerSettings, PaymentMethod } from "@/components/passenger/types";

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "cash", label: "Cash", description: "Pay your rider directly after the trip", icon: CreditCard },
  { id: "wallet", label: "Wallet", description: "Use your OkadaGo wallet balance", icon: Wallet },
  { id: "card", label: "Card", description: "Debit or credit card payments", icon: CreditCard },
  { id: "mobile_money", label: "Mobile money", description: "MTN MoMo, Vodafone Cash, and more", icon: Smartphone }
];

type SettingsUpdateResponse = {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    role: "passenger";
    fullName: string;
    email: string | null;
    phoneE164: string;
    preferredCurrency: string;
    passengerProfileId: string | null;
    riderProfileId: string | null;
    riderApprovalStatus: string | null;
    adminProfileId: string | null;
    dispatcherProfileId: string | null;
    accountStatus: string;
    phoneCountryCode: string;
    phoneLocal: string;
  };
  settings: PassengerSettings;
};

export function PaymentMethodsView() {
  const { session, setSession } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PaymentMethod>("cash");

  const settingsQuery = useQuery({
    queryKey: ["passenger-settings", session?.token],
    queryFn: () =>
      requestJson<PassengerSettings>("/auth/passenger/settings", { token: session?.token }),
    enabled: Boolean(session?.token)
  });

  useEffect(() => {
    if (settingsQuery.data?.preferredPayment) {
      setSelected(settingsQuery.data.preferredPayment);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      requestJson<SettingsUpdateResponse>("/auth/passenger/settings", {
        method: "PATCH",
        token: session?.token,
        body: JSON.stringify({ preferredPayment: selected })
      }),
    onSuccess: (data) => {
      setSession({
        token: data.token,
        expiresAt: data.expiresAt,
        user: data.user
      });
      void queryClient.invalidateQueries({ queryKey: ["passenger-settings"] });
      paxToast.success("Default payment method saved");
    },
    onError: (error) => {
      paxToast.error("Could not save payment method", (error as Error).message);
    }
  });

  return (
    <PassengerAppFrame>
      <SubPageShell title="Payment methods">
        <p className="mb-6 text-sm pax-text-secondary">
          Choose your default payment method for rides and deliveries.
        </p>

        {settingsQuery.isLoading ? (
          <PaymentMethodsSkeleton />
        ) : (
          <>
        <div className="mb-6 flex flex-col gap-3">
          {PAYMENT_OPTIONS.map(({ id, label, description, icon: Icon }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={`pax-card flex items-start gap-4 p-4 text-left transition-colors ${
                  active ? "border-[var(--pax-primary)] bg-[var(--pax-warning-light)]" : ""
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-[var(--pax-primary)] text-[var(--pax-text-on-primary)]" : "bg-[var(--pax-surface-elevated)] pax-text-secondary"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{label}</div>
                  <div className="mt-0.5 text-sm pax-text-secondary">{description}</div>
                </div>
                <div
                  className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 ${
                    active ? "border-[var(--pax-primary)] bg-[var(--pax-primary)]" : "border-[var(--pax-border-strong)]"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {saveMutation.error ? (
          <p className="mb-3 text-sm pax-text-danger">{(saveMutation.error as Error).message}</p>
        ) : null}

        <button
          type="button"
          className="pax-btn-primary !h-11"
          disabled={saveMutation.isPending || settingsQuery.isLoading}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? "Saving…" : "Save default method"}
        </button>
          </>
        )}
      </SubPageShell>
    </PassengerAppFrame>
  );
}
