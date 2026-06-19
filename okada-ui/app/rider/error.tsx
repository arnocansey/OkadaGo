"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RiderError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OkadaGo Rider] Error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "48px 24px",
        textAlign: "center"
      }}
    >
      <div className="empty-state dark" style={{ maxWidth: 480 }}>
        <strong>Rider portal error.</strong>
        <p style={{ marginBottom: 24 }}>
          The rider dashboard ran into an issue while loading your data. This
          may be a temporary connection problem.
        </p>
        <div className="button-row" style={{ justifyContent: "center" }}>
          <button className="button" type="button" onClick={reset}>
            Try Again
          </button>
          <Link href="/rider" className="button-secondary" style={{ textDecoration: "none" }}>
            Rider Home
          </Link>
        </div>
      </div>
    </div>
  );
}
