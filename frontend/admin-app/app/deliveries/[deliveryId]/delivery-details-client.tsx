"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { BrandMark } from "@/components/brand/BrandMark";
import { DeliveryDetailsScreen } from "@/components/dashboard/admin/DeliveryDetailsScreen";
import type { DeliveryRecord } from "@/components/dashboard/admin/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function DeliveryDetailsClient({ deliveryId }: { deliveryId: string }) {
  const { session, status } = useAuth();
  const [delivery, setDelivery] = useState<DeliveryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.token) return;

    let cancelled = false;

    async function fetchDelivery() {
      try {
        const res = await fetch(apiUrl(`/deliveries/${deliveryId}`), {
          headers: { Authorization: `Bearer ${session!.token}` }
        });
        if (!res.ok) {
          if (!cancelled) setError(`Delivery not found (${res.status})`);
          return;
        }
        const data = await res.json();
        if (!cancelled) setDelivery(data);
      } catch {
        if (!cancelled) setError("Failed to load delivery details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDelivery();
    return () => { cancelled = true; };
  }, [deliveryId, session, status]);

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
              <Link href="/deliveries" className="rd-sidebar-back">
                <ArrowLeft size={16} /> Back to Deliveries
              </Link>
            </div>
          </aside>
          <div className="exact-admin-main">
            <div className="exact-admin-scroll" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading delivery details…</div>
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
            <p style={{ marginBottom: 16 }}>Use an OkadaGo admin account to view delivery details.</p>
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
            <Link href="/deliveries" className="rd-sidebar-back">
              <ArrowLeft size={16} /> Back to Deliveries
            </Link>
          </div>
        </aside>
        <div className="exact-admin-main">
          <main className="exact-admin-scroll">
            <DeliveryDetailsScreen delivery={delivery} loading={loading} error={error} />
          </main>
        </div>
      </div>
    </ImmersivePage>
  );
}
