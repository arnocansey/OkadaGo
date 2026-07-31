"use client";

import { BrandMark } from "@/components/brand/BrandMark";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { OkadaLoader } from "@/components/ui/OkadaLoader";
import { Shield } from "lucide-react";

export function AccessState({
  title,
  body,
  actionLabel,
  actionHref,
  loading = false
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
  loading?: boolean;
}) {
  return (
    <ImmersivePage className="exact-admin-page admin-access-page" data-theme="dark">
      <div className="admin-access-gate">
        <div className="admin-access-gate-glow" aria-hidden />
        <div className="admin-access-gate-panel">
          <div className="admin-access-gate-brand">
            <BrandMark variant="wordmark" height={40} onDark product="shared" priority />
            <span className="admin-access-gate-eyebrow">
              <Shield size={14} aria-hidden />
              Admin console
            </span>
          </div>

          <div className="admin-access-gate-copy">
            <h1>{title}</h1>
            <p>{body}</p>
          </div>

          {loading ? (
            <div className="admin-access-gate-loading">
              <OkadaLoader size="sm" />
              <span>Checking your session…</span>
            </div>
          ) : (
            <a href={actionHref} className="admin-access-gate-cta">
              {actionLabel}
            </a>
          )}

          <p className="admin-access-gate-foot">OkadaGo operations · Accra, Ghana</p>
        </div>
      </div>
    </ImmersivePage>
  );
}
