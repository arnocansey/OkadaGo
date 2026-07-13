"use client";

import { useState } from "react";
import {
  CreditCard,
  Star,
  MoreVertical,
  ExternalLink,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  HelpCircle,
  Settings,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonKPI, SkeletonTable } from "./AdminSkeleton";

export type PaymentMethodsScreenProps = {
  dataLoading?: boolean;
};

type PaymentMethod = {
  id: string;
  name: string;
  type: string;
  details: string;
  status: "Verified" | "Pending";
  isPrimary: boolean;
};

type Activity = {
  id: string;
  type: "Payout" | "Receive";
  method: string;
  reference: string;
  amount: string;
  status: "Completed" | "Processing" | "Failed";
  date: string;
};

const MOCK_METHODS: PaymentMethod[] = [
  { id: "1", name: "MTN Mobile Money", type: "Mobile Money", details: "**** 4523", status: "Verified", isPrimary: true },
  { id: "2", name: "Vodafone Cash", type: "Mobile Money", details: "**** 8712", status: "Verified", isPrimary: false },
  { id: "3", name: "AirtelTigo Money", type: "Mobile Money", details: "**** 3290", status: "Verified", isPrimary: false },
  { id: "4", name: "GCB Bank", type: "Bank Account", details: "1234567890", status: "Verified", isPrimary: false },
  { id: "5", name: "Access Bank", type: "Bank Account", details: "9876543210", status: "Pending", isPrimary: false },
  { id: "6", name: "PayPal", type: "Online Wallet", details: "admin@okada.com", status: "Verified", isPrimary: false },
];

const MOCK_ACTIVITY: Activity[] = [
  { id: "1", type: "Payout", method: "MTN Mobile Money", reference: "PAY-2026-0711", amount: "GHS 2,450.00", status: "Completed", date: "Jul 11, 2026" },
  { id: "2", type: "Receive", method: "Vodafone Cash", reference: "RCV-2026-0710", amount: "GHS 1,200.00", status: "Completed", date: "Jul 10, 2026" },
  { id: "3", type: "Payout", method: "GCB Bank", reference: "PAY-2026-0709", amount: "GHS 5,000.00", status: "Processing", date: "Jul 9, 2026" },
  { id: "4", type: "Receive", method: "MTN Mobile Money", reference: "RCV-2026-0708", amount: "GHS 890.00", status: "Completed", date: "Jul 8, 2026" },
];

const TABS = ["Overview", "Payout Methods", "Transaction Limits", "Payment History", "Refund Settings"];

const badgeStyle = (status: string): React.CSSProperties => ({
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: status === "Verified" ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.12)",
  color: status === "Verified" ? "#22c55e" : "#eab308",
});

const activityBadgeStyle = (status: string): React.CSSProperties => ({
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: status === "Completed" ? "rgba(34,197,94,0.12)" : status === "Processing" ? "rgba(56,189,248,0.12)" : "rgba(239,68,68,0.12)",
  color: status === "Completed" ? "#22c55e" : status === "Processing" ? "#38bdf8" : "#ef4444",
});

export function PaymentMethodsScreen({ dataLoading = false }: PaymentMethodsScreenProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState("Overview");
  const [autoPayout, setAutoPayout] = useState(true);

  if (dataLoading) {
    return (
      <div style={{ padding: isMobile ? "16px 12px" : "24px 28px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={4} />
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 20,
  };

  const linkStyle: React.CSSProperties = {
    color: "#f97316",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  };

  const sidebarCardStyle: React.CSSProperties = {
    ...cardStyle,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  const settingRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid var(--border)",
    fontSize: 13,
    color: "var(--text-secondary)",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: isMobile ? "16px 12px" : "24px 28px",
        minHeight: "100vh",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Payment Methods</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" }}>Manage how your company receives payments and makes payouts.</p>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "#f97316",
            color: "#000",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} /> Add Payment Method
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab ? "#f97316" : "var(--text-secondary)",
              borderBottom: activeTab === tab ? "2px solid #f97316" : "2px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main + Sidebar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 340px",
          gap: 18,
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          {/* Payment Methods table */}
          <div style={{ ...cardStyle, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>Method</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>Type</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>Account Details</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600 }}>Primary</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_METHODS.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{m.type}</td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{m.details}</td>
                      <td style={{ padding: "12px" }}><span style={badgeStyle(m.status)}>{m.status}</span></td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {m.isPrimary ? <Star size={16} fill="#f97316" color="#f97316" /> : <span style={{ color: "var(--text-secondary)" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}>
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "14px 12px 0", borderTop: "1px solid var(--border)" }}>
              <a href="#" style={linkStyle}><Plus size={14} /> Add Payment Method</a>
            </div>
          </div>

          {/* Recent Payment Activity */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Payment Activity</h3>
              <a href="#" style={linkStyle}>View All <ChevronRight size={14} /></a>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600 }}>Activity</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600 }}>Method</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600 }}>Reference</th>
                    <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 600 }}>Amount</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ACTIVITY.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px", display: "flex", alignItems: "center", gap: 8 }}>
                        {a.type === "Payout" ? <ArrowUpRight size={14} color="#f97316" /> : <ArrowDownLeft size={14} color="#22c55e" />}
                        <span style={{ color: a.type === "Payout" ? "#f97316" : "#22c55e", fontWeight: 600 }}>{a.type}</span>
                      </td>
                      <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{a.method}</td>
                      <td style={{ padding: "10px", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: 12 }}>{a.reference}</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{a.amount}</td>
                      <td style={{ padding: "10px" }}><span style={activityBadgeStyle(a.status)}>{a.status}</span></td>
                      <td style={{ padding: "10px", color: "var(--text-secondary)" }}>{a.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Payment Summary */}
          <div style={sidebarCardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Payment Summary</h3>
            <div style={{ ...settingRowStyle }}>
              <span>Total Payment Methods</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>6</span>
            </div>
            <div style={{ ...settingRowStyle }}>
              <span>Verified Methods</span>
              <span style={{ color: "#22c55e", fontWeight: 600 }}>5</span>
            </div>
            <div style={{ ...settingRowStyle }}>
              <span>Pending Verification</span>
              <span style={{ color: "#eab308", fontWeight: 600 }}>1</span>
            </div>
            <div style={{ ...settingRowStyle, borderBottom: "none" }}>
              <span>Primary Payment Method</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 12 }}>MTN Mobile Money</span>
            </div>
            <a href="#" style={linkStyle}>View Payment History <ChevronRight size={14} /></a>
          </div>

          {/* Payout Settings */}
          <div style={sidebarCardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Payout Settings</h3>
            <div style={{ ...settingRowStyle }}>
              <span>Default Payout Method</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 12 }}>MTN Mobile Money</span>
            </div>
            <div style={{ ...settingRowStyle }}>
              <span>Payout Schedule</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Daily</span>
            </div>
            <div style={{ ...settingRowStyle }}>
              <span>Min Payout Threshold</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>GHS 50.00</span>
            </div>
            <div style={{ ...settingRowStyle, borderBottom: "none" }}>
              <span>Auto Payout</span>
              <button
                onClick={() => setAutoPayout(!autoPayout)}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  border: "none",
                  background: autoPayout ? "#22c55e" : "#3a3b3e",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: autoPayout ? 21 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>
            <a href="#" style={linkStyle}>Manage Payout Settings <ChevronRight size={14} /></a>
          </div>

          {/* Need Help */}
          <div style={sidebarCardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <HelpCircle size={18} /> Need Help?
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Learn how to configure payment gateways, set payout schedules, and manage your company's financial integrations.
            </p>
            <a
              href="#"
              style={{
                ...linkStyle,
                justifyContent: "center",
                padding: "9px 0",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
              }}
            >
              View Help Center <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
