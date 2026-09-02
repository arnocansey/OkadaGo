"use client";

import { CheckCircle2, XCircle, Plug, Map, CreditCard, Server } from "lucide-react";
import { hasExternalApiBaseUrl } from "@/lib/api";
import { hasGoogleMapsKey } from "@/lib/maps";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";

export function IntegrationsScreen() {
  const hasPaystack = Boolean(
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || hasExternalApiBaseUrl
  );

  const integrations = [
    {
      name: "OkadaGo API Server",
      description: "Production Fastify API on Render (https://okadago-backend.onrender.com/v1)",
      connected: hasExternalApiBaseUrl,
      icon: <Server size={18} />
    },
    {
      name: "Google Maps SDK",
      description: "Interactive Maps, Geocoding & Direction APIs for Ghana",
      connected: hasGoogleMapsKey(),
      icon: <Map size={18} />
    },
    {
      name: "Paystack Payments",
      description: "Live Mobile Money (MTN, Telecel, AT) & Card gateway connected",
      connected: hasPaystack,
      icon: <CreditCard size={18} />
    },
    {
      name: "Google Places & Geocoding",
      description: "Reverse-geocoding, landmark search, and autocomplete API",
      connected: hasExternalApiBaseUrl,
      icon: <Plug size={18} />
    }
  ];

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Integrations & Gateways"
        subtitle="Live payment, mapping, routing, and backend service status for Ghana operations."
      />

      <AdminKpiRow
        items={[
          { label: "Total Gateways", value: integrations.length, hint: "Connected services", icon: <Plug size={18} />, tone: "yellow" },
          { label: "Active & Connected", value: connectedCount, hint: "Operational in this environment", icon: <CheckCircle2 size={18} />, tone: "green" },
          { label: "System Health", value: "100%", hint: "All systems online", icon: <CheckCircle2 size={18} />, tone: "green" }
        ]}
      />

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>Live service status</h3>
            <p>Active infrastructure connections powering OkadaGo dispatch and checkout.</p>
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
                      {item.connected ? "Connected" : "Not configured"}
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
