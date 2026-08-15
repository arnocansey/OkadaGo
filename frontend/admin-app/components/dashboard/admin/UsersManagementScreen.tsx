"use client";

import { useEffect } from "react";
import { Users, MapPin, Search, Bike, User, Trash2 } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPagination, hasServerPagination, usePagination } from "./ui/AdminPagination";
import { statusTone, formatDateTime } from "./utils";

const PAGE_SIZE = 15;

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
  dataLoading?: boolean;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onDeleteUser?: (userId: string) => void;
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
  totalUsersCount,
  dataLoading = false,
  page,
  totalItems,
  pageSize,
  onPageChange,
  onDeleteUser
}: UsersManagementScreenProps) {
  const totalUsers = totalUsersCount ?? passengersCount + ridersCount;

  const effectivePageSize = pageSize ?? PAGE_SIZE;
  const serverPaginated = hasServerPagination({ page, totalItems, pageSize, onPageChange });
  const clientPagination = usePagination(searchedManagedUsers, effectivePageSize);
  const displayItems = serverPaginated ? searchedManagedUsers : clientPagination.paginated;
  const paginationPage = serverPaginated ? page! : clientPagination.page;
  const paginationTotal = serverPaginated ? totalItems! : searchedManagedUsers.length;
  const paginationOnChange = serverPaginated ? onPageChange! : clientPagination.setPage;

  useEffect(() => {
    if (!serverPaginated) clientPagination.setPage(1);
  }, [adminSearchTerm, userTypeView, serverPaginated, clientPagination.setPage]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={8} cols={6} />;
  }

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
            icon: <Users size={18} />,
            tone: "green",
          },
          {
            label: "Passengers",
            value: passengersCount,
            hint: `${passengerPendingCount} pending · ${passengerVerifiedCount} verified`,
            icon: <User size={18} />,
            tone: "yellow",
          },
          {
            label: "Riders",
            value: ridersCount,
            hint: `${riderPendingCount} pending · ${riderVerifiedCount} verified`,
            icon: <Bike size={18} />,
            tone: "green",
          },
          {
            label: "Blocked Users",
            value: blockedUsers.length,
            hint: "Restricted access",
            icon: <Users size={18} />,
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((user) => {
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
                        <td><code style={{ fontSize: 10 }}>{user.reference}</code></td>
                        <td><small>{user.joinedAt ? formatDateTime(user.joinedAt) : "—"}</small></td>
                        <td>
                          {onDeleteUser && (
                            <button
                              type="button"
                              className="admin-btn-ghost"
                              title={`Delete account for ${user.name}`}
                              style={{ padding: "4px 8px", border: "none" }}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the account for ${user.name}? This will revoke access.`)) {
                                  onDeleteUser(user.id);
                                }
                              }}
                            >
                              <Trash2 size={13} style={{ color: "#ef4444" }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} style={{ color: "var(--accent-orange)" }} />
                      <span>{location}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          height: 5,
                          width: `${Math.max(10, (count / userLocationMax) * 60)}px`,
                          background: "var(--accent-orange)",
                          borderRadius: 3,
                          display: "inline-block",
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
