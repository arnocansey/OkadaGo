import { Users, MapPin, Search, Bike, User } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { statusTone, formatDateTime } from "./utils";

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
  passengerPendingCount?: number;
  passengerVerifiedCount?: number;
  riderPendingCount?: number;
  riderVerifiedCount?: number;
  totalUsersCount?: number;
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
  ridersCount,
  passengerPendingCount = 0,
  passengerVerifiedCount = 0,
  riderPendingCount = 0,
  riderVerifiedCount = 0,
  totalUsersCount
}: UsersManagementScreenProps) {
  const totalUsers = totalUsersCount ?? passengersCount + ridersCount;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Passengers"
        subtitle="Accra passenger and rider accounts — pending vs verified counts."
      />

      <AdminKpiRow
        items={[
          {
            label: "Total Users",
            value: totalUsers,
            hint: `${passengersCount} passengers, ${ridersCount} riders`,
            icon: <Users size={22} />,
            tone: "green",
          },
          {
            label: "Passengers",
            value: passengersCount,
            hint: `${passengerPendingCount} pending · ${passengerVerifiedCount} verified`,
            icon: <User size={22} />,
            tone: "yellow",
          },
          {
            label: "Riders",
            value: ridersCount,
            hint: `${riderPendingCount} pending · ${riderVerifiedCount} verified`,
            icon: <Bike size={22} />,
            tone: "green",
          },
          {
            label: "Blocked Users",
            value: blockedUsers.length,
            hint: "Restricted access",
            icon: <Users size={22} />,
            tone: "red",
          },
        ]}
      />

      <div className="admin-filter-bar">
        <label className="admin-filter-search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder="Search by name, phone, email, location..."
            value={adminSearchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>
        {(["all", "riders", "customers"] as const).map((view) => (
          <button
            key={view}
            type="button"
            className={`admin-tab${userTypeView === view ? " active" : ""}`}
            onClick={() => onTypeViewChange(view)}
          >
            {view === "all" ? "All Users" : view === "riders" ? "Riders" : "Passengers"}
          </button>
        ))}
      </div>

      <div className="admin-overview-split">
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
                <p>User distribution across Accra zones</p>
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
                          background: "var(--accent-orange)",
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
