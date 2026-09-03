"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, UserPlus, Check, ChevronDown } from "lucide-react";
import type { PassengerRecord } from "../types";
import { OKADAGO_PERMISSIONS, OKADAGO_ROLES } from "@/lib/permissions";
export { OKADAGO_PERMISSIONS, OKADAGO_ROLES };

export type CreateAdminModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: {
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
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function CreateAdminModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isSubmitting
}: CreateAdminModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("ops_manager");
  const [customTitle, setCustomTitle] = useState<string>(form.title || "");

  // Active permissions set
  const activePermissions = form.permissions
    ? form.permissions.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (isOpen && !form.title) {
      const defaultRole = OKADAGO_ROLES.find((r) => r.id === "ops_manager");
      if (defaultRole) {
        onChange("title", defaultRole.name);
        onChange("permissions", defaultRole.permissions.join(","));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = OKADAGO_ROLES.find((r) => r.id === roleId);
    if (!role) return;

    if (role.id === "custom") {
      onChange("title", customTitle || "Custom Staff");
    } else {
      onChange("title", role.name);
      onChange("permissions", role.permissions.join(","));
    }
  };

  const togglePermission = (permKey: string) => {
    let updated: string[];
    if (activePermissions.includes(permKey)) {
      updated = activePermissions.filter((p) => p !== permKey);
    } else {
      updated = [...activePermissions, permKey];
    }
    onChange("permissions", updated.join(","));
  };

  const toggleAllPermissions = () => {
    if (activePermissions.length === OKADAGO_PERMISSIONS.length) {
      onChange("permissions", "");
    } else {
      onChange("permissions", OKADAGO_PERMISSIONS.map((p) => p.key).join(","));
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg, #18191c)",
          border: "1px solid var(--border, #2a2b2e)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border, #2a2b2e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255,255,255,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--accent-orange-bg, rgba(234, 88, 12, 0.15))",
                color: "var(--accent-orange, #f97316)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                Create Admin Account
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted, #94a3b8)" }}>
                Grant operator credentials and select platform permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted, #94a3b8)",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* User Basic Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
                Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className="admin-input"
                value={form.fullName}
                onChange={(e) => onChange("fullName", e.target.value)}
                placeholder="e.g. Kwame Mensah"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
                Phone (E.164) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="tel"
                className="admin-input"
                value={form.phoneE164}
                onChange={(e) => onChange("phoneE164", e.target.value)}
                placeholder="+233240000000"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
                Email Address
              </label>
              <input
                type="email"
                className="admin-input"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="admin@okadago.com"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
                Account Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="password"
                className="admin-input"
                value={form.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="Set secure password"
              />
            </div>
          </div>

          {/* Role Selection Dropdown */}
          <div style={{ borderTop: "1px solid var(--border, #2a2b2e)", paddingTop: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
              Staff Role & Title Preset <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <select
                className="admin-input"
                value={selectedRoleId}
                onChange={(e) => handleRoleSelect(e.target.value)}
                style={{ width: "100%", paddingRight: 36, appearance: "none" }}
              >
                {OKADAGO_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} — {role.description}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#94a3b8"
                }}
              />
            </div>

            {selectedRoleId === "custom" && (
              <div style={{ marginTop: 10 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
                  Custom Title
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.title}
                  onChange={(e) => {
                    setCustomTitle(e.target.value);
                    onChange("title", e.target.value);
                  }}
                  placeholder="e.g. Regional Security Coordinator"
                />
              </div>
            )}
          </div>

          {/* Permissions Selection Checklist */}
          <div style={{ borderTop: "1px solid var(--border, #2a2b2e)", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  Permissions Checklist
                </label>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  {activePermissions.length} of {OKADAGO_PERMISSIONS.length} permissions granted
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAllPermissions}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border, #334155)",
                  color: "var(--accent-orange, #f97316)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                {activePermissions.length === OKADAGO_PERMISSIONS.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                maxHeight: 180,
                overflowY: "auto",
                paddingRight: 4
              }}
            >
              {OKADAGO_PERMISSIONS.map((perm) => {
                const isSelected = activePermissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    onClick={() => togglePermission(perm.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: isSelected
                        ? "1px solid var(--accent-orange, #f97316)"
                        : "1px solid var(--border, #2a2b2e)",
                      background: isSelected
                        ? "rgba(249, 115, 22, 0.08)"
                        : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: isSelected ? "none" : "1px solid #64748b",
                        background: isSelected ? "var(--accent-orange, #f97316)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff"
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "#fff" : "#cbd5e1" }}>
                        {perm.label}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        <code>{perm.key}</code> · {perm.group}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border, #2a2b2e)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            background: "rgba(0,0,0,0.2)"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid var(--border, #334155)",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !form.fullName || !form.phoneE164}
            onClick={onSubmit}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent-orange, #f97316)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: isSubmitting || !form.fullName || !form.phoneE164 ? "not-allowed" : "pointer",
              opacity: isSubmitting || !form.fullName || !form.phoneE164 ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {isSubmitting ? "Creating Admin..." : "Create Admin Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export type PromotePassengerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: {
    passengerUserId: string;
    email: string;
    password: string;
    title: string;
    permissions: string;
  };
  eligiblePassengers: PassengerRecord[];
  selectedPassenger: PassengerRecord | null;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function PromotePassengerModal({
  isOpen,
  onClose,
  form,
  eligiblePassengers,
  selectedPassenger,
  onChange,
  onSubmit,
  isSubmitting
}: PromotePassengerModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("support_lead");

  const activePermissions = form.permissions
    ? form.permissions.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (isOpen && !form.title) {
      const defaultRole = OKADAGO_ROLES.find((r) => r.id === "support_lead");
      if (defaultRole) {
        onChange("title", defaultRole.name);
        onChange("permissions", defaultRole.permissions.join(","));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = OKADAGO_ROLES.find((r) => r.id === roleId);
    if (!role) return;

    if (role.id !== "custom") {
      onChange("title", role.name);
      onChange("permissions", role.permissions.join(","));
    }
  };

  const togglePermission = (permKey: string) => {
    let updated: string[];
    if (activePermissions.includes(permKey)) {
      updated = activePermissions.filter((p) => p !== permKey);
    } else {
      updated = [...activePermissions, permKey];
    }
    onChange("permissions", updated.join(","));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg, #18191c)",
          border: "1px solid var(--border, #2a2b2e)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 580,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border, #2a2b2e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(34, 197, 94, 0.15)",
                color: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                Promote Passenger to Admin
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted, #94a3b8)" }}>
                Elevate an existing passenger user to an administrator account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted, #94a3b8)",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
              Select Eligible Passenger User <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              className="admin-input"
              value={form.passengerUserId}
              onChange={(e) => onChange("passengerUserId", e.target.value)}
            >
              <option value="">Choose a passenger user...</option>
              {eligiblePassengers.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.user.fullName} ({p.user.phoneE164})
                </option>
              ))}
            </select>
          </div>

          {selectedPassenger && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: 10
              }}
            >
              <strong style={{ display: "block", color: "#fff", fontSize: 14 }}>
                {selectedPassenger.user.fullName}
              </strong>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {selectedPassenger.user.phoneE164} · {selectedPassenger.user.email ?? "No email"}
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
                Admin Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="password"
                className="admin-input"
                value={form.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="New admin password"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
                New Admin Email (Optional)
              </label>
              <input
                type="email"
                className="admin-input"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="Optional email"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div style={{ borderTop: "1px solid var(--border, #2a2b2e)", paddingTop: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
              Staff Role Preset <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              className="admin-input"
              value={selectedRoleId}
              onChange={(e) => handleRoleSelect(e.target.value)}
            >
              {OKADAGO_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions preview */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>
              Permissions Granted ({activePermissions.length})
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {OKADAGO_PERMISSIONS.map((perm) => {
                const isSelected = activePermissions.includes(perm.key);
                return (
                  <span
                    key={perm.key}
                    onClick={() => togglePermission(perm.key)}
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: isSelected ? "1px solid #22c55e" : "1px solid #334155",
                      background: isSelected ? "rgba(34, 197, 94, 0.15)" : "transparent",
                      color: isSelected ? "#4ade80" : "#64748b",
                      cursor: "pointer"
                    }}
                  >
                    {perm.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border, #2a2b2e)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid var(--border, #334155)",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !form.passengerUserId || !form.password}
            onClick={onSubmit}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: "#22c55e",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: isSubmitting || !form.passengerUserId || !form.password ? "not-allowed" : "pointer",
              opacity: isSubmitting || !form.passengerUserId || !form.password ? 0.6 : 1
            }}
          >
            {isSubmitting ? "Promoting..." : "Promote to Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}
