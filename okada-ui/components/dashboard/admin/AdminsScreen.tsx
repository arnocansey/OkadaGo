import { ShieldAlert, UserPlus, CheckCircle } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import type { AdminAccountRecord, PassengerRecord } from "./types";
import { formatDateTime, statusTone } from "./utils";

export type AdminsScreenProps = {
  adminAccounts: AdminAccountRecord[];
  eligiblePassengers: PassengerRecord[];
  adminRoleEntries: [string, string[]][];
  adminForm: {
    fullName: string;
    email: string;
    phoneCountryCode: string;
    phoneLocal: string;
    phoneE164: string;
    preferredCurrency: string;
    password: string;
    title: string;
    permissions: string;
  };
  promoteForm: {
    passengerUserId: string;
    email: string;
    password: string;
    title: string;
    permissions: string;
  };
  selectedPassenger: PassengerRecord | null;
  onAdminFormChange: (field: string, value: string) => void;
  onPromoteFormChange: (field: string, value: string) => void;
  onCreateAdmin: () => void;
  onPromotePassenger: () => void;
  isCreating: boolean;
  isPromoting: boolean;
};

export function AdminsScreen({
  adminAccounts,
  eligiblePassengers,
  adminRoleEntries,
  adminForm,
  promoteForm,
  selectedPassenger,
  onAdminFormChange,
  onPromoteFormChange,
  onCreateAdmin,
  onPromotePassenger,
  isCreating,
  isPromoting
}: AdminsScreenProps) {
  return (
    <div className="exact-admin-screen">
      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><ShieldAlert size={22} /></div>
          <div>
            <span>Admin Accounts</span>
            <strong>{adminAccounts.length}</strong>
            <small>Active operators</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><UserPlus size={22} /></div>
          <div>
            <span>Eligible Passengers</span>
            <strong>{eligiblePassengers.length}</strong>
            <small>Can be promoted</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><ShieldAlert size={22} /></div>
          <div>
            <span>Permission Roles</span>
            <strong>{adminRoleEntries.length}</strong>
            <small>Defined templates</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><CheckCircle size={22} /></div>
          <div>
            <span>Active Admins</span>
            <strong>
              {adminAccounts.filter((a) => a.user.accountStatus?.toLowerCase() === "active").length}
            </strong>
            <small>Currently active</small>
          </div>
        </article>
      </section>

      <div className="admin-screen-grid-2">
        {/* Current Admins */}
        <div>
          <article className="admin-reference-card" style={{ marginBottom: 16 }}>
            <div className="admin-reference-cardhead">
              <div>
                <h3>Admin Accounts</h3>
                <p>All current administrators on the platform.</p>
              </div>
            </div>
            {adminAccounts.length === 0 ? (
              <EmptyCard title="No admin accounts." body="Create the first admin account using the form below." />
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Permissions</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminAccounts.map((admin) => (
                      <tr key={admin.id}>
                        <td><strong>{admin.user.fullName}</strong></td>
                        <td><small>{admin.title ?? "—"}</small></td>
                        <td><small>{admin.user.phoneE164}</small></td>
                        <td><small>{admin.user.email ?? "—"}</small></td>
                        <td>
                          <em className={`admin-reference-tag ${statusTone(admin.user.accountStatus)}`}>
                            {admin.user.accountStatus}
                          </em>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {admin.permissions.slice(0, 3).map((perm) => (
                              <em key={perm} className="admin-reference-tag neutral" style={{ fontSize: 11 }}>
                                {perm}
                              </em>
                            ))}
                            {admin.permissions.length > 3 && (
                              <em className="admin-reference-tag neutral" style={{ fontSize: 11 }}>
                                +{admin.permissions.length - 3}
                              </em>
                            )}
                          </div>
                        </td>
                        <td><small>{formatDateTime(admin.createdAt)}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <aside className="admin-sidebar-panel">
          {/* Create new admin */}
          <article className="admin-reference-card" style={{ marginBottom: 16 }}>
            <div className="admin-reference-cardhead">
              <div><h3>Create Admin Account</h3></div>
            </div>
            <div className="admin-form">
              <label>
                Full Name
                <input
                  type="text"
                  className="admin-input"
                  value={adminForm.fullName}
                  onChange={(e) => onAdminFormChange("fullName", e.target.value)}
                  placeholder="Full name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  className="admin-input"
                  value={adminForm.email}
                  onChange={(e) => onAdminFormChange("email", e.target.value)}
                  placeholder="Email address"
                />
              </label>
              <label>
                Phone (E.164)
                <input
                  type="tel"
                  className="admin-input"
                  value={adminForm.phoneE164}
                  onChange={(e) => onAdminFormChange("phoneE164", e.target.value)}
                  placeholder="+233XXXXXXXXX"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  className="admin-input"
                  value={adminForm.password}
                  onChange={(e) => onAdminFormChange("password", e.target.value)}
                  placeholder="Password"
                />
              </label>
              <label>
                Title / Role
                <input
                  type="text"
                  className="admin-input"
                  value={adminForm.title}
                  onChange={(e) => onAdminFormChange("title", e.target.value)}
                  placeholder="e.g. Operations Manager"
                />
              </label>
              <label>
                Permissions (comma-separated)
                <input
                  type="text"
                  className="admin-input"
                  value={adminForm.permissions}
                  onChange={(e) => onAdminFormChange("permissions", e.target.value)}
                  placeholder="e.g. rides:read, riders:write"
                />
              </label>
              <button
                type="button"
                className="button"
                disabled={isCreating || !adminForm.fullName || !adminForm.phoneE164}
                onClick={onCreateAdmin}
              >
                {isCreating ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </article>

          {/* Promote passenger */}
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Promote Passenger</h3><p>Elevate an existing user to admin.</p></div>
            </div>
            <div className="admin-form">
              <label>
                Passenger User ID
                <select
                  className="admin-input"
                  value={promoteForm.passengerUserId}
                  onChange={(e) => onPromoteFormChange("passengerUserId", e.target.value)}
                >
                  <option value="">Select a passenger...</option>
                  {eligiblePassengers.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.user.fullName} ({p.user.phoneE164})
                    </option>
                  ))}
                </select>
              </label>
              {selectedPassenger && (
                <div className="admin-promote-preview">
                  <strong>{selectedPassenger.user.fullName}</strong>
                  <small>{selectedPassenger.user.phoneE164} · {selectedPassenger.user.email}</small>
                </div>
              )}
              <label>
                New Email (optional)
                <input
                  type="email"
                  className="admin-input"
                  value={promoteForm.email}
                  onChange={(e) => onPromoteFormChange("email", e.target.value)}
                  placeholder="Admin email"
                />
              </label>
              <label>
                New Password
                <input
                  type="password"
                  className="admin-input"
                  value={promoteForm.password}
                  onChange={(e) => onPromoteFormChange("password", e.target.value)}
                  placeholder="New admin password"
                />
              </label>
              <label>
                Title
                <input
                  type="text"
                  className="admin-input"
                  value={promoteForm.title}
                  onChange={(e) => onPromoteFormChange("title", e.target.value)}
                  placeholder="e.g. Finance Officer"
                />
              </label>
              <label>
                Permissions (comma-separated)
                <input
                  type="text"
                  className="admin-input"
                  value={promoteForm.permissions}
                  onChange={(e) => onPromoteFormChange("permissions", e.target.value)}
                  placeholder="e.g. finance:read"
                />
              </label>
              <button
                type="button"
                className="button"
                disabled={isPromoting || !promoteForm.passengerUserId || !promoteForm.password}
                onClick={onPromotePassenger}
              >
                {isPromoting ? "Promoting..." : "Promote to Admin"}
              </button>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
