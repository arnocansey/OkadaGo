"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiUrl, requestJson } from "@/lib/api";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { BrandMark } from "@/components/brand/BrandMark";
import { PassengerProfileScreen } from "@/components/dashboard/admin/PassengerProfileScreen";
import type { PassengerRecord, RideRecord, DeliveryRecord, WalletTransactionRecord, AdminIncidentRecord } from "@/components/dashboard/admin/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PagedResult<T> = { items: T[]; total: number };

export function PassengerProfileClient({ passengerId }: { passengerId: string }) {
  const { session, status } = useAuth();
  const [passenger, setPassenger] = useState<PassengerRecord | null>(null);
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionRecord[]>([]);
  const [incidents, setIncidents] = useState<AdminIncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.token) return;

    let cancelled = false;

    async function fetchPassengerData() {
      try {
        const token = session!.token;

        const [passengersResp, ridesResp, deliveriesResp, walletResp, incidentsResp] = await Promise.all([
          requestJson<PassengerRecord[] | PagedResult<PassengerRecord>>("/bootstrap/passengers", { token }).catch(() => []),
          requestJson<PagedResult<RideRecord>>("/bootstrap/rides?limit=200", { token }).catch(() => ({ items: [], total: 0 })),
          requestJson<PagedResult<DeliveryRecord>>("/bootstrap/deliveries?limit=200", { token }).catch(() => ({ items: [], total: 0 })),
          requestJson<WalletTransactionRecord[]>("/admin/wallet-transactions", { token }).catch(() => []),
          requestJson<AdminIncidentRecord[]>("/admin/incidents", { token }).catch(() => [])
        ]);

        if (cancelled) return;

        const passengersList = Array.isArray(passengersResp) ? passengersResp : (passengersResp?.items ?? []);
        const foundPassenger = passengersList.find((p) => p.id === passengerId);

        if (!foundPassenger) {
          setError("Passenger not found");
          setLoading(false);
          return;
        }

        setPassenger(foundPassenger);
        setRides(Array.isArray(ridesResp) ? ridesResp : (ridesResp?.items ?? []));
        setDeliveries(Array.isArray(deliveriesResp) ? deliveriesResp : (deliveriesResp?.items ?? []));
        setWalletTransactions(Array.isArray(walletResp) ? walletResp : []);
        setIncidents(Array.isArray(incidentsResp) ? incidentsResp : []);
      } catch {
        if (!cancelled) setError("Failed to load passenger profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPassengerData();
    return () => { cancelled = true; };
  }, [passengerId, session, status]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <ImmersivePage className="exact-admin-page" data-theme="dark">
        <div className="exact-admin-shell">
          <aside className="exact-admin-sidebar">
            <div className="exact-admin-brand">
              <div className="exact-admin-brand-copy">
                <BrandMark variant="wordmark" height={32} product="shared" />
                <small>Fleet Management</small>
              </div>
            </div>
            <div className="exact-admin-nav" style={{ padding: 16 }}>
              <Link href="/passengers" className="rd-sidebar-back">
                <ArrowLeft size={16} /> Back to Passengers
              </Link>
            </div>
          </aside>
          <div className="exact-admin-main">
            <div className="exact-admin-scroll" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading passenger profile…</div>
            </div>
          </div>
        </div>
      </ImmersivePage>
    );
  }

  if (status !== "authenticated") {
    return (
      <ImmersivePage className="exact-admin-page" data-theme="dark">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "var(--text-primary)", marginBottom: 8 }}>Sign in required</h2>
            <p style={{ marginBottom: 16 }}>Use an OkadaGo admin account to view passenger profiles.</p>
            <Link href="/login" className="rd-btn rd-btn-primary">Sign in</Link>
          </div>
        </div>
      </ImmersivePage>
    );
  }

  return (
    <ImmersivePage className="exact-admin-page" data-theme="dark">
      <div className="exact-admin-shell">
        <aside className="exact-admin-sidebar">
          <div className="exact-admin-brand">
            <div className="exact-admin-brand-copy">
              <BrandMark variant="wordmark" height={32} product="shared" />
              <small>Fleet Management</small>
            </div>
          </div>
          <div className="exact-admin-nav" style={{ padding: 16 }}>
            <Link href="/passengers" className="rd-sidebar-back">
              <ArrowLeft size={16} /> Back to Passengers
            </Link>
          </div>
        </aside>
        <div className="exact-admin-main">
          <main className="exact-admin-scroll">
            <PassengerProfileScreen
              passenger={passenger}
              rides={rides}
              deliveries={deliveries}
              walletTransactions={walletTransactions}
              incidents={incidents}
              loading={loading}
              error={error}
            />
          </main>
        </div>
      </div>
    </ImmersivePage>
  );
}
