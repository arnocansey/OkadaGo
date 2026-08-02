"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  Plus,
  Shield,
  Smartphone,
  Star,
  Trash2,
  Wallet
} from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { WalletTransactionRecord } from "./types";
import { SettingsCard, SettingsChrome } from "./ui/SettingsChrome";

export type PaymentMethodsScreenProps = {
  dataLoading?: boolean;
  adminCurrency?: string;
  walletTransactions?: WalletTransactionRecord[];
};

type PayTab = "methods" | "payouts" | "history";

type SavedMethod = {
  id: string;
  brand: string;
  label: string;
  detail: string;
  expiry?: string;
  kind: "card" | "momo" | "paypal";
  isDefault: boolean;
};

const DEMO_METHODS: SavedMethod[] = [
  {
    id: "visa",
    brand: "Visa",
    label: "Visa ending in 4242",
    detail: "Personal · Primary billing",
    expiry: "09/27",
    kind: "card",
    isDefault: true
  },
  {
    id: "mc",
    brand: "Mastercard",
    label: "Mastercard ending in 8888",
    detail: "Corporate expenses",
    expiry: "03/26",
    kind: "card",
    isDefault: false
  },
  {
    id: "momo",
    brand: "MTN MoMo",
    label: "MTN Mobile Money",
    detail: "+233 24 ••• ••89",
    kind: "momo",
    isDefault: false
  },
  {
    id: "paypal",
    brand: "PayPal",
    label: "PayPal",
    detail: "billing@okadago.com",
    kind: "paypal",
    isDefault: false
  }
];

const DEMO_TXNS = [
  { id: "tx1", date: "May 31, 2024", desc: "Wallet top-up · Paystack", method: "Visa •••• 4242", amount: "+GHS 500.00", status: "Completed" },
  { id: "tx2", date: "May 30, 2024", desc: "Rider payout batch", method: "MTN MoMo", amount: "-GHS 12,450.00", status: "Completed" },
  { id: "tx3", date: "May 29, 2024", desc: "Platform fee settlement", method: "Mastercard •••• 8888", amount: "-GHS 890.00", status: "Completed" },
  { id: "tx4", date: "May 28, 2024", desc: "Failed charge retry", method: "Visa •••• 4242", amount: "GHS 0.00", status: "Failed" }
];

const PAYSTACK_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);

function MethodIcon({ kind }: { kind: SavedMethod["kind"] }) {
  if (kind === "momo") return <Smartphone size={18} color="var(--accent-yellow)" />;
  if (kind === "paypal") return <Wallet size={18} color="var(--accent-yellow)" />;
  return <CreditCard size={18} color="var(--accent-yellow)" />;
}

export function PaymentMethodsScreen({
  dataLoading = false,
  adminCurrency = "GHS",
  walletTransactions = []
}: PaymentMethodsScreenProps) {
  const { addToast } = useAdminToast();
  const [tab, setTab] = useState<PayTab>("methods");
  const [methods, setMethods] = useState(DEMO_METHODS);

  const txnRows = useMemo(() => {
    if (walletTransactions.length === 0) return DEMO_TXNS;
    return walletTransactions.slice(0, 12).map((tx) => {
      const amount = Number(tx.amount);
      const signed = Number.isFinite(amount)
        ? `${amount >= 0 ? "+" : "-"}${adminCurrency} ${Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : `${adminCurrency} ${tx.amount}`;
      return {
        id: tx.id,
        date: tx.createdAt?.replace("T", " ").slice(0, 16) ?? "—",
        desc: tx.description || tx.type || "Wallet transaction",
        method: tx.reference || "Wallet",
        amount: signed,
        status: tx.status || "Posted"
      };
    });
  }, [walletTransactions, adminCurrency]);

  function setDefault(id: string) {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    addToast("Default payment method updated", "success");
  }

  function removeMethod(id: string) {
    setMethods((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length && !next.some((m) => m.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
    addToast("Payment method removed (local demo)", "info");
  }

  if (dataLoading) {
    return <AdminPageSkeleton variant="split" kpis={0} rows={6} cols={3} />;
  }

  return (
    <SettingsChrome
      title="Payment Methods"
      subtitle="Manage saved payment methods, payout accounts, and recent wallet activity."
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Settings", href: "/settings" },
        { label: "Payment Methods" }
      ]}
      tabs={[
        { id: "methods", label: "Payment Methods" },
        { id: "payouts", label: "Payout Accounts" },
        { id: "history", label: "Transaction History" }
      ]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as PayTab)}
      actions={
        tab === "methods" ? (
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            onClick={() => addToast("Add payment method is not connected yet", "info")}
          >
            <Plus size={14} /> Add Method
          </button>
        ) : null
      }
    >
      {tab === "methods" ? (
        <div className="settings-layout">
          <div className="settings-stack">
            <SettingsCard
              title="Saved Payment Methods"
              subtitle="Demo cards and MoMo wallets for admin billing until a cards API ships."
            >
              <div className="settings-stack" style={{ gap: 12 }}>
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className="settings-row"
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: 12,
                      padding: 14,
                      background: method.isDefault
                        ? "color-mix(in srgb, var(--accent-yellow) 8%, transparent)"
                        : undefined
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "color-mix(in srgb, var(--accent-yellow) 16%, transparent)",
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        <MethodIcon kind={method.kind} />
                      </div>
                      <div>
                        <div className="settings-row-label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {method.label}
                          {method.isDefault ? (
                            <span className="settings-badge settings-badge--success">Default</span>
                          ) : null}
                        </div>
                        <div className="settings-row-meta">
                          {method.detail}
                          {method.expiry ? ` · Exp ${method.expiry}` : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {!method.isDefault ? (
                        <button
                          type="button"
                          className="settings-btn settings-btn--ghost"
                          onClick={() => setDefault(method.id)}
                          title="Set as default"
                        >
                          <Star size={14} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="settings-btn settings-btn--ghost"
                        onClick={() => removeMethod(method.id)}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>

            <SettingsCard title="Recent Transactions">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txnRows.slice(0, 5).map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.desc}</td>
                        <td>{row.method}</td>
                        <td><strong>{row.amount}</strong></td>
                        <td>
                          <em className={`admin-reference-tag ${row.status.toLowerCase().includes("fail") ? "warning" : "success"}`}>
                            {row.status}
                          </em>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="settings-btn settings-btn--link" onClick={() => setTab("history")}>
                View full history
              </button>
            </SettingsCard>
          </div>

          <div className="settings-stack">
            <SettingsCard title="Add a payment method">
              <p className="settings-row-meta" style={{ marginTop: 0 }}>
                Cards, Mobile Money, and PayPal can be linked for platform billing once the payments vault is connected.
              </p>
              {[
                ["Credit / Debit Card", "Visa, Mastercard via Paystack"],
                ["Mobile Money", "MTN, Telecel, AirtelTigo"],
                ["PayPal", "Business PayPal account"]
              ].map(([label, desc]) => (
                <button
                  key={label}
                  type="button"
                  className="settings-row"
                  style={{
                    width: "100%",
                    border: "1px solid var(--border-color)",
                    borderRadius: 12,
                    padding: 12,
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                  onClick={() => addToast(`${label} linking is not connected yet`, "info")}
                >
                  <div>
                    <div className="settings-row-label">{label}</div>
                    <div className="settings-row-meta">{desc}</div>
                  </div>
                  <Plus size={16} color="var(--text-muted)" />
                </button>
              ))}
            </SettingsCard>

            <SettingsCard title="Platform rails status">
              <div className="settings-row">
                <span className="settings-row-meta">Paystack</span>
                <span className={`settings-badge ${PAYSTACK_CONFIGURED ? "settings-badge--success" : "settings-badge--danger"}`}>
                  {PAYSTACK_CONFIGURED ? "Configured" : "Needs keys"}
                </span>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">MoMo rails</span>
                <span className="settings-badge settings-badge--success">MTN / Telecel / AirtelTigo</span>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">Cash</span>
                <span className="settings-badge settings-badge--success">Zone policy</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <Shield size={14} color="var(--color-success)" />
                <span className="settings-row-meta">Env status is live; saved methods above are demo until vault APIs ship.</span>
              </div>
            </SettingsCard>
          </div>
        </div>
      ) : null}

      {tab === "payouts" ? (
        <div className="settings-layout">
          <SettingsCard title="Payout Accounts">
            <div className="settings-row" style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Building2 size={18} color="var(--accent-yellow)" />
                <div>
                  <div className="settings-row-label">GCB Bank · Ops settlement</div>
                  <div className="settings-row-meta">•••• 4521 · Accra Main · Default payout</div>
                </div>
              </div>
              <span className="settings-badge settings-badge--success">Verified</span>
            </div>
            <div className="settings-row" style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 14, marginTop: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Smartphone size={18} color="var(--accent-yellow)" />
                <div>
                  <div className="settings-row-label">MTN MoMo Business</div>
                  <div className="settings-row-meta">+233 30 ••• ••10 · Rider disbursements</div>
                </div>
              </div>
              <span className="settings-badge settings-badge--success">Active</span>
            </div>
            <button
              type="button"
              className="settings-btn settings-btn--primary"
              style={{ marginTop: 16 }}
              onClick={() => addToast("Payout account linking is not connected yet", "info")}
            >
              <Plus size={14} /> Add payout account
            </button>
          </SettingsCard>
          <SettingsCard title="Disbursement notes">
            <p className="settings-row-meta" style={{ margin: 0 }}>
              Rider payouts continue to run through Finance → Payouts. Accounts listed here are for admin billing and settlement configuration.
            </p>
            <a href="/payments" className="settings-btn settings-btn--link" style={{ marginTop: 12, display: "inline-flex" }}>
              Open Finance
            </a>
          </SettingsCard>
        </div>
      ) : null}

      {tab === "history" ? (
        <SettingsCard title="Transaction History">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {txnRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.desc}</td>
                    <td>{row.method}</td>
                    <td><strong>{row.amount}</strong></td>
                    <td>
                      <em className={`admin-reference-tag ${row.status.toLowerCase().includes("fail") ? "warning" : "success"}`}>
                        {row.status}
                      </em>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {walletTransactions.length === 0 ? (
            <p className="settings-row-meta" style={{ marginTop: 12 }}>
              Showing demo rows. Live wallet transactions appear here when Finance wallet data is available.
            </p>
          ) : null}
        </SettingsCard>
      ) : null}
    </SettingsChrome>
  );
}
