import { Users, MapPin, Search } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { PassengerRecord, RiderRecord } from "./types";
import { statusTone, formatDateTime } from "./utils";
import { Bike, User } from "lucide-react";

type ManagedUser = {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  status: string;
  joinedAt?: string;
  location: string;
  reference: string;
  icon: typeof User;
};

export type UsersManagementScreenProps = {
  managedUsers: ManagedUser[];
  searchedManagedUsers: ManagedUser[];
  blockedUsers: ManagedUser[];
  userLocationSnapshot: [string, number][];
  userLocationMax: number;
  recentManagedUsers: ManagedUser[];
  adminSearchTerm: string;
  onSearchChange: (term: string) => void;
  userTypeView: "all" | "riders" | "customers" | "vendors" | "admins";
  onTypeViewChange: (view: "all" | "riders" | "customers" | "vendors" | "admins") => void;
  passengersCount: number;
  ridersCount: number;
};

export function UsersManagementScreen({
  managedUsers,
  searchedManagedUsers,
  blockedUsers,
  userLocationSnapshot,
  userLocationMax,
  recentManagedUsers,
  adminSearchTerm,
  onSearchChange,
  userTypeView,
  onTypeViewChange,
  passengersCount,
  ridersCount
}: UsersManagementScreenProps) {
  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Users Management"
        subtitle="Review passenger profiles, referral codes, and city distribution from the live backend."
      />

      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Users size={22} /></div>
          <div>
            <span>Total Users</span>
            <strong>{managedUsers.length}</strong>
            <small>{passengersCount} passengers, {ridersCount} riders</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><User size={22} /></div>
          <div>
            <span>Passengers</span>
            <strong>{passengersCount}</strong>
            <small>Active demand base</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Bike size={22} /></div>
          <div>
            <span>Riders</span>
            <strong>{ridersCount}</strong>
            <small>Supply pool</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><Users size={22} /></div>
          <div>
            <span>Blocked Users</span>
            <strong>{blockedUsers.length}</strong>
            <small>Restricted access</small>
          </div>
        </article>
      </section>

      {/* Search and filter */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrap">
          <Search size={14} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, phone, email, location..."
            value={adminSearchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {(["all", "riders", "customers"] as const).map((view) => (
          <button
            key={view}
            type="button"
            className={`admin-filter-pill ${userTypeView === view ? "active" : ""}`}
            onClick={() => onTypeViewChange(view)}
          >
            {view === "all" ? "All Users" : view === "riders" ? "Riders" : "Passengers"}
          </button>
        ))}
      </div>

      <div className="admin-screen-grid-2">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>User Directory</h3>
              <p>{searchedManagedUsers.length} results</p>
            </div>
          </div>
          {searchedManagedUsers.length === 0 ? (
            <EmptyCard title="No users found." body="Try adjusting your search or filter." />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Reference</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedManagedUsers.slice(0, 50).map((user) => {
                    const Icon = user.icon;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Icon size={14} />
                            <strong>{user.name}</strong>
                          </div>
                        </td>
                        <td><small>{user.type}</small></td>
                        <td><small>{user.phone}</small></td>
                        <td><small>{user.email}</small></td>
                        <td>
                          <em className={`admin-reference-tag ${statusTone(user.status)}`}>
                            {user.status}
                          </em>
                        </td>
                        <td><small>{user.location}</small></td>
                        <td><code style={{ fontSize: 11 }}>{user.reference}</code></td>
                        <td><small>{user.joinedAt ? formatDateTime(user.joinedAt) : "—"}</small></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Location Breakdown</h3>
                <p>User distribution by city</p>
              </div>
            </div>
            {userLocationSnapshot.length === 0 ? (
              <EmptyCard title="No location data." body="" />
            ) : (
              <ul className="admin-summary-list">
                {userLocationSnapshot.map(([location, count]) => (
                  <li key={location}>
                    <div>
                      <MapPin size={12} style={{ marginRight: 4 }} />
                      <span>{location}</span>
                    </div>
                    <div>
                      <div
                        style={{
                          height: 6,
                          width: `${Math.max(10, (count / userLocationMax) * 80)}px`,
                          background: "var(--color-primary, #111827)",
                          borderRadius: 3,
                          display: "inline-block",
                          marginRight: 8
                        }}
                      />
                      <strong>{count}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Recently Joined</h3></div>
            </div>
            {recentManagedUsers.length === 0 ? (
              <EmptyCard title="No recent users." body="" />
            ) : (
              <ul className="admin-reference-list">
                {recentManagedUsers.map((user) => (
                  <li key={user.id} className="admin-reference-list-row">
                    <span className={`admin-reference-status-dot ${statusTone(user.status)}`} />
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.type} · {user.location}</small>
                    </div>
                    <small>{user.joinedAt ? formatDateTime(user.joinedAt) : "—"}</small>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </aside>
      </div>
    </div>
  );
}
