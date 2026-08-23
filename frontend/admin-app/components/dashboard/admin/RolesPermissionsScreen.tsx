"use client";

import React from "react";
import { AdminAccountRecord } from "./types";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { formatDateTime } from "./utils";
import { useAdminToast } from "./AdminToast";

type AdminRoleEntry = [string, string[]];
import {
  Shield,
  ShieldCheck,
  Users,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  Key,
  Lock,
} from "lucide-react";

interface RolesPermissionsScreenProps {
  adminAccounts: AdminAccountRecord[];
  adminRoleEntries: AdminRoleEntry[];
  dataLoading?: boolean;
  onDeleteAdmin?: (userId: string) => void;
  onReassignAdmin?: (userId: string) => void;
}

const SAMPLE_ROLES = [
  "super_admin",
  "admin",
  "support_agent",
  "finance_viewer",
  "operations_manager",
] as const;

const PERMISSION_CATEGORIES = [
  "dashboard",
  "rides",
  "deliveries",
  "riders",
  "passengers",
  "finance",
  "promotions",
  "support",
  "settings",
  "admins",
] as const;

const PERMISSION_MATRIX: Record<string, Record<string, boolean>> = {
  super_admin: {
    dashboard: true,
    rides: true,
    deliveries: true,
    riders: true,
    passengers: true,
    finance: true,
    promotions: true,
    support: true,
    settings: true,
    admins: true,
  },
  admin: {
    dashboard: true,
    rides: true,
    deliveries: true,
    riders: true,
    passengers: true,
    finance: true,
    promotions: true,
    support: true,
    settings: false,
    admins: false,
  },
  support_agent: {
    dashboard: true,
    rides: true,
    deliveries: false,
    riders: true,
    passengers: true,
    finance: false,
    promotions: false,
    support: true,
    settings: false,
    admins: false,
  },
  finance_viewer: {
    dashboard: true,
    rides: false,
    deliveries: false,
    riders: false,
    passengers: false,
    finance: true,
    promotions: false,
    support: false,
    settings: false,
    admins: false,
  },
  operations_manager: {
    dashboard: true,
    rides: true,
    deliveries: true,
    riders: true,
    passengers: true,
    finance: true,
    promotions: true,
    support: false,
    settings: false,
    admins: false,
  },
};

export function RolesPermissionsScreen({
  adminAccounts,
  adminRoleEntries,
  dataLoading = false,
  onDeleteAdmin,
  onReassignAdmin,
}: RolesPermissionsScreenProps) {
  const [activeTab, setActiveTab] = React.useState<string>("roles");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [showRoleForm, setShowRoleForm] = React.useState(false);
  const { addToast } = useAdminToast();

  const roleCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    adminRoleEntries.forEach(([role]) => {
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  }, [adminRoleEntries]);

  const totalRoles = Object.keys(roleCounts).length;
  const totalAdmins = adminAccounts.length;
  const totalPermissions = adminRoleEntries.reduce((sum, [, perms]) => {
    return sum + (perms?.length || 0);
  }, 0);

  const filteredRoles = SAMPLE_ROLES.filter((role) =>
    role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdmins = adminAccounts.filter(
    (admin) =>
      admin.user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { key: "roles", label: "Roles", icon: Shield },
    { key: "matrix", label: "Permission Matrix", icon: Key },
    { key: "assignments", label: "Admin Assignments", icon: Users },
  ];

  const renderRolesTab = () => (
    <div className="rp-table-container">
      <table className="rp-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Admin Count</th>
            <th>Permissions</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRoles.map((role) => (
            <tr key={role}>
              <td>
                <div className="rp-role-cell">
                  <ShieldCheck className="rp-role-icon" />
                  <span className="rp-role-name">{role}</span>
                </div>
              </td>
              <td>
                <span className="rp-badge">{roleCounts[role] || 0}</span>
              </td>
              <td>
                <span className="rp-badge rp-badge-info">
                  {Object.values(PERMISSION_MATRIX[role] || {}).filter(Boolean).length}
                </span>
              </td>
              <td>
                <span className="rp-status rp-status-active">Active</span>
              </td>
              <td>
                <div className="rp-action-group">
                  <button className="rp-btn-icon" title="Edit Role" onClick={() => addToast(`Editing "${role}" — role permissions are managed through admin accounts`, "info")}>
                    <Edit3 className="rp-btn-icon-svg" />
                  </button>
                  <button
                    className="rp-btn-icon rp-btn-icon-danger"
                    title="Delete Role"
                    onClick={() => addToast(`"${role}" cannot be deleted — roles are system-defined`, "error")}
                  >
                    <Trash2 className="rp-btn-icon-svg" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filteredRoles.length === 0 && (
            <tr>
              <td colSpan={5} className="rp-empty-row">
                No roles found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMatrixTab = () => (
    <div className="rp-table-container rp-matrix-container">
      <table className="rp-table rp-matrix-table">
        <thead>
          <tr>
            <th className="rp-matrix-header">Permission</th>
            {SAMPLE_ROLES.map((role) => (
              <th key={role} className="rp-matrix-header">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_CATEGORIES.map((category) => (
            <tr key={category}>
              <td className="rp-matrix-label">
                <Lock className="rp-matrix-label-icon" />
                {category}
              </td>
              {SAMPLE_ROLES.map((role) => (
                <td key={role} className="rp-matrix-cell">
                  {PERMISSION_MATRIX[role]?.[category] ? (
                    <span className="rp-check rp-check-active">&#10003;</span>
                  ) : (
                    <span className="rp-check rp-check-inactive">&mdash;</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="rp-table-container">
      <table className="rp-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Current Role</th>
            <th>Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAdmins.map((admin) => (
            <tr key={admin.id}>
              <td>
                <div className="rp-admin-name">
                  <Users className="rp-admin-avatar" />
                  <span>{admin.user.fullName || "Unknown"}</span>
                </div>
              </td>
              <td>{admin.user.email || "—"}</td>
              <td>
                <span className="rp-badge rp-badge-role">
                  {admin.title || "unassigned"}
                </span>
              </td>
              <td>{admin.createdAt ? formatDateTime(admin.createdAt) : "—"}</td>
              <td>
                <div className="rp-action-group">
                  <button className="rp-btn-icon" title="Reassign Role" onClick={() => addToast(`Reassigning "${admin.title}" — use the Admins screen to update roles`, "info")}>
                    <Edit3 className="rp-btn-icon-svg" />
                  </button>
                  <button
                    className="rp-btn-icon rp-btn-icon-danger"
                    title="Remove"
                    onClick={() => { if (window.confirm(`Remove admin "${admin.user.fullName}"? This cannot be undone.`)) onDeleteAdmin?.(admin.user.id); }}
                  >
                    <Trash2 className="rp-btn-icon-svg" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filteredAdmins.length === 0 && (
            <tr>
              <td colSpan={5} className="rp-empty-row">
                No admin accounts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="exact-admin-screen rp-screen">
      <AdminPageHeader
        title="Roles & Permissions"
        subtitle="Manage admin roles and permission matrix"
      />

      <div className="rp-kpi-row">
        <div className="rp-kpi-card">
          <div className="rp-kpi-icon rp-kpi-icon-roles">
            <ShieldCheck className="rp-kpi-icon-svg" />
          </div>
          <div className="rp-kpi-content">
            <span className="rp-kpi-value">{totalRoles}</span>
            <span className="rp-kpi-label">Total Roles</span>
          </div>
        </div>
        <div className="rp-kpi-card">
          <div className="rp-kpi-icon rp-kpi-icon-admins">
            <Users className="rp-kpi-icon-svg" />
          </div>
          <div className="rp-kpi-content">
            <span className="rp-kpi-value">{totalAdmins}</span>
            <span className="rp-kpi-label">Total Admins</span>
          </div>
        </div>
        <div className="rp-kpi-card">
          <div className="rp-kpi-icon rp-kpi-icon-perms">
            <Key className="rp-kpi-icon-svg" />
          </div>
          <div className="rp-kpi-content">
            <span className="rp-kpi-value">{totalPermissions}</span>
            <span className="rp-kpi-label">Permissions Assigned</span>
          </div>
        </div>
      </div>

      <div className="rp-toolbar">
        <div className="rp-search">
          <Search className="rp-search-icon" />
          <input
            type="text"
            className="rp-search-input"
            placeholder="Search roles or admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="rp-search-clear"
              onClick={() => setSearchQuery("")}
            >
              <X className="rp-search-clear-icon" />
            </button>
          )}
        </div>
        <button className="admin-btn-primary" onClick={() => addToast("Roles are defined by permission sets — use the Admins screen to create or promote accounts", "info")}>
          <Plus size={14} />
          <span>Add Role</span>
        </button>
      </div>

      <div className="rp-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rp-tab ${activeTab === tab.key ? "rp-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="rp-tab-icon" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="rp-tab-content">
        {dataLoading ? (
          <div className="rp-loading">
            <div className="rp-spinner" />
            <span>Loading roles and permissions...</span>
          </div>
        ) : (
          <>
            {activeTab === "roles" && renderRolesTab()}
            {activeTab === "matrix" && renderMatrixTab()}
            {activeTab === "assignments" && renderAssignmentsTab()}
          </>
        )}
      </div>

      <style>{`
        .rp-screen {
          padding: 24px;
          color: var(--text-primary);
        }

        .rp-kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .rp-kpi-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          border-radius: 12px;
          padding: 20px;
        }

        .rp-kpi-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rp-kpi-icon-roles {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }

        .rp-kpi-icon-admins {
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
        }

        .rp-kpi-icon-perms {
          background: rgba(168, 85, 247, 0.12);
          color: #a855f7;
        }

        .rp-kpi-icon-svg {
          width: 24px;
          height: 24px;
        }

        .rp-kpi-content {
          display: flex;
          flex-direction: column;
        }

        .rp-kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.2;
        }

        .rp-kpi-label {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .rp-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
        }

        .rp-search {
          display: flex;
          align-items: center;
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          border-radius: 8px;
          padding: 0 12px;
          flex: 1;
          max-width: 400px;
        }

        .rp-search-icon {
          width: 18px;
          height: 18px;
          color: #64748b;
          flex-shrink: 0;
        }

        .rp-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #e2e8f0;
          padding: 10px 10px;
          font-size: 14px;
        }

        .rp-search-input::placeholder {
          color: #64748b;
        }

        .rp-search-clear {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #64748b;
          display: flex;
          align-items: center;
        }

        .rp-search-clear:hover {
          color: #94a3b8;
        }

        .rp-search-clear-icon {
          width: 16px;
          height: 16px;
        }

        .rp-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .rp-btn-primary:hover {
          background: #2563eb;
        }

        .rp-btn-primary svg {
          width: 16px;
          height: 16px;
        }

        .rp-tabs {
          display: flex;
          gap: 4px;
          background: #1a1d27;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 20px;
          border: 1px solid #2a2d3a;
        }

        .rp-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .rp-tab:hover {
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.04);
        }

        .rp-tab-active {
          background: #2563eb;
          color: #fff;
        }

        .rp-tab-active:hover {
          background: #2563eb;
          color: #fff;
        }

        .rp-tab-icon {
          width: 16px;
          height: 16px;
        }

        .rp-tab-content {
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          border-radius: 12px;
          padding: 24px;
          min-height: 400px;
        }

        .rp-table-container {
          overflow-x: auto;
        }

        .rp-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rp-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #2a2d3a;
        }

        .rp-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid #1e2030;
          color: #cbd5e1;
        }

        .rp-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .rp-table tbody tr:last-child td {
          border-bottom: none;
        }

        .rp-role-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rp-role-icon {
          width: 18px;
          height: 18px;
          color: #22c55e;
        }

        .rp-role-name {
          font-weight: 600;
          color: #f1f5f9;
        }

        .rp-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
        }

        .rp-badge-info {
          background: rgba(168, 85, 247, 0.12);
          color: #a855f7;
        }

        .rp-badge-role {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }

        .rp-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .rp-status-active {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }

        .rp-action-group {
          display: flex;
          gap: 6px;
        }

        .rp-btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.15s ease;
        }

        .rp-btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
        }

        .rp-btn-icon-danger:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .rp-btn-icon-svg {
          width: 16px;
          height: 16px;
        }

        .rp-empty-row {
          text-align: center;
          color: #64748b;
          padding: 40px 16px !important;
          font-style: italic;
        }

        .rp-admin-name {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          color: #f1f5f9;
        }

        .rp-admin-avatar {
          width: 18px;
          height: 18px;
          color: #3b82f6;
        }

        .rp-matrix-container {
          overflow-x: auto;
        }

        .rp-matrix-table {
          min-width: 700px;
        }

        .rp-matrix-header {
          text-align: center !important;
          font-size: 11px !important;
          padding: 12px 10px !important;
          white-space: nowrap;
        }

        .rp-matrix-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #f1f5f9;
          white-space: nowrap;
        }

        .rp-matrix-label-icon {
          width: 14px;
          height: 14px;
          color: #64748b;
        }

        .rp-matrix-cell {
          text-align: center !important;
        }

        .rp-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
        }

        .rp-check-active {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }

        .rp-check-inactive {
          background: rgba(100, 116, 139, 0.1);
          color: #475569;
        }

        .rp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 20px;
          color: #64748b;
        }

        .rp-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #2a2d3a;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: rp-spin 0.8s linear infinite;
        }

        @keyframes rp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
