"use client";

import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export interface AccessDeniedScreenProps {
  user?: SessionUser | null;
  screenTitle?: string;
  requiredRole?: string;
}

export function AccessDeniedScreen({
  user,
  screenTitle = "This Section",
  requiredRole
}: AccessDeniedScreenProps) {
  const userRoleTitle = user?.adminTitle || user?.role || "Staff";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "65vh",
        textAlign: "center",
        padding: "32px 16px"
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          marginBottom: 24
        }}
      >
        <Lock size={36} />
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 999,
          background: "rgba(239, 68, 68, 0.1)",
          color: "#f87171",
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}
      >
        <ShieldAlert size={14} /> Access Restricted
      </div>

      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--foreground, #ffffff)",
          margin: "0 0 8px"
        }}
      >
        Access Denied to {screenTitle}
      </h2>

      <p
        style={{
          maxWidth: 480,
          color: "var(--muted, #94a3b8)",
          fontSize: 14,
          lineHeight: 1.6,
          margin: "0 0 24px"
        }}
      >
        Your account role (<strong>{userRoleTitle}</strong>) does not have sufficient permissions to view or manage this module.
        {requiredRole && (
          <span style={{ display: "block", marginTop: 4 }}>
            Requires: <em>{requiredRole}</em>
          </span>
        )}
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 8,
            background: "var(--primary, #f59e0b)",
            color: "#000000",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)"
          }}
        >
          <LayoutDashboard size={16} /> Return to Dashboard
        </a>
      </div>
    </div>
  );
}
