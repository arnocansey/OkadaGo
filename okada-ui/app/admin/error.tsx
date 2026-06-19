"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OkadaGo Admin] Error:", error);
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
        <strong>Admin dashboard error.</strong>
        <p style={{ marginBottom: 24 }}>
          The admin panel ran into an issue. This could be a temporary backend
          problem or a rendering issue.
        </p>
        <div className="button-row" style={{ justifyContent: "center" }}>
          <button className="button" type="button" onClick={reset}>
            Try Again
          </button>
          <Link href="/admin" className="button-secondary" style={{ textDecoration: "none" }}>
            Admin Home
          </Link>
        </div>
      </div>
    </div>
  );
}
