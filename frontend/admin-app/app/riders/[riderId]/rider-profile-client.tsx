"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiUrl, requestJson } from "@/lib/api";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { BrandMark } from "@/components/brand/BrandMark";
import { RiderProfileScreen } from "@/components/dashboard/admin/RiderProfileScreen";
import type { RiderRecord, RideRecord, DeliveryRecord, WalletTransactionRecord, PayoutRequestRecord, AdminRatingRecord, AdminIncidentRecord, RiderDocumentRecord } from "@/components/dashboard/admin/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PagedResult<T> = { items: T[]; total: number };

export function RiderProfileClient({ riderId }: { riderId: string }) {
  const { session, status } = useAuth();
  const [rider, setRider] = useState<RiderRecord | null>(null);
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionRecord[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestRecord[]>([]);
  const [ratings, setRatings] = useState<AdminRatingRecord[]>([]);
  const [incidents, setIncidents] = useState<AdminIncidentRecord[]>([]);
  const [documents, setDocuments] = useState<RiderDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.token) return;

    let cancelled = false;

    async function fetchRiderData() {
      try {
        const token = session!.token;

        const [ridersResp, ridesResp, deliveriesResp, walletResp, payoutResp, ratingsResp, incidentsResp] = await Promise.all([
          requestJson<RiderRecord[] | PagedResult<RiderRecord>>("/admin/riders", { token }).catch(() => []),
          requestJson<PagedResult<RideRecord>>("/bootstrap/rides?limit=200", { token }).catch(() => ({ items: [], total: 0 })),
          requestJson<PagedResult<DeliveryRecord>>("/bootstrap/deliveries?limit=200", { token }).catch(() => ({ items: [], total: 0 })),
          requestJson<WalletTransactionRecord[]>("/admin/wallet-transactions", { token }).catch(() => []),
          requestJson<PayoutRequestRecord[]>("/admin/payout-requests", { token }).catch(() => []),
          requestJson<AdminRatingRecord[]>("/admin/ratings", { token }).catch(() => []),
          requestJson<AdminIncidentRecord[]>("/admin/incidents", { token }).catch(() => [])
        ]);

        if (cancelled) return;

        const ridersList = Array.isArray(ridersResp) ? ridersResp : (ridersResp?.items ?? []);
        const foundRider = ridersList.find((r) => r.id === riderId);

        if (!foundRider) {
          setError("Rider not found");
          setLoading(false);
          return;
        }

        setRider(foundRider);
        setRides(Array.isArray(ridesResp) ? ridesResp : (ridesResp?.items ?? []));
        setDeliveries(Array.isArray(deliveriesResp) ? deliveriesResp : (deliveriesResp?.items ?? []));
        setWalletTransactions(Array.isArray(walletResp) ? walletResp : []);
        setPayoutRequests(Array.isArray(payoutResp) ? payoutResp : []);
        setRatings(Array.isArray(ratingsResp) ? ratingsResp : []);
        setIncidents(Array.isArray(incidentsResp) ? incidentsResp : []);
      } catch {
        if (!cancelled) setError("Failed to load rider profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRiderData();
    return () => { cancelled = true; };
  }, [riderId, session, status]);

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
              <Link href="/riders" className="rd-sidebar-back">
                <ArrowLeft size={16} /> Back to Riders
              </Link>
            </div>
          </aside>
          <div className="exact-admin-main">
            <div className="exact-admin-scroll" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading rider profile…</div>
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
            <p style={{ marginBottom: 16 }}>Use an OkadaGo admin account to view rider profiles.</p>
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
            <Link href="/riders" className="rd-sidebar-back">
              <ArrowLeft size={16} /> Back to Riders
            </Link>
          </div>
        </aside>
        <div className="exact-admin-main">
          <main className="exact-admin-scroll">
            <RiderProfileScreen
              rider={rider}
              rides={rides}
              deliveries={deliveries}
              walletTransactions={walletTransactions}
              payoutRequests={payoutRequests}
              ratings={ratings}
              incidents={incidents}
              documents={documents}
              loading={loading}
              error={error}
            />
          </main>
        </div>
      </div>
    </ImmersivePage>
  );
}
