"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CreditCard,
  Plus,
  Shield,
  Smartphone,
  Star,
  Trash2,
  Wallet,
  X
} from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { WalletTransactionRecord } from "./types";
import { SettingsCard, SettingsChrome } from "./ui/SettingsChrome";

export type PaymentMethodsScreenProps = {
  dataLoading?: boolean;
  adminCurrency?: string;
  walletTransactions?: WalletTransactionRecord[];
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
  settingsSaving?: boolean;
  token?: string | null;
};

type PayTab = "methods" | "payouts" | "history";
type MethodKind = "card" | "momo" | "paypal";
type PayoutKind = "bank" | "momo";

type ApiMethod = {
  id: string;
  channel: string;
  status: string;
  brand: string;
  label: string;
  detail: string;
  expiry: string | null;
  isDefault: boolean;
  reusable: boolean;
  chargeable: boolean;
};

type PayoutAccount = {
  id: string;
  kind: PayoutKind;
  label: string;
  detail: string;
  isDefault: boolean;
  status: "Verified" | "Active";
};

const SETTINGS_KEY_PAYOUTS = "payoutAccounts";
const PAYSTACK_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);

function isPayoutAccount(value: unknown): value is PayoutAccount {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.label === "string" &&
    typeof row.detail === "string" &&
    typeof row.kind === "string" &&
    typeof row.isDefault === "boolean"
  );
}

function parsePayouts(settings?: Record<string, unknown>): PayoutAccount[] {
  const raw = settings?.[SETTINGS_KEY_PAYOUTS];
  if (!Array.isArray(raw)) return [];
  return raw.filter(isPayoutAccount).map((row) => ({
    ...row,
    kind: row.kind === "momo" ? "momo" : "bank",
    status: row.status === "Active" ? "Active" : "Verified"
  }));
}

function MethodIcon({ kind }: { kind: string }) {
  if (kind === "momo" || kind === "mobile_money") return <Smartphone size={18} color="var(--accent-yellow)" />;
  if (kind === "paypal") return <Wallet size={18} color="var(--accent-yellow)" />;
  if (kind === "bank") return <Building2 size={18} color="var(--accent-yellow)" />;
  return <CreditCard size={18} color="var(--accent-yellow)" />;
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function PaymentMethodsScreen({
  dataLoading = false,
  adminCurrency = "GHS",
  walletTransactions = [],
  platformSettings,
  onSaveSettings,
  settingsSaving = false,
  token
}: PaymentMethodsScreenProps) {
  const { addToast } = useAdminToast();
  const [tab, setTab] = useState<PayTab>("methods");
  const [methods, setMethods] = useState<ApiMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutAccount[]>([]);
  const [addKind, setAddKind] = useState<MethodKind | null>(null);
  const [addingPayout, setAddingPayout] = useState(false);
  const [busy, setBusy] = useState(false);
  const hydratedPayouts = useRef(false);

  const [momoNetwork, setMomoNetwork] = useState("MTN MoMo");
  const [momoPhone, setMomoPhone] = useState("");
  const [momoLabel, setMomoLabel] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [payoutKind, setPayoutKind] = useState<PayoutKind>("bank");
  const [payoutLabel, setPayoutLabel] = useState("");
  const [payoutDetail, setPayoutDetail] = useState("");

  async function loadMethods() {
    if (!token) {
      setMethodsLoading(false);
      return;
    }
    setMethodsLoading(true);
    try {
      const res = await requestJson<{ methods: ApiMethod[] }>("/payments/methods", { token });
      setMethods(res.methods ?? []);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not load payment methods", "error");
    } finally {
      setMethodsLoading(false);
    }
  }

  useEffect(() => {
    void loadMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const vault = params.get("vault");
    if (vault === "success") {
      addToast("Card linked via Paystack", "success");
      void loadMethods();
      window.history.replaceState({}, "", "/payment-methods");
    } else if (vault === "failed") {
      addToast(params.get("reason") || "Card linking failed", "error");
      window.history.replaceState({}, "", "/payment-methods");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydratedPayouts.current || !platformSettings) return;
    setPayouts(parsePayouts(platformSettings));
    hydratedPayouts.current = true;
  }, [platformSettings]);

  const txnRows = useMemo(() => {
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

  function persistPayouts(nextPayouts: PayoutAccount[]) {
    if (!onSaveSettings) {
      addToast("Settings persistence is unavailable", "error");
      return false;
    }
    onSaveSettings({ ...platformSettings, [SETTINGS_KEY_PAYOUTS]: nextPayouts });
    return true;
  }

  async function startCardLink() {
    if (!token) return;
    setBusy(true);
    try {
      const res = await requestJson<{ authorizationUrl: string }>("/payments/methods/paystack/initialize", {
        method: "POST",
        token,
        body: JSON.stringify({ currency: adminCurrency === "NGN" ? "NGN" : "GHS", amount: 1 })
      });
      if (!res.authorizationUrl) {
        throw new Error("Paystack did not return a checkout URL");
      }
      window.location.assign(res.authorizationUrl);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not start card linking", "error");
      setBusy(false);
    }
  }

  async function submitManualMethod() {
    if (!token || !addKind || addKind === "card") return;
    setBusy(true);
    try {
      if (addKind === "momo") {
        if (momoPhone.replace(/\D/g, "").length < 9) {
          addToast("Enter a valid MoMo phone number", "error");
          return;
        }
        await requestJson("/payments/methods", {
          method: "POST",
          token,
          body: JSON.stringify({
            channel: "mobile_money",
            label: momoLabel.trim() || momoNetwork,
            momoPhone: momoPhone.trim(),
            momoProvider: momoNetwork
          })
        });
      } else {
        const email = paypalEmail.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          addToast("Enter a valid PayPal email", "error");
          return;
        }
        await requestJson("/payments/methods", {
          method: "POST",
          token,
          body: JSON.stringify({ channel: "paypal", label: "PayPal", paypalEmail: email })
        });
      }
      setAddKind(null);
      addToast("Payment method saved", "success");
      await loadMethods();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not save method", "error");
    } finally {
      setBusy(false);
    }
  }

  async function setDefault(id: string) {
    if (!token) return;
    try {
      await requestJson(`/payments/methods/${id}/default`, { method: "POST", token, body: "{}" });
      addToast("Default payment method updated", "success");
      await loadMethods();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not update default", "error");
    }
  }

  async function removeMethod(id: string) {
    if (!token) return;
    try {
      await requestJson(`/payments/methods/${id}`, { method: "DELETE", token });
      addToast("Payment method removed", "success");
      await loadMethods();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not remove method", "error");
    }
  }

  function submitPayout() {
    if (!payoutLabel.trim() || !payoutDetail.trim()) {
      addToast("Enter a label and account details", "error");
      return;
    }
    const next: PayoutAccount = {
      id: newId("payout"),
      kind: payoutKind,
      label: payoutLabel.trim(),
      detail: payoutDetail.trim(),
      isDefault: payouts.length === 0,
      status: payoutKind === "bank" ? "Verified" : "Active"
    };
    const nextPayouts = [...payouts, next];
    if (!persistPayouts(nextPayouts)) return;
    setPayouts(nextPayouts);
    setAddingPayout(false);
    setPayoutLabel("");
    setPayoutDetail("");
  }

  function removePayout(id: string) {
    let nextPayouts = payouts.filter((p) => p.id !== id);
    if (nextPayouts.length && !nextPayouts.some((p) => p.isDefault)) {
      nextPayouts = [{ ...nextPayouts[0], isDefault: true }, ...nextPayouts.slice(1)];
    }
    if (!persistPayouts(nextPayouts)) return;
    setPayouts(nextPayouts);
  }

  if (dataLoading || methodsLoading) {
    return <AdminPageSkeleton variant="split" kpis={0} rows={6} cols={3} />;
  }

  return (
    <SettingsChrome
      title="Payment Methods"
      subtitle="Link chargeable Paystack cards and settlement destinations for OkadaGo ops."
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
          <button type="button" className="settings-btn settings-btn--primary" disabled={busy} onClick={() => setAddKind("card")}>
            <Plus size={14} /> Add Method
          </button>
        ) : tab === "payouts" ? (
          <button type="button" className="settings-btn settings-btn--primary" onClick={() => setAddingPayout(true)}>
            <Plus size={14} /> Add payout account
          </button>
        ) : null
      }
    >
      {tab === "methods" ? (
        <div className="settings-layout">
          <div className="settings-stack">
            <SettingsCard
              title="Saved Payment Methods"
              subtitle="Cards linked through Paystack store a reusable authorization. MoMo/PayPal are ops destinations."
            >
              {methods.length === 0 ? (
                <p className="settings-row-meta" style={{ margin: 0 }}>
                  No payment methods yet. Link a card via Paystack or add MoMo / PayPal.
                </p>
              ) : (
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
                          <MethodIcon kind={method.channel} />
                        </div>
                        <div>
                          <div className="settings-row-label" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            {method.label}
                            {method.isDefault ? <span className="settings-badge settings-badge--success">Default</span> : null}
                            {method.chargeable ? (
                              <span className="settings-badge settings-badge--success">Chargeable</span>
                            ) : method.status === "pending" ? (
                              <span className="settings-badge settings-badge--warn">Pending</span>
                            ) : null}
                          </div>
                          <div className="settings-row-meta">
                            {method.detail}
                            {method.expiry ? ` · Exp ${method.expiry}` : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {!method.isDefault && method.status === "active" ? (
                          <button type="button" className="settings-btn settings-btn--ghost" onClick={() => void setDefault(method.id)} title="Set as default">
                            <Star size={14} />
                          </button>
                        ) : null}
                        <button type="button" className="settings-btn settings-btn--ghost" onClick={() => void removeMethod(method.id)} title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SettingsCard>

            <SettingsCard title="Recent Transactions">
              {txnRows.length === 0 ? (
                <p className="settings-row-meta" style={{ margin: 0 }}>No wallet transactions yet.</p>
              ) : (
                <>
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
                </>
              )}
            </SettingsCard>
          </div>

          <div className="settings-stack">
            <SettingsCard title="Add a payment method">
              <p className="settings-row-meta" style={{ marginTop: 0 }}>
                Cards open Paystack checkout (GHS 1 authorization). MoMo and PayPal save contact details for ops.
              </p>
              {(
                [
                  ["card", "Credit / Debit Card", "Visa/Mastercard via Paystack vault"],
                  ["momo", "Mobile Money", "MTN, Telecel, AirtelTigo destination"],
                  ["paypal", "PayPal", "Business PayPal email"]
                ] as const
              ).map(([kind, label, desc]) => (
                <button
                  key={kind}
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
                  onClick={() => setAddKind(kind)}
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
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <Shield size={14} color="var(--color-success)" />
                <span className="settings-row-meta">Reusable card authorizations are stored server-side and can be charged later.</span>
              </div>
            </SettingsCard>
          </div>
        </div>
      ) : null}

      {tab === "payouts" ? (
        <div className="settings-layout">
          <SettingsCard title="Payout Accounts">
            {payouts.length === 0 ? (
              <p className="settings-row-meta" style={{ margin: 0 }}>No payout accounts yet.</p>
            ) : (
              <div className="settings-stack" style={{ gap: 12 }}>
                {payouts.map((account) => (
                  <div key={account.id} className="settings-row" style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <MethodIcon kind={account.kind} />
                      <div>
                        <div className="settings-row-label">{account.label}</div>
                        <div className="settings-row-meta">{account.detail}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="settings-badge settings-badge--success">{account.status}</span>
                      <button type="button" className="settings-btn settings-btn--ghost" onClick={() => removePayout(account.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="settings-btn settings-btn--primary" style={{ marginTop: 16 }} onClick={() => setAddingPayout(true)}>
              <Plus size={14} /> Add payout account
            </button>
          </SettingsCard>
          <SettingsCard title="Disbursement notes">
            <p className="settings-row-meta" style={{ margin: 0 }}>
              Rider payouts run through Finance. These accounts are settlement records for ops.
            </p>
            <a href="/finance" className="settings-btn settings-btn--link" style={{ marginTop: 12, display: "inline-flex" }}>
              Open Finance
            </a>
          </SettingsCard>
        </div>
      ) : null}

      {tab === "history" ? (
        <SettingsCard title="Transaction History">
          {txnRows.length === 0 ? (
            <p className="settings-row-meta" style={{ margin: 0 }}>No wallet transactions available yet.</p>
          ) : (
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
          )}
        </SettingsCard>
      ) : null}

      {addKind ? (
        <div className="settings-dialog-overlay" role="dialog" aria-modal="true" aria-label="Add payment method">
          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h3>
                  {addKind === "card" ? "Link card with Paystack" : addKind === "momo" ? "Add Mobile Money" : "Add PayPal"}
                </h3>
                <p>
                  {addKind === "card"
                    ? "You will complete a GHS 1 authorization on Paystack. The reusable token is stored securely."
                    : "Saved as an ops destination (not a silent charge token)."}
                </p>
              </div>
              <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setAddKind(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="settings-card-body settings-stack" style={{ gap: 14 }}>
              {addKind === "card" ? (
                <button type="button" className="settings-btn settings-btn--primary" disabled={busy} onClick={() => void startCardLink()}>
                  {busy ? "Redirecting…" : "Continue to Paystack"}
                </button>
              ) : null}
              {addKind === "momo" ? (
                <>
                  <label className="settings-field">
                    Network
                    <select className="settings-select" value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)}>
                      <option>MTN MoMo</option>
                      <option>Telecel Cash</option>
                      <option>AirtelTigo Money</option>
                    </select>
                  </label>
                  <label className="settings-field">
                    Label
                    <input className="settings-input" value={momoLabel} onChange={(e) => setMomoLabel(e.target.value)} />
                  </label>
                  <label className="settings-field">
                    Phone number
                    <input className="settings-input" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} placeholder="+233 24 000 0000" />
                  </label>
                </>
              ) : null}
              {addKind === "paypal" ? (
                <label className="settings-field">
                  PayPal email
                  <input className="settings-input" type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
                </label>
              ) : null}
              {addKind !== "card" ? (
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setAddKind(null)}>Cancel</button>
                  <button type="button" className="settings-btn settings-btn--primary" disabled={busy} onClick={() => void submitManualMethod()}>
                    {busy ? "Saving…" : "Save method"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {addingPayout ? (
        <div className="settings-dialog-overlay" role="dialog" aria-modal="true" aria-label="Add payout account">
          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h3>Add payout account</h3>
                <p>Settlement destination for ops records.</p>
              </div>
              <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setAddingPayout(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="settings-card-body settings-stack" style={{ gap: 14 }}>
              <label className="settings-field">
                Type
                <select className="settings-select" value={payoutKind} onChange={(e) => setPayoutKind(e.target.value as PayoutKind)}>
                  <option value="bank">Bank account</option>
                  <option value="momo">Mobile Money</option>
                </select>
              </label>
              <label className="settings-field">
                Label
                <input className="settings-input" value={payoutLabel} onChange={(e) => setPayoutLabel(e.target.value)} />
              </label>
              <label className="settings-field">
                Details
                <input className="settings-input" value={payoutDetail} onChange={(e) => setPayoutDetail(e.target.value)} />
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setAddingPayout(false)}>Cancel</button>
                <button type="button" className="settings-btn settings-btn--primary" disabled={settingsSaving} onClick={submitPayout}>
                  Save account
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SettingsChrome>
  );
}
