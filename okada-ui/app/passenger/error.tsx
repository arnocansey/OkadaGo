"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PassengerError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OkadaGo Passenger] Error:", error);
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
        <strong>Booking page error.</strong>
        <p style={{ marginBottom: 24 }}>
          The passenger booking screen encountered an issue. This is usually
          temporary. Try again or return to the home screen.
        </p>
        <div className="button-row" style={{ justifyContent: "center" }}>
          <button className="button" type="button" onClick={reset}>
            Try Again
          </button>
          <Link href="/passenger" className="button-secondary" style={{ textDecoration: "none" }}>
            Passenger Home
          </Link>
        </div>
      </div>
    </div>
  );
}
