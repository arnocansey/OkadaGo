"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OkadaGo] Unhandled error:", error);
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
        <strong>Something went wrong.</strong>
        <p style={{ marginBottom: 24 }}>
          An unexpected error occurred while loading this page. Please try
          again or head back to the dashboard.
        </p>
        <div className="button-row" style={{ justifyContent: "center" }}>
          <button className="button" type="button" onClick={reset}>
            Try Again
          </button>
          <Link href="/" className="button-secondary" style={{ textDecoration: "none" }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
