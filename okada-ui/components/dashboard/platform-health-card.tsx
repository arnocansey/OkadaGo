"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson, hasExternalApiBaseUrl } from "@/lib/api";

async function getHealth() {
  return fetchJson<{
    status: string;
    service: string;
    environment?: string;
    checkedAt: string;
  }>(hasExternalApiBaseUrl ? "/health" : "/api/health");
}

export function PlatformHealthCard() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["platform-health"],
    queryFn: getHealth
  });

  return (
    <section className="exact-admin-card exact-health-card">
      <p className="kicker">Platform Health</p>
      <h3>UI connectivity status</h3>
      {isPending ? (
        <div className="status-chip warning" style={{ marginTop: 18 }}>
          Checking service readiness
        </div>
      ) : null}
      {isError ? (
        <div className="status-chip neutral" style={{ marginTop: 18 }}>
          Waiting for API availability
        </div>
      ) : null}
      {data ? (
        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div className="status-chip success">Service healthy</div>
          <p className="body-muted">
            Endpoint <strong>{data.service}</strong> responded at{" "}
            <strong>{new Date(data.checkedAt).toLocaleString()}</strong>.
          </p>
          {data.environment ? (
            <p className="body-muted">
              Current backend environment: <strong>{data.environment}</strong>.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
