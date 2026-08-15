"use client";

import { useMemo, useState } from "react";
import { OperationsMap } from "@/components/maps/operations-map";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { formatMoney } from "@/lib/currency";
import type { RiderRecord, RideRecord, DeliveryRecord, WalletTransactionRecord, PayoutRequestRecord, AdminRatingRecord, AdminIncidentRecord, RiderDocumentRecord } from "./types";
import { parseNumber, formatDateTime, formatEnumLabel, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY } from "./utils";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Shield,
  ShieldCheck,
  Bike,
  FileText,
  TrendingUp,
  Wallet,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  Flag,
  CheckCircle,
  XCircle,
  Navigation,
  Truck,
  Package,
  Eye,
  Download,
  Wifi,
  WifiOff,
  Camera,
  Calendar
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type RiderProfileScreenProps = {
  rider: RiderRecord | null;
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  walletTransactions: WalletTransactionRecord[];
  payoutRequests: PayoutRequestRecord[];
  ratings: AdminRatingRecord[];
  incidents: AdminIncidentRecord[];
  documents: RiderDocumentRecord[];
  loading?: boolean;
  error?: string | null;
};

type ProfileTab =
  | "personal"
  | "motorcycle"
  | "documents"
  | "performance"
  | "earnings"
  | "trips"
  | "deliveries"
  | "payouts"
  | "complaints"
  | "safety";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function riderOverallStatus(rider: RiderRecord): string {
  const account = (rider.user.accountStatus ?? "").toLowerCase();
  const approval = (rider.approvalStatus ?? "").toUpperCase();
  if (account === "suspended" || account === "banned" || approval === "SUSPENDED") return "suspended";
  if (approval === "PENDING") return "pending";
  if (approval === "APPROVED") return "active";
  return "offline";
}

function verificationBadge(status: string | undefined): { label: string; tone: string } {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED") return { label: "Verified", tone: "success" };
  if (s === "PENDING") return { label: "Pending", tone: "warning" };
  if (s === "REJECTED") return { label: "Rejected", tone: "danger" };
  return { label: "Unknown", tone: "neutral" };
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function RiderProfileScreen({
  rider,
  rides,
  deliveries,
  walletTransactions,
  payoutRequests,
  ratings,
  incidents,
  documents,
  loading = false,
  error = null
}: RiderProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

  const stats = useMemo(() => {
    if (!rider) return { totalRides: 0, completedRides: 0, activeRides: 0, avgRating: 0, totalEarnings: 0, totalDeliveries: 0 };

    const riderRides = rides.filter((r) => r.rider?.id === rider.id);
    const riderDeliveries = deliveries.filter((d) => d.rider?.user?.fullName === rider.user.fullName);
    const riderRatings = ratings.filter((r) => r.rated?.riderProfile?.id === rider.id);
    const avgRating = riderRatings.length === 0
      ? 0
      : riderRatings.reduce((sum, r) => sum + r.score, 0) / riderRatings.length;

    return {
      totalRides: riderRides.length,
      completedRides: riderRides.filter((r) => r.status.toLowerCase() === "completed").length,
      activeRides: riderRides.filter((r) =>
        ["searching", "assigned", "arriving", "arrived", "started", "picked_up", "in_transit"].includes(r.status.toLowerCase())
      ).length,
      avgRating,
      totalEarnings: riderRides
        .filter((r) => r.status.toLowerCase() === "completed")
        .reduce((sum, r) => sum + parseNumber(r.finalFare) - parseNumber(r.platformCommission), 0),
      totalDeliveries: riderDeliveries.length
    };
  }, [rider, rides, deliveries, ratings]);

  const riderWalletBalance = useMemo(() => {
    if (!rider) return 0;
    const riderTxns = walletTransactions.filter(
      (t) => t.wallet?.user?.riderProfile?.id === rider.id
    );
    return riderTxns
      .filter((t) => t.direction === "credit")
      .reduce((sum, t) => sum + parseNumber(t.amount), 0) -
      riderTxns
        .filter((t) => t.direction === "debit")
        .reduce((sum, t) => sum + parseNumber(t.amount), 0);
  }, [rider, walletTransactions]);

  if (loading) {
    return <AdminPageSkeleton variant="cards" kpis={5} />;
  }

  if (error || !rider) {
    return (
      <div className="rp-error">
        <AlertTriangle size={48} />
        <h2>{error || "Rider not found"}</h2>
        <p>This rider may have been deleted or you may not have access.</p>
      </div>
    );
  }

  const accountStatus = riderOverallStatus(rider);
  const verification = verificationBadge(rider.approvalStatus);
  const initials = rider.user.fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  const TABS: Array<{ id: ProfileTab; label: string; icon: typeof User }> = [
    { id: "personal", label: "Personal", icon: User },
    { id: "motorcycle", label: "Motorcycle", icon: Bike },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "trips", label: "Trips", icon: Navigation },
    { id: "deliveries", label: "Deliveries", icon: Package },
    { id: "payouts", label: "Payouts", icon: CreditCard },
    { id: "complaints", label: "Complaints", icon: MessageSquare },
    { id: "safety", label: "Safety", icon: Shield }
  ];

  return (
    <div className="rp-page">
      {/* ── Header ── */}
      <header className="rp-header">
        <div className="rp-header-top">
          <div className="rp-avatar">
            {rider.user.phoneE164 ? (
              <Camera size={20} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="rp-header-info">
            <div className="rp-header-name">
              <h2>{rider.user.fullName}</h2>
              {rider.onlineStatus && <span className="rp-online-dot" />}
            </div>
            <div className="rp-header-meta">
              <code className="rp-id">{rider.displayCode}</code>
              <span className={`rp-badge rp-badge-${verification.tone}`}>{verification.label}</span>
              <span className={`rp-badge rp-badge-${accountStatus === "active" ? "success" : accountStatus === "suspended" ? "danger" : accountStatus === "pending" ? "warning" : "neutral"}`}>
                {formatEnumLabel(accountStatus)}
              </span>
            </div>
            <div className="rp-header-stats">
              <span><Star size={13} className="rp-star" /> {stats.avgRating.toFixed(1)}</span>
              <span>{stats.completedRides} rides</span>
              <span>{stats.totalDeliveries} deliveries</span>
              <span>{formatMoney(rider.user.preferredCurrency, stats.totalEarnings)}</span>
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
        {activeTab === "personal" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><User size={15} /> Contact Information</h3>
              <div className="rp-info-grid">
                <div className="rp-info-row">
                  <span className="rp-info-label">Full Name</span>
                  <span className="rp-info-value">{rider.user.fullName}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Phone</span>
                  <span className="rp-info-value"><Phone size={12} /> {rider.user.phoneE164}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Email</span>
                  <span className="rp-info-value"><Mail size={12} /> {rider.user.email ?? "—"}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">City</span>
                  <span className="rp-info-value"><MapPin size={12} /> {rider.city ?? "—"}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Zone</span>
                  <span className="rp-info-value">{rider.serviceZone?.name ?? "—"}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Job Preference</span>
                  <span className="rp-info-value">{rider.jobPreference ?? "Both"}</span>
                </div>
              </div>
            </div>

            <div className="rp-card">
              <h3 className="rp-card-title"><Shield size={15} /> Account Details</h3>
              <div className="rp-info-grid">
                <div className="rp-info-row">
                  <span className="rp-info-label">Account Status</span>
                  <span className={`rp-badge rp-badge-${accountStatus === "active" ? "success" : accountStatus === "suspended" ? "danger" : "neutral"}`}>{formatEnumLabel(accountStatus)}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Approval Status</span>
                  <span className={`rp-badge rp-badge-${verification.tone}`}>{verification.label}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Online Status</span>
                  <span className="rp-info-value">{rider.onlineStatus ? <><Wifi size={12} /> Online</> : <><WifiOff size={12} /> Offline</>}</span>
                </div>
                <div className="rp-info-row">
                  <span className="rp-info-label">Member Since</span>
                  <span className="rp-info-value"><Calendar size={12} /> {formatDateTime(rider.createdAt ?? "")}</span>
                </div>
                {rider.suspendedAt && (
                  <div className="rp-info-row">
                    <span className="rp-info-label">Suspended At</span>
                    <span className="rp-info-value">{formatDateTime(rider.suspendedAt)}</span>
                  </div>
                )}
                {rider.suspensionReason && (
                  <div className="rp-info-row">
                    <span className="rp-info-label">Suspension Reason</span>
                    <span className="rp-info-value">{rider.suspensionReason}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rp-card rp-map-card">
              <h3 className="rp-card-title"><MapPin size={15} /> Current Location</h3>
              <div className="rp-map">
                <OperationsMap
                  center={ACCRA_MAP_CENTER}
                  zoom={ACCRA_MAP_ZOOM_CITY}
                  emptyTitle="No location data"
                  emptyDescription="Rider location will appear when shared."
                  markers={[]}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "motorcycle" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><Bike size={15} /> Vehicle Information</h3>
              {rider.vehicle ? (
                <div className="rp-info-grid">
                  <div className="rp-info-row">
                    <span className="rp-info-label">Make</span>
                    <span className="rp-info-value">{rider.vehicle.make}</span>
                  </div>
                  <div className="rp-info-row">
                    <span className="rp-info-label">Model</span>
                    <span className="rp-info-value">{rider.vehicle.model}</span>
                  </div>
                  <div className="rp-info-row">
                    <span className="rp-info-label">Plate Number</span>
                    <span className="rp-info-value">{rider.vehicle.plateNumber}</span>
                  </div>
                  <div className="rp-info-row">
                    <span className="rp-info-label">Vehicle Type</span>
                    <span className="rp-info-value">{rider.vehicle.vehicleType ?? "—"}</span>
                  </div>
                  <div className="rp-info-row">
                    <span className="rp-info-label">Status</span>
                    <span className={`rp-badge rp-badge-${rider.vehicle.status === "ACTIVE" ? "success" : "neutral"}`}>{rider.vehicle.status}</span>
                  </div>
                </div>
              ) : (
                <span className="rp-unassigned">No vehicle registered</span>
              )}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><FileText size={15} /> Uploaded Documents</h3>
              {documents.length === 0 ? (
                <span className="rp-unassigned">No documents uploaded</span>
              ) : (
                <div className="rp-docs-list">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rp-doc-row">
                      <div className="rp-doc-info">
                        <strong>{doc.type}</strong>
                        <span>Uploaded {formatDateTime(doc.createdAt)}</span>
                        {doc.expiresAt && <span>Expires {formatDateTime(doc.expiresAt)}</span>}
                      </div>
                      <span className={`rp-badge rp-badge-${doc.status === "APPROVED" ? "success" : doc.status === "PENDING" ? "warning" : "danger"}`}>{doc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><TrendingUp size={15} /> Performance Metrics</h3>
              <div className="rp-kpi-grid">
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Rating</span>
                  <strong className="rp-kpi-value"><Star size={14} className="rp-star" /> {stats.avgRating.toFixed(1)}</strong>
                  <small>{ratings.filter((r) => r.rated?.riderProfile?.id === rider.id).length} ratings</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Completed Rides</span>
                  <strong className="rp-kpi-value">{stats.completedRides}</strong>
                  <small>of {stats.totalRides} total</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Active Rides</span>
                  <strong className="rp-kpi-value">{stats.activeRides}</strong>
                  <small>In progress</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Acceptance Rate</span>
                  <strong className="rp-kpi-value">{rider.acceptanceRate != null ? `${parseNumber(rider.acceptanceRate)}%` : "—"}</strong>
                  <small>Of ride requests</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Cancellation Rate</span>
                  <strong className="rp-kpi-value">{rider.cancellationRate != null ? `${parseNumber(rider.cancellationRate)}%` : "—"}</strong>
                  <small>Of accepted rides</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Completed Trips</span>
                  <strong className="rp-kpi-value">{rider.completedTrips ?? 0}</strong>
                  <small>All time</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><DollarSign size={15} /> Earnings Overview</h3>
              <div className="rp-kpi-grid">
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Total Earnings</span>
                  <strong className="rp-kpi-value">{formatMoney(rider.user.preferredCurrency, stats.totalEarnings)}</strong>
                  <small>From completed rides</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Wallet Balance</span>
                  <strong className="rp-kpi-value">{formatMoney(rider.user.preferredCurrency, riderWalletBalance)}</strong>
                  <small>Current balance</small>
                </div>
                <div className="rp-kpi">
                  <span className="rp-kpi-label">Commission Rate</span>
                  <strong className="rp-kpi-value">{rider.commissionPercent ?? 10}%</strong>
                  <small>Platform cut</small>
                </div>
              </div>
            </div>

            <div className="rp-card">
              <h3 className="rp-card-title"><Wallet size={15} /> Recent Wallet Transactions</h3>
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
                      {walletTransactions.slice(0, 10).map((t) => (
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
          </div>
        )}

        {activeTab === "trips" && (
          <div className="rp-section-grid">
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
                        <th>Passenger</th>
                        <th>Pickup</th>
                        <th>Destination</th>
                        <th>Fare</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rides.slice(0, 20).map((r) => (
                        <tr key={r.id}>
                          <td><code className="rp-table-id">{r.id.slice(0, 8)}</code></td>
                          <td>{r.passenger?.user?.fullName ?? "—"}</td>
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
          </div>
        )}

        {activeTab === "deliveries" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><Package size={15} /> Delivery History</h3>
              {deliveries.length === 0 ? (
                <span className="rp-unassigned">No deliveries found</span>
              ) : (
                <div className="rp-table-wrap">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Sender</th>
                        <th>Recipient</th>
                        <th>Pickup</th>
                        <th>Destination</th>
                        <th>Fare</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.slice(0, 20).map((d) => (
                        <tr key={d.id}>
                          <td><code className="rp-table-id">{d.id.slice(0, 8)}</code></td>
                          <td>{d.passenger?.user?.fullName ?? "—"}</td>
                          <td>{d.recipientName}</td>
                          <td>{d.pickupAddress?.slice(0, 20)}</td>
                          <td>{d.dropoffAddress?.slice(0, 20)}</td>
                          <td>{formatMoney(d.currency, parseNumber(d.finalFee ?? d.estimatedFee))}</td>
                          <td><span className={`rp-badge rp-badge-${d.status === "delivered" ? "success" : d.status === "cancelled" || d.status === "failed" ? "danger" : "warning"}`}>{d.status}</span></td>
                          <td>{formatDateTime(d.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "payouts" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><CreditCard size={15} /> Payout Requests</h3>
              {payoutRequests.length === 0 ? (
                <span className="rp-unassigned">No payout requests</span>
              ) : (
                <div className="rp-table-wrap">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Processed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutRequests.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDateTime(p.requestedAt)}</td>
                          <td>{formatMoney(p.currency, parseNumber(p.amount))}</td>
                          <td>{p.method ?? "—"}</td>
                          <td><span className={`rp-badge rp-badge-${p.status === "COMPLETED" ? "success" : p.status === "PENDING" ? "warning" : "danger"}`}>{p.status}</span></td>
                          <td>{p.paidAt ? formatDateTime(p.paidAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><MessageSquare size={15} /> Complaints & Support</h3>
              <span className="rp-unassigned">No complaints found for this rider.</span>
            </div>
          </div>
        )}

        {activeTab === "safety" && (
          <div className="rp-section-grid">
            <div className="rp-card">
              <h3 className="rp-card-title"><Shield size={15} /> Safety Incidents</h3>
              {incidents.length === 0 ? (
                <span className="rp-unassigned">No safety incidents recorded</span>
              ) : (
                <div className="rp-docs-list">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="rp-doc-row">
                      <div className="rp-doc-info">
                        <strong>{inc.category ?? "Incident"}</strong>
                        <span>{inc.description ?? "No description"}</span>
                        <span>{formatDateTime(inc.createdAt)}</span>
                      </div>
                      <span className={`rp-badge rp-badge-${inc.status === "RESOLVED" ? "success" : inc.status === "OPEN" ? "danger" : "warning"}`}>{inc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
