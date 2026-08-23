"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Truck, CheckCircle, XCircle, Search } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPagination, hasServerPagination, usePagination } from "./ui/AdminPagination";
import type { DeliveryRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, formatEnumLabel } from "./utils";

const PAGE_SIZE = 10;

export type DeliveriesScreenProps = {
  deliveries: DeliveryRecord[];
  completedDeliveries: DeliveryRecord[];
  cancelledDeliveries: DeliveryRecord[];
  activeDeliveries: DeliveryRecord[];
  deliveryRevenue: number;
  deliveryCommission: number;
  adminCurrency: string;
  dataLoading?: boolean;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

function isLiveStatus(status: string) {
  const s = status.toLowerCase();
  return !["delivered", "cancelled", "failed", "completed"].includes(s);
}

export function DeliveriesScreen({
  deliveries,
  completedDeliveries,
  cancelledDeliveries,
  activeDeliveries,
  deliveryRevenue,
  deliveryCommission,
  adminCurrency,
  dataLoading = false,
  page,
  totalItems,
  pageSize,
  onPageChange
}: DeliveriesScreenProps) {
  const [query, setQuery] = useState("");

  const packageTypeSnapshot = Object.entries(
    deliveries.reduce<Record<string, number>>((acc, d) => {
      const key = d.packageType || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const sorted = useMemo(
    () =>
      deliveries
        .slice()
        .sort((a, b) => {
          const aLive = isLiveStatus(a.status) ? 1 : 0;
          const bLive = isLiveStatus(b.status) ? 1 : 0;
          if (aLive !== bLive) return bLive - aLive;
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        }),
    [deliveries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((d) => {
      const hay = [
        d.id,
        d.passenger?.user?.fullName ?? "",
        d.rider?.user?.fullName ?? "",
        d.pickupAddress,
        d.dropoffAddress,
        d.packageDescription,
        d.status,
        d.packageType ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, query]);

  const effectivePageSize = pageSize ?? PAGE_SIZE;
  const serverPaginated = hasServerPagination({ page, totalItems, pageSize, onPageChange });
  const clientPagination = usePagination(filtered, effectivePageSize);
  const displayItems = serverPaginated ? filtered : clientPagination.paginated;
  const paginationPage = serverPaginated ? page! : clientPagination.page;
  const paginationTotal = serverPaginated ? totalItems! : filtered.length;
  const paginationOnChange = serverPaginated ? onPageChange! : clientPagination.setPage;

  useEffect(() => {
    if (!serverPaginated) clientPagination.setPage(1);
  }, [query, serverPaginated, clientPagination.setPage]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={6} cols={6} />;
  }

  const completionRate =
    deliveries.length > 0 ? Math.round((completedDeliveries.length / deliveries.length) * 100) : 0;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Deliveries"
        subtitle="Live Accra package queue, courier assignment, and zone coverage."
        actions={
          <div className="admin-screen-toolbar">
            <label className="admin-filter-search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deliveries…"
              />
            </label>
          </div>
        }
      />

      <AdminKpiRow
        items={[
          {
            label: "Total Deliveries",
            value: deliveries.length,
            hint: `${activeDeliveries.length} in progress`,
            icon: <Package size={18} />,
            tone: "yellow"
          },
          {
            label: "Completed",
            value: completedDeliveries.length,
            hint: `${completionRate}% completion rate`,
            icon: <CheckCircle size={18} />,
            tone: "green"
          },
          {
            label: "Cancelled",
            value: cancelledDeliveries.length,
            hint: "Failed or cancelled",
            icon: <XCircle size={18} />,
            tone: "red"
          },
          {
            label: "Delivery Revenue",
            value: formatMoney(adminCurrency, deliveryRevenue),
            hint: `${formatMoney(adminCurrency, deliveryCommission)} commission`,
            icon: <Truck size={18} />,
            tone: "green"
          }
        ]}
      />

      {activeDeliveries.length > 0 ? (
        <div className="admin-inline-banner" role="status">
          <strong>{activeDeliveries.length} live deliveries in progress</strong>
          <span>Prioritize unassigned and in-transit Accra packages first.</span>
        </div>
      ) : null}

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Live delivery queue</h3>
              <p>
                {filtered.length} order{filtered.length === 1 ? "" : "s"}
                {query.trim() ? " matching search" : " · live first"}
              </p>
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyCard
              title={query.trim() ? "No deliveries match your search." : "No delivery orders."}
              body={
                query.trim()
                  ? "Try a different customer, rider, or zone."
                  : "Delivery requests will appear here when submitted from the app."
              }
            />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>From → To</th>
                    <th>Recipient</th>
                    <th>Package</th>
                    <th>Rider</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Zone</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((delivery) => (
                    <tr key={delivery.id}>
                      <td>
                        <code style={{ fontSize: 10 }}>{delivery.id.slice(-8)}</code>
                      </td>
                      <td>
                        <strong>{delivery.passenger.user.fullName}</strong>
                      </td>
                      <td>
                        <small>
                          {delivery.pickupAddress}
                          <br />→ {delivery.dropoffAddress}
                        </small>
                      </td>
                      <td>
                        <small>
                          {delivery.recipientName}
                          <br />
                          {delivery.recipientPhoneE164}
                        </small>
                      </td>
                      <td>
                        <small>{delivery.packageType}</small>
                        <br />
                        <small style={{ color: "var(--text-muted)" }}>
                          {delivery.packageDescription?.slice(0, 30)}
                        </small>
                      </td>
                      <td>
                        <small>{delivery.rider?.user.fullName ?? "Unassigned"}</small>
                      </td>
                      <td>
                        <strong>
                          {formatMoney(
                            delivery.currency,
                            parseNumber(delivery.finalFee ?? delivery.estimatedFee)
                          )}
                        </strong>
                      </td>
                      <td>
                        <em className={`admin-reference-tag ${statusTone(delivery.status)}`}>
                          {formatEnumLabel(delivery.status)}
                        </em>
                      </td>
                      <td>
                        <small>{delivery.serviceZone?.name ?? "—"}</small>
                      </td>
                      <td>
                        <small>{formatDateTime(delivery.createdAt)}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AdminPagination
                page={paginationPage}
                totalItems={paginationTotal}
                pageSize={effectivePageSize}
                onPageChange={paginationOnChange}
              />
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Package types</h3>
                <p>Volume by category</p>
              </div>
            </div>
            {packageTypeSnapshot.length === 0 ? (
              <EmptyCard title="No package data." body="" />
            ) : (
              <ul className="admin-summary-list">
                {packageTypeSnapshot.map(([type, count]) => (
                  <li key={type}>
                    <span>{type}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Status breakdown</h3>
                <p>Queue health</p>
              </div>
            </div>
            <ul className="admin-summary-list">
              <li>
                <span>In Progress</span>
                <strong>{activeDeliveries.length}</strong>
              </li>
              <li>
                <span>Completed</span>
                <strong>{completedDeliveries.length}</strong>
              </li>
              <li>
                <span>Cancelled</span>
                <strong>{cancelledDeliveries.length}</strong>
              </li>
              <li>
                <span>Completion Rate</span>
                <strong>{completionRate}%</strong>
              </li>
            </ul>
          </article>
        </aside>
      </div>
    </div>
  );
}
