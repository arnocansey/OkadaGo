"use client";

import { CheckCircle2, XCircle, Plug, Map, CreditCard, Server } from "lucide-react";
import { hasExternalApiBaseUrl } from "@/lib/api";
import { hasGoogleMapsKey } from "@/lib/maps";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";

export function IntegrationsScreen() {
  const integrations = [
    {
      name: "OkadaGo API",
      description: "Backend base URL for admin and app traffic",
      connected: hasExternalApiBaseUrl,
      icon: <Server size={18} />
    },
    {
      name: "Google Maps",
      description: "Maps SDK for passenger/rider web maps",
      connected: hasGoogleMapsKey(),
      icon: <Map size={18} />
    },
    {
      name: "Paystack",
      description: "Public key present for checkout flows",
      connected: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
      icon: <CreditCard size={18} />
    },
    {
      name: "Google Places",
      description: "Configured on the API server (food & address search)",
      connected: hasExternalApiBaseUrl,
      icon: <Plug size={18} />
    }
  ];

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Integrations"
        subtitle="Maps, Paystack, and API connection status for Ghana deployments."
      />

      <AdminKpiRow
        items={[
          { label: "Integrations", value: integrations.length, hint: "Tracked services", icon: <Plug size={22} />, tone: "yellow" },
          { label: "Connected", value: connectedCount, hint: "Configured in this environment", icon: <CheckCircle2 size={22} />, tone: "green" },
          { label: "Needs attention", value: integrations.length - connectedCount, hint: "Missing keys or base URL", icon: <XCircle size={22} />, tone: "red" }
        ]}
      />

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>Service status</h3>
            <p>No fabricated activity logs — only configuration truth.</p>
          </div>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((item) => (
                <tr key={item.name}>
                  <td>
                    <div className="admin-action-row">
                      {item.icon}
                      <strong>{item.name}</strong>
                    </div>
                  </td>
                  <td><small>{item.description}</small></td>
                  <td>
                    <em className={`admin-reference-tag ${item.connected ? "success" : "danger"}`}>
                      {item.connected ? "Configured" : "Not configured"}
                    </em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
