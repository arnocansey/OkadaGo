"use client";

import { CreditCard, Smartphone, Shield } from "lucide-react";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";

const PLATFORM_METHODS = [
  {
    id: "paystack",
    name: "Paystack",
    type: "Cards & MoMo gateway",
    details: "Used for passenger and rider wallet top-ups",
    status: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? "Configured" : "Needs keys",
    configured: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY)
  },
  {
    id: "momo",
    name: "Mobile Money rails",
    type: "MTN / Vodafone / AirtelTigo via Paystack",
    details: "Settlement and passenger cashless wallets",
    status: "Platform default",
    configured: true
  },
  {
    id: "cash",
    name: "Cash",
    type: "In-trip cash",
    details: "Still available where zone policy allows",
    status: "Enabled",
    configured: true
  }
];

export function PaymentMethodsScreen() {
  const configuredCount = PLATFORM_METHODS.filter((m) => m.configured).length;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Payment Methods"
        subtitle="Paystack, MoMo, and cash rails for Ghana passengers in Accra."
      />

      <AdminKpiRow
        items={[
          { label: "Methods", value: PLATFORM_METHODS.length, hint: "Platform options", icon: <CreditCard size={22} />, tone: "yellow" },
          { label: "Configured", value: configuredCount, hint: "Ready for live use", icon: <Shield size={22} />, tone: "green" },
          { label: "MoMo rails", value: "3", hint: "Via Paystack channels", icon: <Smartphone size={22} />, tone: "yellow" }
        ]}
      />

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>Platform methods</h3>
            <p>Status reflects deployment configuration, not mock transaction history.</p>
          </div>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Type</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_METHODS.map((method) => (
                <tr key={method.id}>
                  <td><strong>{method.name}</strong></td>
                  <td>{method.type}</td>
                  <td><small>{method.details}</small></td>
                  <td>
                    <em className={`admin-reference-tag ${method.configured ? "success" : "warning"}`}>
                      {method.status}
                    </em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
