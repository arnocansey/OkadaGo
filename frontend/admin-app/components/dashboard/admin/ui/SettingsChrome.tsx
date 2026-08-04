"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export type SettingsTab = {
  id: string;
  label: string;
};

type SettingsChromeProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  tabs?: SettingsTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  actions?: ReactNode;
  children: ReactNode;
};

export function SettingsChrome({
  title,
  subtitle,
  breadcrumbs,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children
}: SettingsChromeProps) {
  return (
    <div className="exact-admin-screen settings-chrome">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="settings-chrome-crumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="settings-chrome-crumb">
              {index > 0 ? <span className="settings-chrome-crumb-sep">›</span> : null}
              {crumb.href ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="settings-chrome-header">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="settings-chrome-actions">{actions}</div> : null}
      </div>

      {tabs && tabs.length > 0 ? (
        <div className="settings-chrome-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`settings-chrome-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}

type SettingsCardProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SettingsCard({ title, subtitle, actions, children, className }: SettingsCardProps) {
  return (
    <article className={["settings-card", className].filter(Boolean).join(" ")}>
      {(title || actions) && (
        <div className="settings-card-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="settings-card-actions">{actions}</div> : null}
        </div>
      )}
      <div className="settings-card-body">{children}</div>
    </article>
  );
}

export function SettingsToggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`settings-toggle${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-thumb" />
    </button>
  );
}
