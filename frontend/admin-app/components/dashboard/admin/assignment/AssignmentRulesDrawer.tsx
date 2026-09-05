"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Save,
  Shield,
  MapPin,
  Clock,
  Star,
  RotateCcw
} from "lucide-react";
import type { AssignmentRuleItem, UseMutationResult } from "./types";

export type AssignmentRulesDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  rules: AssignmentRuleItem[];
  isLoading?: boolean;
  createRuleMutation?: UseMutationResult;
  updateRuleMutation?: UseMutationResult;
  deleteRuleMutation?: UseMutationResult;
  zones?: Array<{ id: string; name: string; city: string }>;
};

export function AssignmentRulesDrawer({
  isOpen,
  onClose,
  rules = [],
  isLoading = false,
  createRuleMutation,
  updateRuleMutation,
  deleteRuleMutation,
  zones = []
}: AssignmentRulesDrawerProps) {
  // Selected rule to edit (defaults to first rule)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for rule editing
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [weightProximity, setWeightProximity] = useState(35);
  const [weightEta, setWeightEta] = useState(25);
  const [weightRating, setWeightRating] = useState(20);
  const [weightAcceptance, setWeightAcceptance] = useState(15);
  const [cancellationPenalty, setCancellationPenalty] = useState(15);
  const [maxPickupRadiusKm, setMaxPickupRadiusKm] = useState(5);
  const [maxEtaMinutes, setMaxEtaMinutes] = useState(15);
  const [minRating, setMinRating] = useState(4.0);
  const [minAcceptanceRate, setMinAcceptanceRate] = useState(60);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [autoAssignDelayMs, setAutoAssignDelayMs] = useState(5000);
  const [zoneId, setZoneId] = useState<string>("all");

  // Sync state when selected rule changes
  useEffect(() => {
    if (isCreatingNew) {
      setName("Custom Zone Dispatch Rule");
      setDescription("Automated dispatch configuration for zone");
      setEnabled(true);
      setWeightProximity(35);
      setWeightEta(25);
      setWeightRating(20);
      setWeightAcceptance(15);
      setCancellationPenalty(15);
      setMaxPickupRadiusKm(5);
      setMaxEtaMinutes(15);
      setMinRating(4.0);
      setMinAcceptanceRate(60);
      setAutoAssignEnabled(true);
      setAutoAssignDelayMs(5000);
      setZoneId(zones[0]?.id || "all");
      return;
    }

    const current = rules.find((r) => r.id === selectedRuleId) || rules[0];
    if (current) {
      if (!selectedRuleId) setSelectedRuleId(current.id);
      setName(current.name || "");
      setDescription(current.description || "");
      setEnabled(current.enabled ?? true);
      setWeightProximity(current.weightProximity ?? 35);
      setWeightEta(current.weightEta ?? 25);
      setWeightRating(current.weightRating ?? 20);
      setWeightAcceptance(current.weightAcceptance ?? 15);
      setCancellationPenalty(current.cancellationPenalty ?? 15);
      setMaxPickupRadiusKm(current.maxPickupRadiusKm ?? 5);
      setMaxEtaMinutes(current.maxEtaMinutes ?? 15);
      setMinRating(current.minRating ?? 4.0);
      setMinAcceptanceRate(current.minAcceptanceRate ?? 60);
      setAutoAssignEnabled(current.autoAssignEnabled ?? true);
      setAutoAssignDelayMs(current.autoAssignDelayMs ?? 5000);
      setZoneId(current.zoneId || "all");
    }
  }, [selectedRuleId, rules, isCreatingNew, zones]);

  if (!isOpen) return null;

  const totalWeight = weightProximity + weightEta + weightRating + weightAcceptance;
  const isSaving = createRuleMutation?.isPending || updateRuleMutation?.isPending;

  const handleSave = () => {
    const payload = {
      name,
      description,
      enabled,
      weightProximity,
      weightEta,
      weightRating,
      weightAcceptance,
      cancellationPenalty,
      maxPickupRadiusKm,
      maxEtaMinutes,
      minRating,
      minAcceptanceRate,
      autoAssignEnabled,
      autoAssignDelayMs,
      zoneId: zoneId === "all" ? null : zoneId
    };

    if (isCreatingNew) {
      createRuleMutation?.mutate(payload, {
        onSuccess: () => {
          setIsCreatingNew(false);
        }
      });
    } else if (selectedRuleId) {
      updateRuleMutation?.mutate({ ruleId: selectedRuleId, ...payload });
    }
  };

  const handleDelete = (ruleId: string) => {
    if (window.confirm("Are you sure you want to delete this assignment rule?")) {
      deleteRuleMutation?.mutate({ ruleId });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          transition: "opacity 0.2s ease"
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "560px",
          background: "var(--card-bg, #0d1220)",
          borderLeft: "1px solid var(--border-color, #1a2235)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.6)",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(15, 23, 42, 0.6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                Dispatch Rules & Algorithm Controls
              </h2>
              <span style={{ fontSize: "0.74rem", color: "#64748B" }}>
                Section 5: Real-time weighting & auto-dispatch settings
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              color: "#94A3B8",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Rule Selector / Tabs */}
        <div
          style={{
            padding: "12px 24px",
            background: "rgba(15, 23, 42, 0.4)",
            borderBottom: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto"
          }}
        >
          {rules.map((r) => {
            const isSelected = !isCreatingNew && (r.id === selectedRuleId || (!selectedRuleId && r === rules[0]));
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setSelectedRuleId(r.id);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: isSelected ? "#10B981" : "rgba(255, 255, 255, 0.05)",
                  color: isSelected ? "#FFFFFF" : "#94A3B8",
                  border: isSelected ? "none" : "1px solid var(--border-color, #1a2235)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>{r.name || "Default Rule"}</span>
                {r.zone && (
                  <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>({r.zone.name})</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: isCreatingNew ? "#10B981" : "rgba(255, 255, 255, 0.05)",
              color: isCreatingNew ? "#FFFFFF" : "#10B981",
              border: "1px dashed rgba(16, 185, 129, 0.4)",
              fontSize: "0.75rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <Plus size={13} />
            Add Rule
          </button>
        </div>

        {/* Form Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          {/* Rule Name & Zone selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#CBD5E1" }}>
                Rule Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid var(--border-color, #1a2235)",
                  color: "#F8FAFC",
                  fontSize: "0.8rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#CBD5E1" }}>
                Target Zone
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid var(--border-color, #1a2235)",
                  color: "#F8FAFC",
                  fontSize: "0.8rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Zones (Global Default)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Toggles: Auto-Assign Enabled & Rule Enabled */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              padding: "14px",
              background: "rgba(15, 23, 42, 0.4)",
              borderRadius: "12px",
              border: "1px solid var(--border-color, #1a2235)"
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#E2E8F0",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={autoAssignEnabled}
                onChange={(e) => setAutoAssignEnabled(e.target.checked)}
                style={{ accentColor: "#10B981", width: 16, height: 16 }}
              />
              <span>Auto-Assign Enabled</span>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#E2E8F0",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{ accentColor: "#10B981", width: 16, height: 16 }}
              />
              <span>Rule Active</span>
            </label>
          </div>

          {/* 11-Factor Weighting Preferences */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "rgba(15, 23, 42, 0.3)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color, #1a2235)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#10B981", textTransform: "uppercase" }}>
                Score Weighting Preferences
              </span>
              <span style={{ fontSize: "0.72rem", color: totalWeight === 100 ? "#10B981" : "#F59E0B" }}>
                Total: {totalWeight}% {totalWeight !== 100 ? "(Norm 100%)" : "✓"}
              </span>
            </div>

            {/* Proximity Weight */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Proximity (Distance)</span>
                <strong>{weightProximity}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weightProximity}
                onChange={(e) => setWeightProximity(Number(e.target.value))}
                style={{ accentColor: "#10B981" }}
              />
            </div>

            {/* ETA Weight */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Estimated Arrival Time (ETA)</span>
                <strong>{weightEta}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weightEta}
                onChange={(e) => setWeightEta(Number(e.target.value))}
                style={{ accentColor: "#10B981" }}
              />
            </div>

            {/* Rating Weight */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Rider Rating (Quality)</span>
                <strong>{weightRating}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weightRating}
                onChange={(e) => setWeightRating(Number(e.target.value))}
                style={{ accentColor: "#10B981" }}
              />
            </div>

            {/* Acceptance Weight */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Acceptance Rate</span>
                <strong>{weightAcceptance}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weightAcceptance}
                onChange={(e) => setWeightAcceptance(Number(e.target.value))}
                style={{ accentColor: "#10B981" }}
              />
            </div>

            {/* Cancellation Penalty */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Cancellation Rate Penalty</span>
                <strong style={{ color: "#EF4444" }}>-{cancellationPenalty} pts</strong>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={cancellationPenalty}
                onChange={(e) => setCancellationPenalty(Number(e.target.value))}
                style={{ accentColor: "#EF4444" }}
              />
            </div>
          </div>

          {/* Operational Thresholds */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "rgba(15, 23, 42, 0.3)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color, #1a2235)"
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#10B981", textTransform: "uppercase" }}>
              Search Radius & Dispatch Thresholds
            </span>

            {/* Max Pickup Radius */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Max Search Radius</span>
                <strong>{maxPickupRadiusKm} km</strong>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={maxPickupRadiusKm}
                onChange={(e) => setMaxPickupRadiusKm(Number(e.target.value))}
                style={{ accentColor: "#10B981" }}
              />
            </div>

            {/* Max ETA */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Max ETA Threshold</span>
                <strong>{maxEtaMinutes} mins</strong>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={maxEtaMinutes}
                onChange={(e) => setMaxEtaMinutes(Number(e.target.value))}
                style={{ accentColor: "#10B981" }}
              />
            </div>

            {/* Min Rating Threshold */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Minimum Rider Rating</span>
                <strong>{minRating.toFixed(1)} ★</strong>
              </div>
              <input
                type="range"
                min="30"
                max="50"
                value={Math.round(minRating * 10)}
                onChange={(e) => setMinRating(Number(e.target.value) / 10)}
                style={{ accentColor: "#F59E0B" }}
              />
            </div>

            {/* Min Acceptance Rate */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#CBD5E1" }}>
                <span>Minimum Acceptance Rate</span>
                <strong>{minAcceptanceRate}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={minAcceptanceRate}
                onChange={(e) => setMinAcceptanceRate(Number(e.target.value))}
                style={{ accentColor: "#10B981" }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(15, 23, 42, 0.6)"
          }}
        >
          <div>
            {!isCreatingNew && selectedRuleId && selectedRuleId !== rules[0]?.id && (
              <button
                type="button"
                onClick={() => handleDelete(selectedRuleId)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#EF4444",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <Trash2 size={13} />
                Delete Rule
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color, #1a2235)",
                color: "#94A3B8",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer"
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "8px",
                background: "#10B981",
                border: "none",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                opacity: isSaving ? 0.7 : 1
              }}
            >
              <Save size={15} />
              {isSaving ? "Saving..." : isCreatingNew ? "Create Rule" : "Save Rules"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
