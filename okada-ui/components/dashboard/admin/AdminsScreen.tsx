"use client";

import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type {
  AdminAccountRecord,
  AdminPermissionsRecord,
  PassengerRecord
} from "./types";

type AdminForm = {
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

type PromoteForm = {
  passengerUserId: string;
  email: string;
  password: string;
  title: string;
  permissions: string;
};

type AdminsScreenProps = {
  screenMeta: { eyebrow: string; title: string; description: string };
  adminAccountsQuery: UseQueryResult<AdminAccountRecord[], Error>;
  adminPermissionsQuery: UseQueryResult<AdminPermissionsRecord, Error>;
  adminRoleEntries: [string, string[]][];
  rolePermissionSnapshot: [string, string[]][];
  adminTitleSnapshot: [string, number][];
  eligiblePassengers: PassengerRecord[];
  selectedPassenger: PassengerRecord | null;
  adminForm: AdminForm;
  setAdminForm: React.Dispatch<React.SetStateAction<AdminForm>>;
  promoteForm: PromoteForm;
  setPromoteForm: React.Dispatch<React.SetStateAction<PromoteForm>>;
  createAdminMutation: UseMutationResult<unknown, Error, void>;
  promotePassengerMutation: UseMutationResult<unknown, Error, void>;
};

export function AdminsScreen({
  screenMeta,
  adminAccountsQuery,
  adminPermissionsQuery,
  adminRoleEntries,
  rolePermissionSnapshot,
  adminTitleSnapshot,
  eligiblePassengers,
  selectedPassenger,
  adminForm,
  setAdminForm,
  promoteForm,
  setPromoteForm,
  createAdminMutation,
  promotePassengerMutation
}: AdminsScreenProps) {
  return (
    <>
      <section className="exact-admin-section">
        <div className="exact-admin-heading">
          <p className="exact-admin-eyebrow">{screenMeta.eyebrow}</p>
          <h1>{screenMeta.title}</h1>
          <p>{screenMeta.description}</p>
        </div>

        <div className="exact-admin-kpis">
          <article className="exact-admin-kpi">
            <span>Total admins</span>
            <strong>{adminAccountsQuery.data?.length ?? 0}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Named titles</span>
            <strong>{(adminAccountsQuery.data ?? []).filter((admin) => Boolean(admin.title)).length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>With email</span>
            <strong>{(adminAccountsQuery.data ?? []).filter((admin) => Boolean(admin.user.email)).length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Active accounts</span>
            <strong>
              {(adminAccountsQuery.data ?? []).filter(
                (admin) => admin.user.accountStatus === "active"
              ).length}
            </strong>
          </article>
        </div>
      </section>

      <div className="exact-admin-grid">
        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Access governance</h3>
              <p>Who currently holds operational access and how broadly those permissions are distributed.</p>
            </div>
          </div>
          <div className="exact-admin-priority-grid">
            <article className="exact-admin-priority-card">
              <span>Eligible passenger pool</span>
              <strong>{eligiblePassengers.length}</strong>
              <small>Passenger accounts that can still be promoted into admin operators.</small>
            </article>
            <article className="exact-admin-priority-card">
              <span>Permission families</span>
              <strong>{adminRoleEntries.length}</strong>
              <small>Distinct role families currently emitted by the backend access model.</small>
            </article>
            <article className="exact-admin-priority-card">
              <span>Most common admin title</span>
              <strong>{adminTitleSnapshot[0]?.[0] ?? "No titles yet"}</strong>
              <small>
                The title appearing most often across active admin accounts in this workspace.
              </small>
            </article>
          </div>
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Role footprint</h3>
              <p>Quick view of which permission families currently carry the heaviest access load.</p>
            </div>
          </div>
          {adminPermissionsQuery.isLoading ? (
            <div className="status-chip warning">Loading permissions</div>
          ) : adminPermissionsQuery.isError ? (
            <EmptyCard title="Could not load permissions." body={adminPermissionsQuery.error.message} />
          ) : rolePermissionSnapshot.length === 0 ? (
            <EmptyCard
              title="No permission families found."
              body="Permission families will surface here once the backend reports them."
            />
          ) : (
            <ul className="workbench-list exact-admin-ride-feed">
              {rolePermissionSnapshot.map(([role, permissions]) => (
                <li key={role}>
                  <span>{role}</span>
                  <strong>{permissions.length} permissions</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="exact-admin-grid">
        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Create admin account</h3>
              <p>Only authenticated admins can create another admin from this page.</p>
            </div>
          </div>

          <div className="two-up">
            <div className="field-group">
              <label className="field-label">Full name</label>
              <input
                className="input"
                value={adminForm.fullName}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, fullName: event.target.value }))
                }
                placeholder="Admin full name"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input
                className="input"
                value={adminForm.email}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="admin@okadago.com"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Phone country code</label>
              <input
                className="input"
                value={adminForm.phoneCountryCode}
                onChange={(event) =>
                  setAdminForm((current) => ({
                    ...current,
                    phoneCountryCode: event.target.value
                  }))
                }
                placeholder="+233"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Phone local</label>
              <input
                className="input"
                value={adminForm.phoneLocal}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, phoneLocal: event.target.value }))
                }
                placeholder="24XXXXXXX"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Phone E.164</label>
              <input
                className="input"
                value={adminForm.phoneE164}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, phoneE164: event.target.value }))
                }
                placeholder="+23324XXXXXXX"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Preferred currency</label>
              <select
                className="select"
                value={adminForm.preferredCurrency}
                onChange={(event) =>
                  setAdminForm((current) => ({
                    ...current,
                    preferredCurrency: event.target.value
                  }))
                }
              >
                <option value="GHS">GHS</option>
                <option value="NGN">NGN</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Title</label>
              <input
                className="input"
                value={adminForm.title}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Operations Lead"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input
                className="input"
                type="password"
                value={adminForm.password}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Create a strong password"
              />
            </div>
          </div>

          <div className="field-group admin-form-block">
            <label className="field-label">Permissions</label>
            <textarea
              className="textarea"
              value={adminForm.permissions}
              onChange={(event) =>
                setAdminForm((current) => ({ ...current, permissions: event.target.value }))
              }
              placeholder="users:manage:any, analytics:read:any"
            />
          </div>

          <div className="button-row admin-form-actions">
            <button
              className="button"
              type="button"
              onClick={() => createAdminMutation.mutate()}
              disabled={createAdminMutation.isPending}
            >
              {createAdminMutation.isPending ? "Creating..." : "Create admin"}
            </button>
          </div>

          {createAdminMutation.isError ? (
            <div className="empty-state admin-form-feedback">
              <strong>Admin creation failed.</strong>
              <p>{createAdminMutation.error.message}</p>
            </div>
          ) : null}

          {createAdminMutation.isSuccess ? (
            <div className="status-chip success admin-form-feedback-chip">Admin account created</div>
          ) : null}
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Promote passenger to admin</h3>
              <p>Upgrade an existing passenger account and keep the same person record in the system.</p>
            </div>
          </div>

          <div className="two-up">
            <div className="field-group">
              <label className="field-label">Passenger account</label>
              <select
                className="select"
                value={promoteForm.passengerUserId}
                onChange={(event) => {
                  const passenger =
                    eligiblePassengers.find((item) => item.userId === event.target.value) ?? null;

                  setPromoteForm((current) => ({
                    ...current,
                    passengerUserId: event.target.value,
                    email: passenger?.user.email ?? current.email,
                    title: current.title
                  }));
                }}
              >
                <option value="">Select passenger</option>
                {eligiblePassengers.map((passenger) => (
                  <option key={passenger.userId} value={passenger.userId}>
                    {passenger.user.fullName} - {passenger.user.phoneE164}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Admin email</label>
              <input
                className="input"
                value={promoteForm.email}
                onChange={(event) =>
                  setPromoteForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="admin@okadago.com"
              />
            </div>

            <div className="field-group">
              <label className="field-label">New admin password</label>
              <input
                className="input"
                type="password"
                value={promoteForm.password}
                onChange={(event) =>
                  setPromoteForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Set a fresh admin password"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Admin title</label>
              <input
                className="input"
                value={promoteForm.title}
                onChange={(event) =>
                  setPromoteForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Support Supervisor"
              />
            </div>
          </div>

          {selectedPassenger ? (
            <div className="admin-promote-summary">
              <strong>{selectedPassenger.user.fullName}</strong>
              <span>{selectedPassenger.user.phoneE164}</span>
              <span>{selectedPassenger.defaultServiceCity ?? "No default city"}</span>
              <span>{selectedPassenger.referralCode}</span>
            </div>
          ) : null}

          <div className="field-group admin-form-block">
            <label className="field-label">Permissions</label>
            <textarea
              className="textarea"
              value={promoteForm.permissions}
              onChange={(event) =>
                setPromoteForm((current) => ({ ...current, permissions: event.target.value }))
              }
              placeholder="users:manage:any, analytics:read:any"
            />
          </div>

          <div className="button-row admin-form-actions">
            <button
              className="button"
              type="button"
              onClick={() => promotePassengerMutation.mutate()}
              disabled={promotePassengerMutation.isPending || !promoteForm.passengerUserId}
            >
              {promotePassengerMutation.isPending ? "Promoting..." : "Promote passenger"}
            </button>
          </div>

          {promotePassengerMutation.isError ? (
            <div className="empty-state admin-form-feedback">
              <strong>Passenger promotion failed.</strong>
              <p>{promotePassengerMutation.error.message}</p>
            </div>
          ) : null}

          {promotePassengerMutation.isSuccess ? (
            <div className="status-chip success admin-form-feedback-chip">
              Passenger promoted to admin
            </div>
          ) : null}
        </section>
      </div>

      <div className="exact-admin-grid">
        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Existing admins</h3>
              <p>Admin accounts currently available in the workspace.</p>
            </div>
          </div>
          {adminAccountsQuery.isLoading ? (
            <div className="status-chip warning">Loading admin accounts</div>
          ) : adminAccountsQuery.isError ? (
            <EmptyCard
              title="Could not load admins."
              body={adminAccountsQuery.error.message}
            />
          ) : (adminAccountsQuery.data ?? []).length === 0 ? (
            <EmptyCard
              title="No admin accounts found."
              body="Create the next admin account from the form on this page."
            />
          ) : (
            <ul className="workbench-list">
              {(adminAccountsQuery.data ?? []).map((admin) => (
                <li key={admin.id}>
                  <span>
                    {admin.user.fullName}
                    {admin.title ? ` - ${admin.title}` : ""}
                  </span>
                  <strong>{admin.user.email ?? admin.user.phoneE164}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Admin title mix</h3>
              <p>Titles in use across the current operator base.</p>
            </div>
          </div>
          {adminAccountsQuery.isLoading ? (
            <div className="status-chip warning">Loading title mix</div>
          ) : adminAccountsQuery.isError ? (
            <EmptyCard title="Could not load title mix." body={adminAccountsQuery.error.message} />
          ) : adminTitleSnapshot.length === 0 ? (
            <EmptyCard
              title="No admin titles yet."
              body="Admin titles will be grouped here once accounts are created with role labels."
            />
          ) : (
            <ul className="workbench-list exact-admin-ride-feed">
              {adminTitleSnapshot.map(([title, count]) => (
                <li key={title}>
                  <span>{title}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
