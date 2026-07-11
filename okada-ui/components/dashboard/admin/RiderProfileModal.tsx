"use client";

import { useMemo } from "react";
import { X, Phone, Mail, Bike, ShieldCheck, Star, Wallet, TrendingUp, MapPin } from "lucide-react";
import { parseNumber, formatDateTime, statusTone, formatEnumLabel } from "./utils";
import { formatMoney } from "@/lib/currency";
import type { RiderRecord, RideRecord, WalletTransactionRecord, PayoutRequestRecord, AdminRatingRecord } from "./types";

export type RiderProfileModalProps = {
  rider: RiderRecord | null;
  rides: RideRecord[];
  walletTransactions: WalletTransactionRecord[];
  payoutRequests: PayoutRequestRecord[];
  ratings: AdminRatingRecord[];
  adminCurrency: string;
  onClose: () => void;
  onBlock?: (riderId: string) => void;
  onApprove?: (riderId: string) => void;
};

export function RiderProfileModal({
  rider,
  rides,
  walletTransactions,
  payoutRequests,
  ratings,
  adminCurrency,
  onClose,
  onBlock,
  onApprove
}: RiderProfileModalProps) {
  const stats = useMemo(() => {
    if (!rider) return { totalRides: 0, completedRides: 0, activeRides: 0, avgRating: 0, walletBalance: 0, totalEarnings: 0 };

    const riderRides = rides.filter((r) => r.rider?.user.fullName === rider.user.fullName);
    const totalRides = riderRides.length;
    const completedRides = riderRides.filter((r) => r.status.toLowerCase() === "completed").length;
    const activeRides = riderRides.filter((r) =>
      ["searching", "assigned", "arriving", "arrived", "started", "picked_up", "in_transit"].includes(r.status.toLowerCase())
    ).length;

    const riderRatings = ratings.filter((r) => r.rated.riderProfile?.id === rider.id);
    const avgRating = riderRatings.length === 0
      ? 0
      : riderRatings.reduce((sum, r) => sum + r.score, 0) / riderRatings.length;

    const riderWalletTxns = walletTransactions.filter(
      (t) => t.wallet.user.riderProfile?.id === rider.id
    );
    const walletBalance = riderWalletTxns
      .filter((t) => t.direction === "credit")
      .reduce((sum, t) => sum + parseNumber(t.amount), 0) -
      riderWalletTxns
        .filter((t) => t.direction === "debit")
        .reduce((sum, t) => sum + parseNumber(t.amount), 0);

    const totalEarnings = riderRides
      .filter((r) => r.status.toLowerCase() === "completed")
      .reduce((sum, r) => sum + parseNumber(r.finalFare) - parseNumber(r.platformCommission), 0);

    return { totalRides, completedRides, activeRides, avgRating, walletBalance, totalEarnings };
  }, [rider, rides, walletTransactions, ratings]);

  const recentTrips = useMemo(() => {
    if (!rider) return [];
    return rides
      .filter((r) => r.rider?.user.fullName === rider.user.fullName)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [rider, rides]);

  if (!rider) return null;

  const accountStatus = rider.user.accountStatus ?? (rider.onlineStatus ? "active" : "offline");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg, #1a1b1e)",
          borderRadius: 16,
          border: "1px solid var(--border, #2a2b2e)",
          width: 480,
          maxHeight: "80vh",
          overflowY: "auto",
          padding: 24
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--accent, #2a8c4a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                fontWeight: 700
              }}
            >
              {rider.user.fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{rider.user.fullName}</h3>
                {rider.onlineStatus && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "inline-block"
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: "var(--muted, #888)" }}>{rider.displayCode}</span>
                <em
                  className={`admin-reference-tag ${statusTone(accountStatus)}`}
                  style={{ fontSize: 11, textTransform: "capitalize" }}
                >
                  {formatEnumLabel(accountStatus)}
                </em>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted, #888)",
              cursor: "pointer",
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Phone size={14} style={{ color: "var(--muted, #888)", flexShrink: 0 }} />
            <span>{rider.user.phoneE164}</span>
          </div>
          {rider.user.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Mail size={14} style={{ color: "var(--muted, #888)", flexShrink: 0 }} />
              <span>{rider.user.email}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Bike size={14} style={{ color: "var(--muted, #888)", flexShrink: 0 }} />
            <span>
              {rider.vehicle
                ? `${rider.vehicle.plateNumber} · ${rider.vehicle.make} ${rider.vehicle.model}`
                : "No vehicle"}
            </span>
          </div>
          {rider.serviceZone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <MapPin size={14} style={{ color: "var(--muted, #888)", flexShrink: 0 }} />
              <span>{rider.serviceZone.name}</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 20
          }}
        >
          {[
            { label: "Total Rides", value: stats.totalRides, icon: Bike },
            { label: "Completed", value: stats.completedRides, icon: ShieldCheck },
            { label: "Active", value: stats.activeRides, icon: TrendingUp },
            { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: Star },
            { label: "Wallet", value: formatMoney(adminCurrency, stats.walletBalance), icon: Wallet },
            { label: "Earnings", value: formatMoney(adminCurrency, stats.totalEarnings), icon: TrendingUp }
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-subtle, #222326)",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon size={12} style={{ color: "var(--muted, #888)" }} />
                <span style={{ fontSize: 11, color: "var(--muted, #888)" }}>{label}</span>
              </div>
              <strong style={{ fontSize: 14 }}>{value}</strong>
            </div>
          ))}
        </div>

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--muted, #aaa)" }}>
              Recent Trips
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {recentTrips.map((trip) => (
                <li
                  key={trip.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    background: "var(--bg-subtle, #222326)",
                    borderRadius: 8,
                    fontSize: 12
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {trip.pickupAddress} → {trip.destinationAddress}
                    </span>
                    <span style={{ color: "var(--muted, #888)", fontSize: 11 }}>
                      {formatDateTime(trip.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    <em
                      className={`admin-reference-tag ${statusTone(trip.status)}`}
                      style={{ fontSize: 10 }}
                    >
                      {formatEnumLabel(trip.status)}
                    </em>
                    <span style={{ fontWeight: 600 }}>
                      {formatMoney(trip.currency || adminCurrency, trip.finalFare ?? trip.estimatedFare)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {onBlock && (
            <button
              type="button"
              onClick={() => onBlock(rider.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--danger, #dc2626)",
                background: "transparent",
                color: "var(--danger, #dc2626)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Block
            </button>
          )}
          {onApprove && (
            <button
              type="button"
              onClick={() => onApprove(rider.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "var(--success, #22c55e)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Approve
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--border, #2a2b2e)",
              background: "var(--bg-subtle, #222326)",
              color: "var(--text, #e4e4e7)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
