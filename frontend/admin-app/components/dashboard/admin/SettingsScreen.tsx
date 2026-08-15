"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  Plug,
  RotateCcw,
  Save,
  Shield
} from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { SettingsCard, SettingsChrome } from "./ui/SettingsChrome";

export type SettingsScreenProps = {
  adminCurrency: string;
  dataLoading?: boolean;
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
  settingsSaving?: boolean;
};

const QUICK_LINKS = [
  { href: "/settings/company", label: "Company Profile", desc: "Legal name, address, branding", icon: Building2 },
  { href: "/settings/security", label: "Account & Security", desc: "Password, 2FA, sessions", icon: Shield },
  { href: "/settings/notifications", label: "Notifications", desc: "Channels, categories, quiet hours", icon: Bell },
  { href: "/payment-methods", label: "Payment Methods", desc: "Saved cards, MoMo, payouts", icon: CreditCard },
  { href: "/taxes-compliance", label: "Taxes & Compliance", desc: "GRA and invoice defaults", icon: FileText },
  { href: "/integrations", label: "Integrations", desc: "Third-party connections", icon: Plug }
] as const;

export function SettingsScreen({
  adminCurrency,
  dataLoading = false,
  platformSettings,
  onSaveSettings,
  settingsSaving = false
}: SettingsScreenProps) {
  const { addToast } = useAdminToast();
  const { isMobile } = useBreakpoint();
  const [formValues, setFormValues] = useState({
    platformName: "OkadaGo",
    currency: adminCurrency,
    timezone: "Africa/Accra",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    distanceUnit: "km",
    language: "en"
  });
  const [toggles, setToggles] = useState({
    maintenanceMode: false,
    debugMode: false
  });
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || !platformSettings || Object.keys(platformSettings).length === 0) return;
    hydratedRef.current = true;
    setFormValues((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(prev) as Array<keyof typeof prev>) {
        const value = platformSettings[key];
        if (typeof value === "string") next[key] = value;
        if (typeof value === "number") next[key] = String(value);
      }
      return next;
    });
    setToggles((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(prev) as Array<keyof typeof prev>) {
        const value = platformSettings[key];
        if (typeof value === "boolean") next[key] = value;
      }
      return next;
    });
  }, [platformSettings]);

  function updateField(key: keyof typeof formValues, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!onSaveSettings) {
      addToast("Settings persistence is unavailable", "error");
      return;
    }
    onSaveSettings({ ...platformSettings, ...formValues, ...toggles });
  }

  function handleReset() {
    if (platformSettings && Object.keys(platformSettings).length > 0) {
      hydratedRef.current = false;
      setFormValues({
        platformName: typeof platformSettings.platformName === "string" ? platformSettings.platformName : "OkadaGo",
        currency: typeof platformSettings.currency === "string" ? platformSettings.currency : adminCurrency,
        timezone: typeof platformSettings.timezone === "string" ? platformSettings.timezone : "Africa/Accra",
        dateFormat: typeof platformSettings.dateFormat === "string" ? platformSettings.dateFormat : "DD/MM/YYYY",
        timeFormat: typeof platformSettings.timeFormat === "string" ? platformSettings.timeFormat : "12h",
        distanceUnit: typeof platformSettings.distanceUnit === "string" ? platformSettings.distanceUnit : "km",
        language: typeof platformSettings.language === "string" ? platformSettings.language : "en"
      });
      setToggles({
        maintenanceMode: platformSettings.maintenanceMode === true,
        debugMode: platformSettings.debugMode === true
      });
      hydratedRef.current = true;
      addToast("Reverted to last saved values", "info");
      return;
    }
    addToast("No saved settings to revert to yet", "info");
  }

  if (dataLoading) {
    return <AdminPageSkeleton variant="form" kpis={0} rows={8} />;
  }

  return (
    <SettingsChrome
      title="General Settings"
      subtitle="OkadaGo Accra ops defaults — timezone Africa/Accra, GHS currency."
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Settings" }
      ]}
      actions={
        <>
          <button type="button" className="settings-btn settings-btn--ghost" onClick={handleReset} style={{ fontSize: "0.78rem" }}>
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            disabled={settingsSaving}
            onClick={handleSave}
            style={{ fontSize: "0.78rem" }}
          >
            <Save size={13} /> Save Changes
          </button>
        </>
      }
    >
      <div className="settings-layout">
        <div className="settings-stack">
          <SettingsCard title="Platform defaults">
            <div className="settings-grid-2" style={isMobile ? { gridTemplateColumns: "1fr" } : undefined}>
              <label className="settings-field">
                Platform Name
                <input
                  className="settings-input"
                  value={formValues.platformName}
                  onChange={(e) => updateField("platformName", e.target.value)}
                />
              </label>
              <label className="settings-field">
                Currency
                <input
                  className="settings-input"
                  value={formValues.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                />
              </label>
              <label className="settings-field">
                Timezone
                <input
                  className="settings-input"
                  value={formValues.timezone}
                  onChange={(e) => updateField("timezone", e.target.value)}
                />
              </label>
              <label className="settings-field">
                Date Format
                <select
                  className="settings-select"
                  value={formValues.dateFormat}
                  onChange={(e) => updateField("dateFormat", e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </label>
              <label className="settings-field">
                Time Format
                <select
                  className="settings-select"
                  value={formValues.timeFormat}
                  onChange={(e) => updateField("timeFormat", e.target.value)}
                >
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
              </label>
              <label className="settings-field">
                Distance Unit
                <select
                  className="settings-select"
                  value={formValues.distanceUnit}
                  onChange={(e) => updateField("distanceUnit", e.target.value)}
                >
                  <option value="km">Kilometers</option>
                  <option value="mi">Miles</option>
                </select>
              </label>
              <label className="settings-field">
                Language
                <select
                  className="settings-select"
                  value={formValues.language}
                  onChange={(e) => updateField("language", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="tw">Twi</option>
                </select>
              </label>
            </div>
          </SettingsCard>

          <SettingsCard title="System toggles">
            {(
              [
                { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Temporarily disable public access" },
                { key: "debugMode" as const, label: "Debug Mode", desc: "Enable verbose logging" }
              ] as const
            ).map(({ key, label, desc }) => (
              <div key={key} className="settings-row">
                <div>
                  <div className="settings-row-label">{label}</div>
                  <div className="settings-row-meta">{desc}</div>
                </div>
                <button
                  type="button"
                  aria-label={label}
                  className={`settings-toggle ${toggles[key] ? "on" : ""}`}
                  onClick={() => setToggles((prev) => ({ ...prev, [key]: !prev[key] }))}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>
            ))}
          </SettingsCard>
        </div>

        <div className="settings-stack">
          <SettingsCard title="More settings" subtitle="Open dedicated screens for account, company, and billing prefs.">
            <div className="settings-stack" style={{ gap: 8 }}>
              {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="settings-row"
                  style={{
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 0.15s, background 0.15s"
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "color-mix(in srgb, var(--accent-yellow) 14%, transparent)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0
                      }}
                    >
                      <Icon size={15} color="var(--accent-yellow)" />
                    </div>
                    <div>
                      <div className="settings-row-label" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{label}</div>
                      <div className="settings-row-meta" style={{ fontSize: "0.72rem" }}>{desc}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SettingsCard>
        </div>
      </div>
    </SettingsChrome>
  );
}
