"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Moon,
  Save,
  Smartphone
} from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { SettingsCard, SettingsChrome, SettingsToggle } from "./ui/SettingsChrome";

export type NotificationSettingsScreenProps = {
  dataLoading?: boolean;
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
  settingsSaving?: boolean;
};

type PrefTab = "settings" | "inbox";

const CHANNELS = [
  { id: "inApp", label: "In-App", icon: Bell, desc: "Alerts inside the admin console" },
  { id: "email", label: "Email", icon: Mail, desc: "Messages to your work inbox" },
  { id: "sms", label: "SMS", icon: MessageSquare, desc: "Texts for urgent ops events" },
  { id: "push", label: "Push", icon: Smartphone, desc: "Browser / device push alerts" }
] as const;

const CATEGORIES = [
  { id: "rideRequests", label: "Ride Requests", desc: "New trip requests and assignments" },
  { id: "rideUpdates", label: "Ride Updates", desc: "Status changes and cancellations" },
  { id: "payments", label: "Payments & Wallet", desc: "Top-ups, payouts, failed charges" },
  { id: "security", label: "Account & Security", desc: "Sign-ins and security alerts" },
  { id: "promotions", label: "Promotions & Offers", desc: "Campaign and promo notices" },
  { id: "system", label: "System & Announcements", desc: "Platform maintenance and news" }
] as const;

type ChannelId = (typeof CHANNELS)[number]["id"];
type CategoryId = (typeof CATEGORIES)[number]["id"];

export function NotificationSettingsScreen({
  dataLoading = false,
  platformSettings,
  onSaveSettings,
  settingsSaving = false
}: NotificationSettingsScreenProps) {
  const { addToast } = useAdminToast();
  const [tab, setTab] = useState<PrefTab>("settings");
  const [channels, setChannels] = useState<Record<ChannelId, boolean>>({
    inApp: true,
    email: true,
    sms: true,
    push: true
  });
  const [matrix, setMatrix] = useState<Record<CategoryId, Record<ChannelId, boolean>>>(() => {
    const initial = {} as Record<CategoryId, Record<ChannelId, boolean>>;
    for (const category of CATEGORIES) {
      initial[category.id] = { inApp: true, email: true, sms: true, push: true };
    }
    return initial;
  });
  const [quietHours, setQuietHours] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || !platformSettings) return;
    const nextChannels = { ...channels };
    for (const channel of CHANNELS) {
      const value = platformSettings[`notify_${channel.id}`];
      if (typeof value === "boolean") nextChannels[channel.id] = value;
    }
    setChannels(nextChannels);
    if (typeof platformSettings.quietHoursEnabled === "boolean") {
      setQuietHours(platformSettings.quietHoursEnabled);
    }
    if (typeof platformSettings.quietHoursStart === "string") {
      setQuietStart(platformSettings.quietHoursStart);
    }
    if (typeof platformSettings.quietHoursEnd === "string") {
      setQuietEnd(platformSettings.quietHoursEnd);
    }
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformSettings]);

  const enabledChannels = useMemo(
    () => Object.values(channels).filter(Boolean).length,
    [channels]
  );
  const enabledCategories = useMemo(
    () =>
      CATEGORIES.filter((category) =>
        Object.values(matrix[category.id]).some(Boolean)
      ).length,
    [matrix]
  );

  function save() {
    const payload: Record<string, unknown> = {
      ...platformSettings,
      quietHoursEnabled: quietHours,
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd
    };
    for (const channel of CHANNELS) {
      payload[`notify_${channel.id}`] = channels[channel.id];
    }
    if (!onSaveSettings) {
      addToast("Settings persistence is unavailable", "error");
      return;
    }
    onSaveSettings(payload);
  }

  if (dataLoading) {
    return <AdminPageSkeleton variant="split" kpis={0} rows={6} cols={4} />;
  }

  return (
    <SettingsChrome
      title="Notifications"
      subtitle="Manage how and when you receive notifications."
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Settings", href: "/settings" },
        { label: "Notifications" }
      ]}
      tabs={[
        { id: "settings", label: "Notification Settings" },
        { id: "inbox", label: "In-App Notifications" }
      ]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as PrefTab)}
      actions={
        tab === "settings" ? (
          <button type="button" className="settings-btn settings-btn--primary" disabled={settingsSaving} onClick={save}>
            <Save size={14} /> Save Changes
          </button>
        ) : null
      }
    >
      {tab === "inbox" ? (
        <SettingsCard title="In-App Notifications">
          <p className="settings-row-meta" style={{ margin: 0 }}>
            Ops broadcasts and SOS alerts continue to live under Alerts. Preference toggles are managed on Notification Settings.
          </p>
          <a href="/notifications" className="settings-btn settings-btn--primary" style={{ marginTop: 16, display: "inline-flex" }}>
            Open Alerts inbox
          </a>
        </SettingsCard>
      ) : (
        <div className="settings-layout">
          <div className="settings-stack">
            <SettingsCard
              title="Notification Preferences"
              subtitle="Choose how you want to receive notifications and what you want to be notified about."
            >
              <div className="settings-row-label" style={{ marginBottom: 12 }}>Delivery Channels</div>
              <div className="settings-stack" style={{ gap: 10 }}>
                {CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <div key={channel.id} className="settings-row" style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: "color-mix(in srgb, var(--accent-yellow) 16%, transparent)",
                            display: "grid",
                            placeItems: "center"
                          }}
                        >
                          <Icon size={18} color="var(--accent-yellow)" />
                        </div>
                        <div>
                          <div className="settings-row-label">{channel.label} Notifications</div>
                          <div className="settings-row-meta">{channel.desc}</div>
                        </div>
                      </div>
                      <SettingsToggle
                        checked={channels[channel.id]}
                        onChange={(next) => setChannels((prev) => ({ ...prev, [channel.id]: next }))}
                        label={channel.label}
                      />
                    </div>
                  );
                })}
              </div>
            </SettingsCard>

            <SettingsCard
              title="Notification Categories"
              subtitle="Choose the types of notifications you want to receive."
            >
              <div className="admin-table-wrapper">
                <table className="settings-matrix">
                  <thead>
                    <tr>
                      <th>Category</th>
                      {CHANNELS.map((channel) => (
                        <th key={channel.id}>{channel.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <div className="settings-row-label">{category.label}</div>
                          <div className="settings-row-meta">{category.desc}</div>
                        </td>
                        {CHANNELS.map((channel) => (
                          <td key={channel.id}>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <SettingsToggle
                                checked={matrix[category.id][channel.id] && channels[channel.id]}
                                onChange={(next) =>
                                  setMatrix((prev) => ({
                                    ...prev,
                                    [category.id]: { ...prev[category.id], [channel.id]: next }
                                  }))
                                }
                                label={`${category.label} ${channel.label}`}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SettingsCard>
          </div>

          <div className="settings-stack">
            <SettingsCard title="Notification Summary">
              <div className="settings-row">
                <span className="settings-row-meta">Total Channels Enabled</span>
                <strong style={{ color: "var(--color-success)" }}>{enabledChannels}/4</strong>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">Categories Enabled</span>
                <strong style={{ color: "var(--color-success)" }}>{enabledCategories}/6</strong>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">Quiet Hours</span>
                <strong style={{ color: "var(--color-success)" }}>
                  {quietHours ? `${quietStart} – ${quietEnd}` : "Off"}
                </strong>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">Timezone</span>
                <strong>(GMT+00:00) Accra, Ghana</strong>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Quiet Hours"
              actions={<SettingsToggle checked={quietHours} onChange={setQuietHours} label="Quiet Hours" />}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <Moon size={16} color="var(--accent-yellow)" />
                <span className="settings-row-meta">
                  Set the time when you don&apos;t want to receive non-urgent notifications.
                </span>
              </div>
              <div className="settings-grid-2">
                <label className="settings-field">
                  Start Time
                  <input
                    className="settings-input"
                    type="time"
                    value={quietStart}
                    disabled={!quietHours}
                    onChange={(e) => setQuietStart(e.target.value)}
                  />
                </label>
                <label className="settings-field">
                  End Time
                  <input
                    className="settings-input"
                    type="time"
                    value={quietEnd}
                    disabled={!quietHours}
                    onChange={(e) => setQuietEnd(e.target.value)}
                  />
                </label>
              </div>
              <p className="settings-row-meta" style={{ marginTop: 12 }}>
                Notifications about security and critical alerts will still be sent.
              </p>
            </SettingsCard>

            <SettingsCard title="Recent Notification Activity">
              {[
                ["Email notifications enabled", "May 31, 2024 10:45 AM"],
                ["Quiet hours updated", "May 30, 2024 6:12 PM"],
                ["Push notifications enabled", "May 28, 2024 9:04 AM"]
              ].map(([label, at]) => (
                <div key={label} className="settings-row">
                  <div>
                    <div className="settings-row-label">{label}</div>
                    <div className="settings-row-meta">{at}</div>
                  </div>
                </div>
              ))}
            </SettingsCard>
          </div>
        </div>
      )}
    </SettingsChrome>
  );
}
