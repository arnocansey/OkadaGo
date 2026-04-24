"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { currencySymbol, formatMoney } from "@/lib/currency";
import { PassengerAccessState, PassengerShell } from "@/components/passenger/passenger-shell";

type ServiceZoneRecord = {
  id: string;
  name: string;
  city: string;
  countryCode: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
  cancellationFee: string | number;
  waitingFeePerMin: string | number;
};

type WalletRecord = {
  id: string;
  currency: string;
  availableBalance: string | number;
};

type RiderRecord = {
  id: string;
  serviceZoneId: string | null;
  onlineStatus: boolean;
};

export function PassengerServicePage() {
  const { session, status, signOut } = useAuth();
  const isPassenger = session?.user.role === "passenger";
  const userId = session?.user.id;

  const zonesQuery = useQuery({
    queryKey: ["service-zones"],
    queryFn: () => fetchJson<ServiceZoneRecord[]>("/bootstrap/service-zones?limit=100"),
    enabled: status === "authenticated"
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchJson<RiderRecord[]>("/bootstrap/riders?limit=100"),
    enabled: status === "authenticated"
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const preferredWallet =
    (walletsQuery.data ?? []).find((wallet) => wallet.currency === session?.user.preferredCurrency) ??
    walletsQuery.data?.[0] ??
    null;

  const zonesWithSupply = useMemo(
    () =>
      (zonesQuery.data ?? []).map((zone) => ({
        ...zone,
        onlineRiders: (ridersQuery.data ?? []).filter(
          (rider) => rider.onlineStatus && rider.serviceZoneId === zone.id
        ).length
      })),
    [ridersQuery.data, zonesQuery.data]
  );

  if (status === "loading") {
    return (
      <PassengerAccessState
        title="Loading service coverage"
        body="Checking your passenger session before opening service coverage."
        actionLabel="Go to login"
        actionHref="/login"
      />
    );
  }

  if (status !== "authenticated" || !isPassenger || !session) {
    return (
      <PassengerAccessState
        title="Passenger sign in required"
        body="Use a passenger account to access service coverage and pricing."
        actionLabel="Go to passenger login"
        actionHref="/login"
      />
    );
  }

  return (
    <PassengerShell
      session={session}
      preferredWallet={preferredWallet}
      activeTab="service"
      signOut={signOut}
    >
      <section className="exact-passenger-content">
        <div className="exact-passenger-pagehead">
          <div>
            <p className="kicker">Service coverage</p>
            <h1>Zones, pricing, and availability</h1>
            <p className="body-muted">
              This page shows the live service zones, Ghana-first pricing, and rider supply used by the passenger booking flow.
            </p>
          </div>
        </div>

        {(zonesWithSupply.length === 0) ? (
          <section className="exact-passenger-panel">
            <div className="empty-state">
              <strong>No service zones are configured yet.</strong>
              <p>Create or import a live Ghana service zone from the operator tools and it will show up here.</p>
            </div>
          </section>
        ) : (
          <div className="exact-passenger-service-grid">
            {zonesWithSupply.map((zone) => (
              <article key={zone.id} className="exact-passenger-panel">
                <div className="workbench-header">
                  <p className="kicker">{zone.countryCode === "GH" ? "Ghana" : "Regional"}</p>
                  <h4>{zone.name}</h4>
                  <p className="body-muted">{zone.city} service coverage</p>
                </div>
                <div className="exact-passenger-zone-metrics">
                  <div>
                    <span>Base fare</span>
                    <strong>{formatMoney(zone.currency, zone.baseFare)}</strong>
                  </div>
                  <div>
                    <span>Per km</span>
                    <strong>{formatMoney(zone.currency, zone.perKmFee)}</strong>
                  </div>
                  <div>
                    <span>Minimum</span>
                    <strong>{formatMoney(zone.currency, zone.minimumFare)}</strong>
                  </div>
                  <div>
                    <span>Live riders</span>
                    <strong>{zone.onlineRiders}</strong>
                  </div>
                </div>
                <p className="body-muted" style={{ marginTop: 18 }}>
                  Currency: <strong>{currencySymbol(zone.currency)}</strong>. Waiting fee {formatMoney(zone.currency, zone.waitingFeePerMin)} per minute.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PassengerShell>
  );
}
