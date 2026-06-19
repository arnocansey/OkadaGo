"use client";

import { Bike, Filter, Package, Search, ShieldAlert, User, UserPlus, Users } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import type { PassengerRecord, RiderRecord } from "./types";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "delivered", "paid", "captured", "posted", "approved", "valid"].includes(normalized)) {
    return "success";
  }
  if (["searching", "assigned", "arriving", "arrived", "started", "picked_up", "in_transit", "pending", "requested", "reviewing", "under review", "processing"].includes(normalized)) {
    return "warning";
  }
  if (["failed", "rejected", "cancelled", "reversed", "missing", "expired"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type ManagedUser = {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  status: string;
  joinedAt: string | undefined;
  location: string;
  reference: string;
  icon: typeof Bike | typeof User;
};

type UsersManagementScreenProps = {
  riders: RiderRecord[];
  passengers: PassengerRecord[];
  activeRiders: RiderRecord[];
  recentPassengers: PassengerRecord[];
  managedUsers: ManagedUser[];
  searchedManagedUsers: ManagedUser[];
  blockedUsers: ManagedUser[];
  recentManagedUsers: ManagedUser[];
  userLocationSnapshot: [string, number][];
  userLocationMax: number;
  userTypeView: "all" | "riders" | "customers" | "vendors" | "admins";
  setUserTypeView: (view: "all" | "riders" | "customers" | "vendors" | "admins") => void;
  adminSearchTerm: string;
  setAdminSearchTerm: (term: string) => void;
};

export function UsersManagementScreen({
  riders,
  passengers,
  activeRiders,
  recentPassengers,
  managedUsers,
  searchedManagedUsers,
  blockedUsers,
  recentManagedUsers,
  userLocationSnapshot,
  userLocationMax,
  userTypeView,
  setUserTypeView,
  adminSearchTerm,
  setAdminSearchTerm
}: UsersManagementScreenProps) {
  return (
    <div className="admin-reference-dark admin-users-dashboard">
      <section className="admin-users-kpis">
        <article className="admin-dark-kpi">
          <Users size={22} />
          <span>Total Users</span>
          <strong>{managedUsers.length}</strong>
          <small>{passengers.length} customers, {riders.length} riders</small>
        </article>
        <article className="admin-dark-kpi">
          <Bike size={22} />
          <span>Riders</span>
          <strong>{riders.length}</strong>
          <small>{activeRiders.length} online</small>
        </article>
        <article className="admin-dark-kpi">
          <User size={22} />
          <span>Customers</span>
          <strong>{passengers.length}</strong>
          <small>{recentPassengers.length} recent profiles</small>
        </article>
        <article className="admin-dark-kpi">
          <Package size={22} />
          <span>Vendors</span>
          <strong>0</strong>
          <small>No vendor endpoint wired</small>
        </article>
        <article className="admin-dark-kpi danger">
          <ShieldAlert size={22} />
          <span>Blocked Users</span>
          <strong>{blockedUsers.length}</strong>
          <small>From account status data</small>
        </article>
      </section>

      <section className="admin-users-layout">
        <article className="admin-dark-card admin-users-table-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>All Users</h3>
              <p>Riders and customers from the live backend. Vendors and admins appear when exposed by API.</p>
            </div>
            <div className="admin-users-actions">
              <button
                type="button"
                onClick={() => {
                  setUserTypeView("all");
                  setAdminSearchTerm("");
                }}
              >
                <Filter size={15} /> Reset Filters
              </button>
              <a href="/admin/riders"><UserPlus size={15} /> Add User</a>
            </div>
          </div>
          <label className="admin-users-search">
            <Search size={16} />
            <input
              type="search"
              value={adminSearchTerm}
              onChange={(event) => setAdminSearchTerm(event.target.value)}
              placeholder="Search by name, phone, email, or code"
            />
          </label>
          <div className="admin-users-segments">
            <button
              type="button"
              className={userTypeView === "all" ? "active" : ""}
              onClick={() => setUserTypeView("all")}
            >
              All ({managedUsers.length})
            </button>
            <button
              type="button"
              className={userTypeView === "riders" ? "active" : ""}
              onClick={() => setUserTypeView("riders")}
            >
              Riders ({riders.length})
            </button>
            <button
              type="button"
              className={userTypeView === "customers" ? "active" : ""}
              onClick={() => setUserTypeView("customers")}
            >
              Customers ({passengers.length})
            </button>
            <button
              type="button"
              className={userTypeView === "vendors" ? "active" : ""}
              onClick={() => setUserTypeView("vendors")}
            >
              Vendors (0)
            </button>
            <button
              type="button"
              className={userTypeView === "admins" ? "active" : ""}
              onClick={() => setUserTypeView("admins")}
            >
              Admins (0)
            </button>
          </div>
          {searchedManagedUsers.length === 0 ? (
            <EmptyCard
              title={
                userTypeView === "vendors" || userTypeView === "admins"
                  ? `${formatEnumLabel(userTypeView)} are not wired yet.`
                  : "No users found."
              }
              body={
                userTypeView === "vendors" || userTypeView === "admins"
                  ? "This UI is ready, but the backend does not expose this user type yet."
                  : "Try a different search term or reset the filters to see all users."
              }
            />
          ) : (
            <div className="table-wrapper admin-dark-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>User Type</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedManagedUsers.map((user) => {
                    const Icon = user.icon;

                    return (
                      <tr key={`${user.type}-${user.id}`}>
                        <td>
                          <div className="admin-users-person">
                            <span><Icon size={15} /></span>
                            <div>
                              <strong>{user.name}</strong>
                              <small>{user.reference}</small>
                            </div>
                          </div>
                        </td>
                        <td>{user.type}</td>
                        <td>{user.phone}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`status-chip ${statusTone(user.status)}`}>
                            {formatEnumLabel(user.status)}
                          </span>
                        </td>
                        <td>{user.joinedAt ? formatDateTime(user.joinedAt) : "Not available"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-users-side">
          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>User Statistics</h3>
                <p>Current user type split.</p>
              </div>
              <span>This month</span>
            </div>
            <div className="admin-users-donut-wrap">
              <div
                className="admin-users-donut"
                style={{
                  background:
                    managedUsers.length === 0
                      ? "#1f2937"
                      : `conic-gradient(#ffc107 0 ${(riders.length / Math.max(1, managedUsers.length)) * 100}%, #22c55e ${(riders.length / Math.max(1, managedUsers.length)) * 100}% 100%)`
                }}
              >
                <div>
                  <strong>{managedUsers.length}</strong>
                  <span>Total Users</span>
                </div>
              </div>
              <ul className="admin-users-stat-list">
                <li><i className="yellow" /> Riders <strong>{riders.length}</strong></li>
                <li><i className="green" /> Customers <strong>{passengers.length}</strong></li>
                <li><i className="blue" /> Vendors <strong>0</strong></li>
                <li><i className="red" /> Admins <strong>0</strong></li>
              </ul>
            </div>
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Recent Signups</h3>
                <p>Newest rider and customer records.</p>
              </div>
              <span>View all</span>
            </div>
            {recentManagedUsers.length === 0 ? (
              <EmptyCard
                title="No recent users."
                body="New signups will appear here when records include signup timestamps."
              />
            ) : (
              <ul className="admin-users-recent-list">
                {recentManagedUsers.map((user) => (
                  <li key={`${user.type}-recent-${user.id}`}>
                    <div className="admin-reference-avatar">{user.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.type}</span>
                    </div>
                    <small>{user.joinedAt ? formatDateTime(user.joinedAt) : "Recent"}</small>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>User by Location</h3>
                <p>Location distribution from rider cities and customer default cities.</p>
              </div>
              <span>View full report</span>
            </div>
            {userLocationSnapshot.length === 0 ? (
              <EmptyCard
                title="No location data."
                body="User location distribution will appear as profiles add city data."
              />
            ) : (
              <div className="admin-users-location-list">
                {userLocationSnapshot.map(([location, count]) => (
                  <div key={location}>
                    <span>{location}</span>
                    <strong>{count}</strong>
                    <i style={{ width: `${Math.max(8, (count / userLocationMax) * 100)}%` }} />
                  </div>
                ))}
              </div>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
