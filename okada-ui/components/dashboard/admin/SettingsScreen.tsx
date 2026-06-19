"use client";

import { UseQueryResult } from "@tanstack/react-query";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type {
  AdminAccountRecord,
  AdminModulesRecord,
  AdminPermissionsRecord,
  ServiceZoneRecord
} from "./types";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

type SettingsScreenProps = {
  screenMeta: { eyebrow: string; title: string; description: string };
  zones: ServiceZoneRecord[];
  adminRoleEntries: [string, string[]][];
  adminModules: string[];
  rolePermissionSnapshot: [string, string[]][];
  adminCurrency: string;
  adminAccountsQuery: UseQueryResult<AdminAccountRecord[], Error>;
  adminPermissionsQuery: UseQueryResult<AdminPermissionsRecord, Error>;
  adminModulesQuery: UseQueryResult<AdminModulesRecord, Error>;
};

export function SettingsScreen({
  screenMeta,
  zones,
  adminRoleEntries,
  adminModules,
  rolePermissionSnapshot,
  adminCurrency,
  adminAccountsQuery,
  adminPermissionsQuery,
  adminModulesQuery
}: SettingsScreenProps) {
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
            <span>Total zones</span>
            <strong>{zones.length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Active zones</span>
            <strong>{zones.filter((zone) => zone.isActive).length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Role permissions</span>
            <strong>{adminRoleEntries.reduce((sum, [, permissions]) => sum + permissions.length, 0)}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Platform modules</span>
            <strong>{adminModules.length}</strong>
          </article>
        </div>
      </section>

      <div className="exact-admin-grid">
        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Control priorities</h3>
              <p>Platform rules that need the fastest admin attention across pricing, supply, and access.</p>
            </div>
          </div>
          <div className="exact-admin-priority-grid">
            <article className="exact-admin-priority-card">
              <span>Inactive zones</span>
              <strong>{zones.filter((zone) => !zone.isActive).length}</strong>
              <small>Service zones that are currently out of rotation and may need review.</small>
            </article>
            <article className="exact-admin-priority-card">
              <span>Average base fare</span>
              <strong>
                {formatMoney(
                  adminCurrency,
                  zones.length === 0
                    ? 0
                    : zones.reduce((sum, zone) => sum + parseNumber(zone.baseFare), 0) / zones.length
                )}
              </strong>
              <small>The current average launch price across all configured service zones.</small>
            </article>
            <article className="exact-admin-priority-card">
              <span>Largest permission set</span>
              <strong>{rolePermissionSnapshot[0]?.[1].length ?? 0}</strong>
              <small>
                Most expansive role currently exposed by the backend permission service.
              </small>
            </article>
          </div>
        </section>

        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Service zone pricing</h3>
              <p>Live pricing and service configuration coming directly from backend service zones.</p>
            </div>
          </div>
          {zones.length === 0 ? (
            <EmptyCard
              title="No service zones configured."
              body="Once service zones exist, their pricing and operating status will appear here."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Status</th>
                    <th>Base fare</th>
                    <th>Per km</th>
                    <th>Per min</th>
                    <th>Min fare</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id}>
                      <td>
                        <strong>{zone.name}</strong>
                        <div>{zone.city}</div>
                      </td>
                      <td>
                        <span className={`status-chip ${zone.isActive ? "success" : "neutral"}`}>
                          {zone.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{formatMoney(zone.currency, zone.baseFare)}</td>
                      <td>{formatMoney(zone.currency, zone.perKmFee)}</td>
                      <td>{formatMoney(zone.currency, zone.perMinuteFee)}</td>
                      <td>{formatMoney(zone.currency, zone.minimumFare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Role permissions</h3>
              <p>Current permission groups exposed by the backend admin service.</p>
            </div>
          </div>
          {adminPermissionsQuery.isLoading ? (
            <div className="status-chip warning">Loading permissions</div>
          ) : adminPermissionsQuery.isError ? (
            <EmptyCard title="Could not load permissions." body={adminPermissionsQuery.error.message} />
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

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Platform modules</h3>
              <p>Backend-declared operational modules available to the admin workspace.</p>
            </div>
          </div>
          {adminModulesQuery.isLoading ? (
            <div className="status-chip warning">Loading modules</div>
          ) : adminModulesQuery.isError ? (
            <EmptyCard title="Could not load modules." body={adminModulesQuery.error.message} />
          ) : adminModules.length === 0 ? (
            <EmptyCard title="No modules reported." body="The backend did not return any platform modules." />
          ) : (
            <ul className="workbench-list exact-admin-ride-feed">
              {adminModules.map((module) => (
                <li key={module}>
                  <span>{module.replaceAll("-", " ")}</span>
                  <strong>Live</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Admin access model</h3>
              <p>The active admin accounts currently controlling this workspace.</p>
            </div>
          </div>
          {adminAccountsQuery.isLoading ? (
            <div className="status-chip warning">Loading admin accounts</div>
          ) : adminAccountsQuery.isError ? (
            <EmptyCard title="Could not load admin accounts." body={adminAccountsQuery.error.message} />
          ) : (
            <ul className="workbench-list exact-admin-ride-feed">
              {(adminAccountsQuery.data ?? []).slice(0, 6).map((admin) => (
                <li key={admin.id}>
                  <span>
                    {admin.user.fullName}
                    {admin.title ? ` - ${admin.title}` : ""}
                  </span>
                  <strong>{admin.user.accountStatus}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
