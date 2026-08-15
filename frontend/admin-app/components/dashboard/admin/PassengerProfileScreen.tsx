"use client";

import { useMemo, useState } from "react";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { formatMoney } from "@/lib/currency";
import type { PassengerRecord, RideRecord, DeliveryRecord, WalletTransactionRecord, PayoutRequestRecord, AdminIncidentRecord } from "./types";
import { parseNumber, formatDateTime, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY } from "./utils";
import { OperationsMap } from "@/components/maps/operations-map";
import {
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Navigation,
  DollarSign,
  Package,
  Wallet,
  CreditCard,
  MessageSquare,
  Shield,
  Star,
  Clock,
  TrendingUp,
  RefreshCw
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type PassengerProfileScreenProps = {
  passenger: PassengerRecord | null;
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  walletTransactions: WalletTransactionRecord[];
  incidents: AdminIncidentRecord[];
  loading?: boolean;
  error?: string | null;
};

type ProfileTab = "overview" | "trips" | "payments" | "wallet" | "complaints" | "refunds" | "support";

/* ══════════════════════════════════════════════════════════════════════════════ */

export function PassengerProfileScreen({
  passenger,
  rides,
  deliveries,
  walletTransactions,
  incidents,
  loading = false,
  error = null
}: PassengerProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  const stats = useMemo(() => {
    if (!passenger) return { totalRides: 0, completedRides: 0, totalSpending: 0, totalDeliveries: 0, walletBalance: 0 };

    const pRides = rides.filter((r) => r.passenger?.user?.fullName === passenger.user.fullName);
    const completed = pRides.filter((r) => r.status.toLowerCase() === "completed");
    const totalSpending = completed.reduce((sum, r) => sum + parseNumber(r.finalFare), 0);
    const pDeliveries = deliveries.filter((d) => d.passenger?.user?.fullName === passenger.user.fullName);

    const pTxns = walletTransactions.filter((t) => t.wallet?.user?.fullName === passenger.user.fullName);
    const walletBalance = pTxns
      .filter((t) => t.direction === "credit")
      .reduce((sum, t) => sum + parseNumber(t.amount), 0) -
      pTxns.filter((t) => t.direction === "debit")
        .reduce((sum, t) => sum + parseNumber(t.amount), 0);

    return {
      totalRides: pRides.length,
      completedRides: completed.length,
      totalSpending,
      totalDeliveries: pDeliveries.length,
      walletBalance
    };
  }, [passenger, rides, deliveries, walletTransactions]);

  if (loading) {
    return <AdminPageSkeleton variant="cards" kpis={5} />;
  }

  if (error || !passenger) {
    return (
      <div className="rp-error">
        <AlertTriangle size={48} />
        <h2>{error || "Passenger not found"}</h2>
        <p>This passenger may have been deleted or you may not have access.</p>
      </div>
    );
  }

  const initials = passenger.user.fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const accountStatus = (passenger.user.accountStatus ?? "active").toLowerCase();

  const TABS: Array<{ id: ProfileTab; label: string; icon: typeof User }> = [
    { id: "overview", label: "Overview", icon: User },
    { id: "trips", label: "Trips", icon: Navigation },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "complaints", label: "Complaints", icon: MessageSquare },
    { id: "refunds", label: "Refunds", icon: RefreshCw },
    { id: "support", label: "Support", icon: Shield }
  ];

  return (
    <div className="rp-page">
      {/* ── Header ── */}
      <header className="rp-header">
        <div className="rp-header-top">
          <div className="rp-avatar">
            <span>{initials}</span>
          </div>
          <div className="rp-header-info">
            <div className="rp-header-name">
              <h2>{passenger.user.fullName}</h2>
              {passenger.user.isPhoneVerified && <span className="rp-online-dot" />}
            </div>
            <div className="rp-header-meta">
              <span className={`rp-badge rp-badge-${accountStatus === "active" ? "success" : accountStatus === "suspended" ? "danger" : "neutral"}`}>
                {accountStatus === "active" ? "Active" : accountStatus === "suspended" ? "Suspended" : "Offline"}
              </span>
              {passenger.user.email && <code className="rp-id">{passenger.user.email}</code>}
            </div>
            <div className="rp-header-stats">
              <span><Star size={13} className="rp-star" /> {stats.completedRides} trips</span>
              <span>{stats.totalDeliveries} deliveries</span>
              <span>{formatMoney(passenger.user.preferredCurrency, stats.totalSpending)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="rp-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`rp-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="rp-content">
        {activeTab === "overview" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><User size={15} /> Contact Information</h3>
              <div className="rp-info-grid">
                <div className="rp-info-row">
                  <span className="rp-info-label">Full Name</span>
                  <span className="rp-info-value">{passenger.user.fullName}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Phone</span>
                  <span className="rp-info-value"><Phone size={12} /> {passenger.user.phoneE164}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Email</span>
                  <span className="rp-info-value"><Mail size={12} /> {passenger.user.email ?? "—"}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">City</span>
                  <span className="rp-info-value"><MapPin size={12} /> {passenger.defaultServiceCity ?? "—"}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Referral Code</span>
                  <span className="rp-info-value">{passenger.referralCode}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Preferred Payment</span>
                  <span className="rp-info-value">{passenger.preferredPayment ?? "—"}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Member Since</span>
                  <span className="rp-info-value"><Calendar size={12} /> {formatDateTime(passenger.createdAt ?? "")}</span>
                </div>
              </div>
            </div>

            <div className="rp-card">
              <h3 className="rp-card-title"><TrendingUp size={15} /> Quick Stats</h3>
              <div className="rp-kpi-grid">
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Total Rides</span>
                  <strong className="rp-kpi-value">{stats.totalRides}</strong>
                  <small>{stats.completedRides} completed</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Total Spending</span>
                  <strong className="rp-kpi-value">{formatMoney(passenger.user.preferredCurrency, stats.totalSpending)}</strong>
                  <small>All time</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Deliveries</span>
                  <strong className="rp-kpi-value">{stats.totalDeliveries}</strong>
                  <small>Packages sent</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Wallet Balance</span>
                  <strong className="rp-kpi-value">{formatMoney(passenger.user.preferredCurrency, stats.walletBalance)}</strong>
                  <small>Available</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Account Status</span>
                  <strong className="rp-kpi-value">{accountStatus === "active" ? "Active" : accountStatus}</strong>
                  <small>{passenger.user.isPhoneVerified ? "Phone verified" : "Unverified"}</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Currency</span>
                  <strong className="rp-kpi-value">{passenger.user.preferredCurrency}</strong>
                  <small>Preferred</small>
                </div>
              </div>
            </div>

            <div className="rp-card rp-map-card">
              <h3 className="rp-card-title"><MapPin size={15} /> Location</h3>
              <div className="rp-map">
                <OperationsMap
                  center={ACCRA_MAP_CENTER}
                  zoom={ACCRA_MAP_ZOOM_CITY}
                  emptyTitle="No location data"
                  emptyDescription="Passenger location will appear when shared."
                  markers={[]}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "trips" && (
          <div className="rp-card">
            <h3 className="rp-card-title"><Navigation size={15} /> Ride History</h3>
            {rides.length === 0 ? (
              <span className="rp-unassigned">No rides found</span>
            ) : (
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Ride ID</th>
                      <th>Rider</th>
                      <th>Pickup</th>
                      <th>Destination</th>
                      <th>Fare</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.slice(0, 30).map((r) => (
                      <tr key={r.id}>
                        <td><code className="rp-table-id">{r.id.slice(0, 8)}</code></td>
                        <td>{r.rider?.user?.fullName ?? "—"}</td>
                        <td>{r.pickupAddress?.slice(0, 20) ?? "—"}</td>
                        <td>{r.destinationAddress?.slice(0, 20) ?? "—"}</td>
                        <td>{formatMoney(r.currency, parseNumber(r.finalFare))}</td>
                        <td><span className={`rp-badge rp-badge-${r.status === "completed" ? "success" : r.status === "cancelled" ? "danger" : "warning"}`}>{r.status}</span></td>
                        <td>{formatDateTime(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="rp-card">
            <h3 className="rp-card-title"><CreditCard size={15} /> Payment History</h3>
            {rides.filter((r) => r.status.toLowerCase() === "completed").length === 0 ? (
              <span className="rp-unassigned">No completed payments</span>
            ) : (
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Ride ID</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.filter((r) => r.status.toLowerCase() === "completed").slice(0, 30).map((r) => (
                      <tr key={r.id}>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td><code className="rp-table-id">{r.id.slice(0, 8)}</code></td>
                        <td>{formatMoney(r.currency, parseNumber(r.finalFare))}</td>
                        <td>{r.paymentMethod ?? "—"}</td>
                        <td><span className="rp-badge rp-badge-success">Paid</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="rp-card">
            <h3 className="rp-card-title"><Wallet size={15} /> Wallet Activity</h3>
            <div className="rp-kpi-grid" style={{ marginBottom: 16 }}>
              <div className="rp-kpi">
                <span className="rp-kpi-label">Balance</span>
                <strong className="rp-kpi-value">{formatMoney(passenger.user.preferredCurrency, stats.walletBalance)}</strong>
              </div>
            </div>
            {walletTransactions.length === 0 ? (
              <span className="rp-unassigned">No wallet transactions</span>
            ) : (
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Direction</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletTransactions.slice(0, 20).map((t) => (
                      <tr key={t.id}>
                        <td>{formatDateTime(t.createdAt)}</td>
                        <td>{t.type}</td>
                        <td><span className={`rp-badge rp-badge-${t.direction === "credit" ? "success" : "danger"}`}>{t.direction}</span></td>
                        <td>{formatMoney(t.currency, parseNumber(t.amount))}</td>
                        <td>{t.description ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="rp-card">
            <h3 className="rp-card-title"><MessageSquare size={15} /> Complaints</h3>
            {incidents.filter((i) => i.reporter?.fullName === passenger.user.fullName).length === 0 ? (
              <span className="rp-unassigned">No complaints filed</span>
            ) : (
              <div className="rp-docs-list">
                {incidents.filter((i) => i.reporter?.fullName === passenger.user.fullName).map((inc) => (
                  <div key={inc.id} className="rp-doc-row">
                    <div className="rp-doc-info">
                      <strong>{inc.category}</strong>
                      <span>{inc.description}</span>
                      <span>{formatDateTime(inc.createdAt)}</span>
                    </div>
                    <span className={`rp-badge rp-badge-${inc.status === "RESOLVED" ? "success" : inc.status === "OPEN" ? "danger" : "warning"}`}>{inc.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "refunds" && (
          <div className="rp-card">
            <h3 className="rp-card-title"><RefreshCw size={15} /> Refund History</h3>
            <span className="rp-unassigned">No refund records found for this passenger.</span>
          </div>
        )}

        {activeTab === "support" && (
          <div className="rp-card">
            <h3 className="rp-card-title"><Shield size={15} /> Support Cases</h3>
            <span className="rp-unassigned">No support cases found for this passenger.</span>
          </div>
        )}
      </div>
    </div>
  );
}
