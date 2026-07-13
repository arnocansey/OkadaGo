"use client";

import { useState } from "react";
import {
  Bell,
  BellRing,
  FileText,
  Users,
  Wallet,
  Megaphone,
  Shield,
  UserCheck,
  ClipboardCheck,
  CheckCircle2,
  Mail,
  Smartphone,
  MessageSquare,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Settings2,
} from "lucide-react";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonCard } from "./AdminSkeleton";

export type SettingsNotificationsScreenProps = {
  dataLoading?: boolean;
};

const DARK = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surfaceAlt: "#222633",
  border: "#2a2e3d",
  text: "#e8eaf0",
  textMuted: "#8b8fa3",
  accent: "#6c5ce7",
  green: "#00c853",
  greenBg: "#0f2e1a",
  red: "#ff5252",
  redBg: "#2e0f0f",
  yellow: "#ffc107",
  yellowBg: "#2e2a0f",
  orange: "#f7931a",
  orangeBg: "#2e1a0f",
  blue: "#448aff",
  blueBg: "#0f1e2e",
  purple: "#a855f7",
  purpleBg: "#1e0f2e",
  cyan: "#22d3ee",
  cyanBg: "#0f2e2e",
  pink: "#ec4899",
  pinkBg: "#2e0f1e",
  input: "#161922",
} as const;

type CategoryColor = {
  bg: string;
  color: string;
  label: string;
};

const CATEGORIES: Record<string, CategoryColor> = {
  System: { bg: "#0f1e2e", color: "#448aff", label: "System" },
  Documents: { bg: "#1e0f2e", color: "#a855f7", label: "Documents" },
  Riders: { bg: "#0f2e1a", color: "#00c853", label: "Riders" },
  Payouts: { bg: "#2e2a0f", color: "#ffc107", label: "Payouts" },
  Promotions: { bg: "#2e0f1e", color: "#ec4899", label: "Promotions" },
  Security: { bg: "#2e0f0f", color: "#ff5252", label: "Security" },
  Users: { bg: "#0f2e2e", color: "#22d3ee", label: "Users" },
  Compliance: { bg: "#2e1a0f", color: "#f7931a", label: "Compliance" },
  Welcome: { bg: "#0f2e1a", color: "#00c853", label: "Welcome" },
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  timeAgo: string;
  unread: boolean;
  iconColor: string;
  iconBg: string;
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "1", title: "Company profile verified", description: "Your company profile has been successfully verified and approved.", category: "System", timeAgo: "2m ago", unread: true, iconColor: "#448aff", iconBg: "#0f1e2e" },
  { id: "2", title: "Document uploaded", description: "A new compliance document has been uploaded to the system.", category: "Documents", timeAgo: "15m ago", unread: true, iconColor: "#a855f7", iconBg: "#1e0f2e" },
  { id: "3", title: "New rider registered", description: "Kwame Mensah has completed rider registration.", category: "Riders", timeAgo: "32m ago", unread: true, iconColor: "#00c853", iconBg: "#0f2e1a" },
  { id: "4", title: "Payout successful", description: "Batch payout of GHS 12,450 has been processed successfully.", category: "Payouts", timeAgo: "1h ago", unread: false, iconColor: "#ffc107", iconBg: "#2e2a0f" },
  { id: "5", title: "New promotion created", description: "\"Weekend Rush\" promo has been created and is now active.", category: "Promotions", timeAgo: "2h ago", unread: false, iconColor: "#ec4899", iconBg: "#2e0f1e" },
  { id: "6", title: "Suspicious activity detected", description: "Unusual login attempt detected from an unknown IP address.", category: "Security", timeAgo: "3h ago", unread: true, iconColor: "#ff5252", iconBg: "#2e0f0f" },
  { id: "7", title: "System maintenance scheduled", description: "Scheduled maintenance window: July 15, 2026, 02:00–04:00 UTC.", category: "System", timeAgo: "5h ago", unread: false, iconColor: "#448aff", iconBg: "#0f1e2e" },
  { id: "8", title: "New admin added", description: "Aminata Diallo has been added as an administrator.", category: "Users", timeAgo: "6h ago", unread: false, iconColor: "#22d3ee", iconBg: "#0f2e2e" },
  { id: "9", title: "Compliance updated", description: "Rider compliance checklist has been updated for Q3 2026.", category: "Compliance", timeAgo: "8h ago", unread: false, iconColor: "#f7931a", iconBg: "#2e1a0f" },
  { id: "10", title: "You're all set!", description: "Your account setup is complete. Welcome to OkadaGo Admin.", category: "Welcome", timeAgo: "1d ago", unread: false, iconColor: "#00c853", iconBg: "#0f2e1a" },
];

const TABS = ["All Notifications", "Unread", "Important"] as const;

const PREFERENCES = [
  { key: "system", label: "System Alerts", on: true },
  { key: "riders", label: "Rider Activities", on: true },
  { key: "financial", label: "Financial Alerts", on: true },
  { key: "promotions", label: "Promotions", on: true },
  { key: "security", label: "Security Alerts", on: true },
  { key: "reports", label: "Reports & Analytics", on: false },
  { key: "marketing", label: "Marketing Emails", on: false },
];

const CHANNELS = [
  { label: "Email", detail: "admin@okadago.com", badge: "Verified", icon: Mail },
  { label: "SMS", detail: "+233 30 123 4567", badge: "Verified", icon: Smartphone },
  { label: "In-App", detail: "Enabled", badge: "Active", icon: Bell },
  { label: "Push Notifications", detail: "Enabled", badge: "Active", icon: BellRing },
];

const toggleTrack = (on: boolean): React.CSSProperties => ({
  width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", position: "relative" as const,
  background: on ? DARK.green : DARK.surfaceAlt, transition: "background 0.2s", flexShrink: 0,
});

const toggleKnob = (on: boolean): React.CSSProperties => ({
  position: "absolute" as const, top: 3, left: on ? 21 : 3,
  width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
});

export function SettingsNotificationsScreen({ dataLoading = false }: SettingsNotificationsScreenProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<string>("All Notifications");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFERENCES.map((p) => [p.key, p.on]))
  );
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const togglePref = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const filteredNotifications = MOCK_NOTIFICATIONS.filter((n) => {
    if (activeTab === "Unread") return n.unread;
    if (activeTab === "Important") return ["Security", "System", "Compliance"].includes(n.category);
    return true;
  });

  const totalPages = Math.ceil(filteredNotifications.length / 5);

  if (dataLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", minHeight: "100vh" }}>
        <SkeletonCard lines={8} />
      </div>
    );
  }

  const renderSidebar = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Settings2 size={16} style={{ color: DARK.accent }} />
          <h3 style={{ color: DARK.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Notification Preferences</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {PREFERENCES.map((p) => (
            <div key={p.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${DARK.border}` }}>
              <span style={{ color: DARK.text, fontSize: 13 }}>{p.label}</span>
              <button style={toggleTrack(prefs[p.key])} onClick={() => togglePref(p.key)}>
                <span style={toggleKnob(prefs[p.key])} />
              </button>
            </div>
          ))}
        </div>
        <button
          style={{
            marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
            background: DARK.yellow, color: "#0a0b0d", fontWeight: 700, fontSize: 13,
          }}
          onClick={() => {}}
        >
          Save Preferences
        </button>
      </div>

      <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 14, padding: 18 }}>
        <h3 style={{ color: DARK.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Notification Channels</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${DARK.border}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: DARK.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} style={{ color: DARK.textMuted }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: DARK.text, fontSize: 12, fontWeight: 600 }}>{ch.label}</div>
                  <div style={{ color: DARK.textMuted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.detail}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: ch.badge === "Verified" ? DARK.greenBg : DARK.blueBg, color: ch.badge === "Verified" ? DARK.green : DARK.blue, flexShrink: 0 }}>{ch.badge}</span>
              </div>
            );
          })}
        </div>
        <button style={{ marginTop: 12, background: "none", border: "none", color: DARK.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
          Manage Channels
        </button>
      </div>
    </div>
  );

  const renderNotifItem = (n: NotificationItem) => {
    const cat = CATEGORIES[n.category] || CATEGORIES.System;
    return (
      <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: `1px solid ${DARK.border}`, position: "relative" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: n.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={18} style={{ color: n.iconColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ color: DARK.text, fontSize: 13, fontWeight: n.unread ? 700 : 600 }}>{n.title}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: cat.bg, color: cat.color }}>{cat.label}</span>
          </div>
          <p style={{ color: DARK.textMuted, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{n.description}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{ color: DARK.textMuted, fontSize: 11, whiteSpace: "nowrap" }}>{n.timeAgo}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {n.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: DARK.orange, flexShrink: 0 }} />}
            <button style={{ background: "none", border: "none", color: DARK.textMuted, cursor: "pointer", padding: 2 }}>
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: isMobile ? "16px" : "24px 28px", minHeight: "100vh" }}>
      <div>
        <h1 style={{ color: DARK.text, fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: 0 }}>Notifications</h1>
        <p style={{ color: DARK.textMuted, fontSize: 13, margin: "6px 0 0" }}>
          Stay updated with important alerts, activities and system notifications.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 340px", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 4, background: DARK.surface, borderRadius: 10, padding: 4, border: `1px solid ${DARK.border}` }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: activeTab === tab ? DARK.accent : "transparent",
                  color: activeTab === tab ? "#fff" : DARK.textMuted,
                  transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                  border: `1px solid ${DARK.border}`, background: DARK.surface, color: DARK.text, fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >
                All Types <ChevronDown size={14} />
              </button>
            </div>
            <button
              style={{
                background: "none", border: "none", color: DARK.accent, fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Mark all as read
            </button>
          </div>

          <div style={{ background: DARK.surface, border: `1px solid ${DARK.border}`, borderRadius: 14, padding: "4px 18px" }}>
            {filteredNotifications.slice(0, 5).map(renderNotifItem)}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <button
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${DARK.border}`, background: DARK.surface, color: DARK.textMuted,
                cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? 0.4 : 1,
              }}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: page === i + 1 ? DARK.accent : DARK.surface,
                  color: page === i + 1 ? "#fff" : DARK.textMuted,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${DARK.border}`, background: DARK.surface, color: DARK.textMuted,
                cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === totalPages ? 0.4 : 1,
              }}
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {!isMobile && !isTablet && renderSidebar()}
      </div>
    </div>
  );
}
