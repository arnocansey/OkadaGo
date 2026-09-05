import Link from "next/link";
import { LayoutDashboard, Activity, Users, Bike, Package, ArrowLeft } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        padding: "48px 24px",
        textAlign: "center"
      }}
    >
      <div
        className="empty-state dark"
        style={{
          maxWidth: 520,
          background: "var(--card-bg, #0f172a)",
          border: "1px solid var(--border-color, #1e293b)",
          borderRadius: 16,
          padding: "36px 28px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
        }}
      >
        <div
          style={{
            fontSize: "3.5rem",
            fontWeight: 800,
            color: "var(--accent-yellow, #eab308)",
            lineHeight: 1,
            marginBottom: 12
          }}
        >
          404
        </div>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text-primary, #f8fafc)",
            marginBottom: 8
          }}
        >
          Admin Page Not Found
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-muted, #94a3b8)",
            marginBottom: 28,
            lineHeight: 1.5
          }}
        >
          The requested console screen could not be located. It may have been moved or the URL might have an alternate naming convention.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "var(--accent-yellow, #eab308)",
              color: "#000",
              fontWeight: 600,
              fontSize: "0.875rem",
              borderRadius: 8,
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border-color, #1e293b)",
            paddingTop: 20,
            textAlign: "left"
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted, #64748b)",
              marginBottom: 12
            }}
          >
            Quick Navigation Links
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8
            }}
          >
            <Link
              href="/rider-assignment"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--text-primary, #f1f5f9)",
                fontSize: "0.8125rem",
                textDecoration: "none"
              }}
            >
              <Users size={14} color="#eab308" />
              Rider Assignment
            </Link>
            <Link
              href="/live-operations"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--text-primary, #f1f5f9)",
                fontSize: "0.8125rem",
                textDecoration: "none"
              }}
            >
              <Activity size={14} color="#22c55e" />
              Live Operations
            </Link>
            <Link
              href="/requests"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--text-primary, #f1f5f9)",
                fontSize: "0.8125rem",
                textDecoration: "none"
              }}
            >
              <Bike size={14} color="#3b82f6" />
              Rides Queue
            </Link>
            <Link
              href="/deliveries"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--text-primary, #f1f5f9)",
                fontSize: "0.8125rem",
                textDecoration: "none"
              }}
            >
              <Package size={14} color="#a855f7" />
              Deliveries
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
