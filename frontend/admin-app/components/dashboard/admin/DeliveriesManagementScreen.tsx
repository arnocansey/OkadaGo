"use client";

import { useMemo, useState } from "react";
import { Search, X, Package, Truck, CheckCircle, XCircle, Clock, DollarSign, MapPin, AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, hasServerPagination } from "./ui/AdminPagination";
import type { DeliveryRecord } from "./types";
import { parseNumber, formatDateTime, statusTone } from "./utils";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type DeliveriesManagementScreenProps = {
  deliveries: DeliveryRecord[];
  completedDeliveries: DeliveryRecord[];
  cancelledDeliveries: DeliveryRecord[];
  activeDeliveries: DeliveryRecord[];
  deliveryRevenue: number;
  adminCurrency: string;
  deliveriesTotal: number;
  deliveriesPage: number;
  deliveriesPageSize: number;
  onDeliveriesPageChange: (page: number) => void;
  dataLoading?: boolean;
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatPaymentMethod(method?: string | null): string {
  if (!method) return "—";
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function deliveryStatusBadge(status: string): string {
  const s = status.toLowerCase();
  if (["searching", "pending", "requested"].includes(s)) return "pending";
  if (["assigned", "accepted"].includes(s)) return "assigned";
  if (["picked_up", "pickedup"].includes(s)) return "picked-up";
  if (["in_transit", "intransit"].includes(s)) return "in-transit";
  if (["delivered", "completed"].includes(s)) return "delivered";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  if (["failed"].includes(s)) return "failed";
  return "neutral";
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function DeliveriesManagementScreen({
  deliveries,
  completedDeliveries,
  cancelledDeliveries,
  activeDeliveries,
  deliveryRevenue,
  adminCurrency,
  deliveriesTotal,
  deliveriesPage,
  deliveriesPageSize,
  onDeliveriesPageChange,
  dataLoading = false
}: DeliveriesManagementScreenProps) {
  const [search, setSearch] = useState("");

  const failedDeliveries = useMemo(
    () => deliveries.filter((d) => d.status.toLowerCase() === "failed"),
    [deliveries]
  );

  const kpis = useMemo(() => [
    {
      label: "Total Deliveries",
      value: deliveriesTotal || deliveries.length,
      icon: Package,
      tone: "info" as const
    },
    {
      label: "Active Deliveries",
      value: activeDeliveries.length,
      icon: Truck,
      tone: "warning" as const
    },
    {
      label: "Completed",
      value: completedDeliveries.length,
      icon: CheckCircle,
      tone: "success" as const
    },
    {
      label: "Failed",
      value: failedDeliveries.length,
      icon: XCircle,
      tone: "danger" as const
    },
    {
      label: "Delivery Revenue",
      value: formatMoney(adminCurrency, deliveryRevenue),
      icon: DollarSign,
      tone: "accent" as const
    }
  ], [deliveriesTotal, deliveries, activeDeliveries, completedDeliveries, failedDeliveries, deliveryRevenue, adminCurrency]);

  const filtered = useMemo(() => {
    let list = deliveries;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.passenger?.user?.fullName?.toLowerCase().includes(q) ||
          d.recipientName?.toLowerCase().includes(q) ||
          d.rider?.user?.fullName?.toLowerCase().includes(q) ||
          d.pickupAddress?.toLowerCase().includes(q) ||
          d.dropoffAddress?.toLowerCase().includes(q) ||
          d.packageType?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [deliveries, search]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={5} rows={8} cols={10} />;
  }

  return (
    <div className="del-mgmt">
      <AdminPageHeader
        title="Deliveries"
        subtitle={`Manage all ${deliveriesTotal || deliveries.length} delivery orders across the platform.`}
      />

      {/* ── KPI Cards ── */}
      <section className="del-mgmt-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className={`del-mgmt-kpi del-mgmt-kpi-${kpi.tone}`}>
              <div className="del-mgmt-kpi-icon">
                <Icon size={18} />
              </div>
              <div className="del-mgmt-kpi-body">
                <span className="del-mgmt-kpi-label">{kpi.label}</span>
                <strong className="del-mgmt-kpi-value">{kpi.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Search ── */}
      <div className="del-mgmt-toolbar">
        <div className="del-mgmt-search">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, sender, recipient, rider, or address..."
          />
          {search && (
            <button type="button" className="del-mgmt-search-clear" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="del-mgmt-table-wrap">
        {filtered.length === 0 ? (
          <div className="del-mgmt-empty">
            <EmptyCard title="No deliveries found" body="Try adjusting your search query." />
          </div>
        ) : (
          <table className="del-mgmt-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Rider</th>
                <th>Package</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Fare</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((delivery) => (
                <tr key={delivery.id}>
                  <td>
                    <code className="del-mgmt-id">{delivery.id.slice(0, 8)}</code>
                  </td>
                  <td>
                    <span className="del-mgmt-name">{delivery.passenger?.user?.fullName ?? "—"}</span>
                  </td>
                  <td>
                    <span className="del-mgmt-name">{delivery.recipientName}</span>
                  </td>
                  <td>
                    <span className="del-mgmt-name">
                      {delivery.rider?.user?.fullName ?? <em className="del-mgmt-unassigned">Unassigned</em>}
                    </span>
                  </td>
                  <td>
                    <span className="del-mgmt-package">{delivery.packageType}</span>
                  </td>
                  <td>
                    <span className="del-mgmt-address" title={delivery.pickupAddress}>
                      {delivery.pickupAddress?.length > 24 ? delivery.pickupAddress.slice(0, 24) + "…" : delivery.pickupAddress}
                    </span>
                  </td>
                  <td>
                    <span className="del-mgmt-address" title={delivery.dropoffAddress}>
                      {delivery.dropoffAddress?.length > 24 ? delivery.dropoffAddress.slice(0, 24) + "…" : delivery.dropoffAddress}
                    </span>
                  </td>
                  <td>
                    <span className="del-mgmt-fare">
                      {formatMoney(delivery.currency || adminCurrency, parseNumber(delivery.finalFee ?? delivery.estimatedFee))}
                    </span>
                  </td>
                  <td>
                    <span className={`del-mgmt-badge del-mgmt-badge-${deliveryStatusBadge(delivery.status)}`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td>
                    <span className="del-mgmt-date">{formatDateTime(delivery.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {hasServerPagination({ page: deliveriesPage, totalItems: deliveriesTotal, onPageChange: onDeliveriesPageChange }) && (
        <AdminPagination
          page={deliveriesPage}
          totalItems={deliveriesTotal}
          pageSize={deliveriesPageSize}
          onPageChange={onDeliveriesPageChange}
        />
      )}
    </div>
  );
}
