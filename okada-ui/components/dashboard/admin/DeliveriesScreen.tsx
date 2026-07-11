import { Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { DeliveryRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, formatEnumLabel } from "./utils";

export type DeliveriesScreenProps = {
  deliveries: DeliveryRecord[];
  completedDeliveries: DeliveryRecord[];
  cancelledDeliveries: DeliveryRecord[];
  activeDeliveries: DeliveryRecord[];
  deliveryRevenue: number;
  deliveryCommission: number;
  adminCurrency: string;
};

export function DeliveriesScreen({
  deliveries,
  completedDeliveries,
  cancelledDeliveries,
  activeDeliveries,
  deliveryRevenue,
  deliveryCommission,
  adminCurrency
}: DeliveriesScreenProps) {
  const packageTypeSnapshot = Object.entries(
    deliveries.reduce<Record<string, number>>((acc, d) => {
      const key = d.packageType || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="exact-admin-screen">
      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Package size={22} /></div>
          <div>
            <span>Total Deliveries</span>
            <strong>{deliveries.length}</strong>
            <small>{activeDeliveries.length} in progress</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><CheckCircle size={22} /></div>
          <div>
            <span>Completed</span>
            <strong>{completedDeliveries.length}</strong>
            <small>Successfully delivered</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><XCircle size={22} /></div>
          <div>
            <span>Cancelled</span>
            <strong>{cancelledDeliveries.length}</strong>
            <small>Failed deliveries</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Truck size={22} /></div>
          <div>
            <span>Delivery Revenue</span>
            <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
            <small>{formatMoney(adminCurrency, deliveryCommission)} commission</small>
          </div>
        </article>
      </section>

      <div className="admin-screen-grid-2">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>All Delivery Orders</h3>
              <p>{deliveries.length} total orders</p>
            </div>
          </div>
          {deliveries.length === 0 ? (
            <EmptyCard title="No delivery orders." body="Delivery requests will appear here when submitted from the app." />
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
                  {deliveries
                    .slice()
                    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                    .map((delivery) => (
                      <tr key={delivery.id}>
                        <td><code style={{ fontSize: 11 }}>{delivery.id.slice(-8)}</code></td>
                        <td><strong>{delivery.passenger.user.fullName}</strong></td>
                        <td>
                          <small>
                            {delivery.pickupAddress}<br />→ {delivery.dropoffAddress}
                          </small>
                        </td>
                        <td>
                          <small>
                            {delivery.recipientName}<br />
                            {delivery.recipientPhoneE164}
                          </small>
                        </td>
                        <td>
                          <small>{delivery.packageType}</small><br />
                          <small style={{ color: "#6b7280" }}>{delivery.packageDescription?.slice(0, 30)}</small>
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
                        <td><small>{delivery.serviceZone?.name ?? "—"}</small></td>
                        <td><small>{formatDateTime(delivery.createdAt)}</small></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Package Types</h3></div>
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
              <div><h3>Status Breakdown</h3></div>
            </div>
            <ul className="admin-summary-list">
              <li><span>In Progress</span><strong>{activeDeliveries.length}</strong></li>
              <li><span>Completed</span><strong>{completedDeliveries.length}</strong></li>
              <li><span>Cancelled</span><strong>{cancelledDeliveries.length}</strong></li>
              <li>
                <span>Completion Rate</span>
                <strong>
                  {deliveries.length > 0
                    ? Math.round((completedDeliveries.length / deliveries.length) * 100)
                    : 0}%
                </strong>
              </li>
            </ul>
          </article>
        </aside>
      </div>
    </div>
  );
}
