"use client";

import { useState } from "react";
import { ShieldAlert, UserPlus, CheckCircle, Trash2, Plus } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { CreateAdminModal, PromotePassengerModal } from "./ui/AdminAccountModal";
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
  onDeleteAdmin?: (userId: string) => void;
  isCreating: boolean;
  isPromoting: boolean;
  isDeleting?: boolean;
  dataLoading?: boolean;
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
  onDeleteAdmin,
  isCreating,
  isPromoting,
  isDeleting = false,
  dataLoading = false
}: AdminsScreenProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  if (dataLoading) {
    return <AdminPageSkeleton variant="form" kpis={3} rows={6} />;
  }

  const handleCreateSubmit = () => {
    onCreateAdmin();
    setIsCreateModalOpen(false);
  };

  const handlePromoteSubmit = () => {
    onPromotePassenger();
    setIsPromoteModalOpen(false);
  };

  return (
    <div className="exact-admin-screen">
      {/* Header with Modal Trigger Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <AdminPageHeader
          title="Staff & Admins"
          subtitle="Create, promote, and manage OkadaGo Accra operator accounts and role permissions."
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            type="button"
            className="button"
            onClick={() => setIsPromoteModalOpen(true)}
            style={{
              background: "var(--bg-subtle, #222326)",
              border: "1px solid var(--border, #334155)",
              color: "#e2e8f0",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              cursor: "pointer"
            }}
          >
            <UserPlus size={16} />
            Promote Passenger
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              background: "var(--accent-orange, #f97316)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer"
            }}
          >
            <Plus size={18} />
            Create Admin Account
          </button>
        </div>
      </div>

      <AdminKpiRow
        items={[
          {
            label: "Admin Accounts",
            value: adminAccounts.length,
            hint: "Active operators",
            icon: <ShieldAlert size={18} />,
            tone: "yellow",
          },
          {
            label: "Eligible Passengers",
            value: eligiblePassengers.length,
            hint: "Can be promoted",
            icon: <UserPlus size={18} />,
            tone: "green",
          },
          {
            label: "Permission Roles",
            value: adminRoleEntries.length || 6,
            hint: "Defined templates",
            icon: <ShieldAlert size={18} />,
            tone: "yellow",
          },
          {
            label: "Active Admins",
            value: adminAccounts.filter((a) => a.user.accountStatus?.toLowerCase() === "active").length,
            hint: "Currently active",
            icon: <CheckCircle size={18} />,
            tone: "green",
          },
        ]}
      />

      {/* Main Admin Accounts Table */}
      <article className="admin-reference-card" style={{ marginTop: 20 }}>
        <div className="admin-reference-cardhead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Admin Accounts Directory</h3>
            <p style={{ margin: "2px 0 0" }}>All current Accra administrators and staff accounts on OkadaGo.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--accent-orange, #f97316)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Plus size={15} /> Add New Admin
            </button>
          </div>
        </div>

        {adminAccounts.length === 0 ? (
          <EmptyCard
            title="No admin accounts found."
            body="Click 'Create Admin Account' above to set up the first administrator."
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title / Role</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Permissions</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminAccounts.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <strong>{admin.user.fullName}</strong>
                    </td>
                    <td>
                      <small style={{ fontWeight: 600, color: "#e2e8f0" }}>{admin.title ?? "Administrator"}</small>
                    </td>
                    <td>
                      <small>{admin.user.phoneE164}</small>
                    </td>
                    <td>
                      <small>{admin.user.email ?? "—"}</small>
                    </td>
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
                    <td>
                      <small>{formatDateTime(admin.createdAt)}</small>
                    </td>
                    <td>
                      {onDeleteAdmin ? (
                        <button
                          type="button"
                          className="settings-btn settings-btn--ghost"
                          disabled={isDeleting}
                          title="Soft-delete admin account"
                          onClick={() => {
                            if (window.confirm(`Delete admin account for ${admin.user.fullName}? This revokes their access.`)) {
                              onDeleteAdmin(admin.user.id);
                            }
                          }}
                        >
                          <Trash2 size={14} style={{ color: "#ef4444" }} />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* Create Admin Modal Popup */}
      <CreateAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        form={adminForm}
        onChange={onAdminFormChange}
        onSubmit={handleCreateSubmit}
        isSubmitting={isCreating}
      />

      {/* Promote Passenger Modal Popup */}
      <PromotePassengerModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        form={promoteForm}
        eligiblePassengers={eligiblePassengers}
        selectedPassenger={selectedPassenger}
        onChange={onPromoteFormChange}
        onSubmit={handlePromoteSubmit}
        isSubmitting={isPromoting}
      />
    </div>
  );
}
