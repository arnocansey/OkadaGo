"use client";

import Link from "next/link";
import { Bike, ChevronDown, LogOut } from "lucide-react";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { formatMoney } from "@/lib/currency";

type PassengerRoleSession = {
  user: {
    fullName: string;
  };
};

type PassengerWalletSummary = {
  currency: string;
  availableBalance: string | number;
} | null;

type PassengerTab = "home" | "history" | "wallet" | "service" | "settings";

const passengerTabs: Array<{ key: PassengerTab; href: string; label: string }> = [
  { key: "home", href: "/passenger", label: "Home" },
  { key: "history", href: "/passenger/history", label: "History" },
  { key: "wallet", href: "/passenger/wallet", label: "Wallet" },
  { key: "service", href: "/passenger/service", label: "Service" },
  { key: "settings", href: "/passenger/settings", label: "Settings" }
];

export function PassengerAccessState({
  title,
  body,
  actionLabel,
  actionHref
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <ImmersivePage className="exact-passenger-page">
      <div className="flow-auth-wall">
        <div className="flow-auth-wall-card">
          <p className="workspace-tag">passenger access</p>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="button-row">
            <a href={actionHref} className="button">
              {actionLabel}
            </a>
          </div>
        </div>
      </div>
    </ImmersivePage>
  );
}

export function PassengerShell({
  session,
  preferredWallet,
  activeTab,
  signOut,
  children
}: {
  session: PassengerRoleSession;
  preferredWallet: PassengerWalletSummary;
  activeTab: PassengerTab;
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <ImmersivePage className="exact-passenger-page">
      <div className="exact-passenger-shell">
        <header className="exact-passenger-nav">
          <div className="exact-passenger-brand-row">
            <div className="exact-logo-box">
              <Bike size={20} />
            </div>
            <span className="exact-wordmark">OkadaGo</span>
            <nav className="exact-passenger-links">
              {passengerTabs.map((tab) => (
                <Link key={tab.key} href={tab.href} className={activeTab === tab.key ? "active" : ""}>
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="exact-passenger-actions">
            <button
              className="exact-ghost-link"
              type="button"
              onClick={() => {
                void signOut().then(() => {
                  window.location.href = "/login";
                });
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
            <Link href="/passenger/settings" className="exact-profile-button">
              <div>
                <strong>{session.user.fullName}</strong>
                <span>
                  {preferredWallet
                    ? `${formatMoney(preferredWallet.currency, preferredWallet.availableBalance)} available`
                    : "No wallet funded yet"}
                </span>
              </div>
              <div className="exact-avatar">
                {session.user.fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <ChevronDown size={16} />
            </Link>
          </div>
        </header>

        {children}
      </div>
    </ImmersivePage>
  );
}
