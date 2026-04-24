"use client";

import dynamic from "next/dynamic";

const DynamicMapLabPage = dynamic(
  () => import("./map-lab-page").then((module) => module.MapLabPage),
  {
    ssr: false,
    loading: () => (
      <main className="workspace-page">
        <div className="container stack">
          <section className="content-card">
            <h3>Loading map lab</h3>
            <p className="body-muted" style={{ marginTop: 12 }}>
              Preparing the client-only Leaflet sandbox.
            </p>
          </section>
        </div>
      </main>
    )
  }
);

export function MapLabClient() {
  return <DynamicMapLabPage />;
}
