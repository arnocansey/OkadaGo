"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Truck, CheckCircle, XCircle, Search } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPagination, usePagination } from "./ui/AdminPagination";
import type { DeliveryRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, formatEnumLabel } from "./utils";

const PAGE_SIZE = 12;

export type DeliveriesScreenProps = {
  deliveries: DeliveryRecord[];
  completedDeliveries: DeliveryRecord[];
  cancelledDeliveries: DeliveryRecord[];
  activeDeliveries: DeliveryRecord[];
  deliveryRevenue: number;
  deliveryCommission: number;
  adminCurrency: string;
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
  adminCurrency
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
        d.passenger.user.fullName,
        d.pickupAddress,
        d.dropoffAddress,
        d.recipientName,
        d.packageType,
        d.rider?.user.fullName ?? "",
        d.status,
        d.serviceZone?.name ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, query]);

  const { page, setPage, paginated } = usePagination(filtered, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, setPage]);

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
            icon: <Package size={22} />,
            tone: "yellow"
          },
          {
            label: "Completed",
            value: completedDeliveries.length,
            hint: `${completionRate}% completion rate`,
            icon: <CheckCircle size={22} />,
            tone: "green"
          },
          {
            label: "Cancelled",
            value: cancelledDeliveries.length,
            hint: "Failed or cancelled",
            icon: <XCircle size={22} />,
            tone: "red"
          },
          {
            label: "Delivery Revenue",
            value: formatMoney(adminCurrency, deliveryRevenue),
            hint: `${formatMoney(adminCurrency, deliveryCommission)} commission`,
            icon: <Truck size={22} />,
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
                  {paginated.map((delivery) => (
                    <tr key={delivery.id}>
                      <td>
                        <code style={{ fontSize: 11 }}>{delivery.id.slice(-8)}</code>
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
                page={page}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
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
