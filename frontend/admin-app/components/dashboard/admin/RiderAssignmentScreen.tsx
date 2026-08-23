import { useState } from "react";
import {
  Users, Search, Star, Clock, MapPin, Phone, CheckCircle, XCircle, Zap,
  ArrowRightLeft, History, AlertTriangle
} from "lucide-react";
import { formatDateTime } from "./utils";

const STATUS_COLORS: Record<string, string> = {
  SEARCHING: "#facc15",
  SCHEDULED: "#a78bfa",
  ASSIGNED: "#22C55E",
  ARRIVING: "#3b82f6",
  ARRIVED: "#f97316",
  STARTED: "#06b6d4"
};

const STATUS_LABELS: Record<string, string> = {
  SEARCHING: "Searching",
  SCHEDULED: "Scheduled",
  ASSIGNED: "Assigned",
  ARRIVING: "Arriving",
  ARRIVED: "Arrived",
  STARTED: "Started"
};

const REASSIGN_REASONS = [
  { value: "rider_unavailable", label: "Rider unavailable" },
  { value: "rider_cancelled", label: "Rider cancelled" },
  { value: "rider_too_far", label: "Rider too far" },
  { value: "customer_requested", label: "Customer requested" },
  { value: "bike_problem", label: "Bike problem" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" }
];

type Ride = {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  requestedAt: string;
  assignmentStatus: string;
  passenger: { name: string; phone: string } | null;
  assignedRider: { id: string; name: string; phone: string; vehicle: { make: string; model: string; plateNumber: string } | null } | null;
};

type RiderCandidate = {
  riderId: string;
  displayName: string;
  displayCode: string;
  phone: string;
  rating: number;
  acceptanceRate: number;
  cancellationRate: number;
  completedTrips: number;
  todayTrips: number;
  todayEarnings: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  distanceToPickupKm: number;
  etaMinutes: number;
  score: number;
  onlineStatus: boolean;
  vehicle: { make: string; model: string; color: string; plateNumber: string; vehicleType: string } | null;
  serviceZone: string | null;
};

type AssignmentHistoryItem = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  currentRider: string;
};

type AvailableRidersResponse = {
  ride: Record<string, unknown>;
  availableRiders: RiderCandidate[];
  recommendedRiderId: string | null;
};

type UseMutationResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: (vars: any, opts?: { onSuccess?: () => void }) => void;
  isPending: boolean;
};

export type RiderAssignmentScreenProps = {
  activeRides: Ride[];
  activeRidesPending: boolean;
  selectedAssignmentRideId: string | null;
  setSelectedAssignmentRideId: (id: string | null) => void;
  availableRidersData: AvailableRidersResponse | undefined;
  availableRidersPending: boolean;
  assignRiderMutation: UseMutationResult;
  reassignRiderMutation: UseMutationResult;
  unassignRiderMutation: UseMutationResult;
  autoAssignMutation: UseMutationResult;
};

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const color = pct >= 70 ? "#22C55E" : pct >= 40 ? "#facc15" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "0.72rem", color, fontWeight: 600, minWidth: 32, textAlign: "right" }}>{score.toFixed(1)}</span>
    </div>
  );
}

function RiderCard({ rider, isRecommended, onAssign }: { rider: RiderCandidate; isRecommended: boolean; onAssign: () => void }) {
  return (
    <div
      style={{
        border: isRecommended ? "1.5px solid #22C55E" : "1px solid var(--border-color, #1a1f2e)",
        borderRadius: 12,
        padding: "14px 16px",
        background: isRecommended ? "rgba(34,197,94,0.06)" : "var(--card-bg, #0d1220)",
        cursor: "pointer",
        transition: "all 0.15s",
        position: "relative"
      }}
      onClick={onAssign}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = isRecommended ? "#22C55E" : "var(--accent-orange, #ff6b00)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = isRecommended ? "#22C55E" : "var(--border-color, #1a1f2e)"; }}
    >
      {isRecommended && (
        <div style={{
          position: "absolute", top: -8, right: 12, background: "#22C55E", color: "#fff",
          fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 8, letterSpacing: "0.04em"
        }}>
          RECOMMENDED
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary, #f0f0f0)" }}>{rider.displayName}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #8b8fa3)", marginTop: 2 }}>{rider.displayCode}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>
          <Star size={12} fill="#facc15" stroke="#facc15" />
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#facc15" }}>{rider.rating.toFixed(1)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted, #8b8fa3)" }}>Distance</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary, #f0f0f0)" }}>{rider.distanceToPickupKm.toFixed(1)}km</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted, #8b8fa3)" }}>ETA</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary, #f0f0f0)" }}>{rider.etaMinutes}min</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted, #8b8fa3)" }}>Trips Today</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary, #f0f0f0)" }}>{rider.todayTrips}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted, #8b8fa3)", marginBottom: 2 }}>Acceptance</div>
          <ScoreBar score={rider.acceptanceRate} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted, #8b8fa3)", marginBottom: 2 }}>Overall</div>
          <ScoreBar score={rider.score} />
        </div>
      </div>

      {rider.vehicle && (
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #8b8fa3)", display: "flex", alignItems: "center", gap: 6 }}>
          <span>{rider.vehicle.color} {rider.vehicle.make} {rider.vehicle.model}</span>
          <span style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 4, fontSize: "0.65rem" }}>{rider.vehicle.plateNumber}</span>
        </div>
      )}
    </div>
  );
}

function ReassignModal({ ride, onClose, availableRidersData, availableRidersPending, reassignRiderMutation }: {
  ride: Ride;
  onClose: () => void;
  availableRidersData: AvailableRidersResponse | undefined;
  availableRidersPending: boolean;
  reassignRiderMutation: UseMutationResult;
}) {
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [reason, setReason] = useState("other");
  const [reasonNote, setReasonNote] = useState("");

  const riders = availableRidersData?.availableRiders ?? [];
  const recommendedId = availableRidersData?.recommendedRiderId;

  const handleSubmit = () => {
    if (!selectedRiderId) return;
    reassignRiderMutation.mutate(
      { rideId: ride.id, riderProfileId: selectedRiderId, reason, reasonNote: reasonNote || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: 20
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--card-bg, #0d1220)", border: "1px solid var(--border-color, #1a1f2e)",
        borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "85vh",
        overflow: "auto", padding: "24px 28px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ArrowRightLeft size={18} color="#facc15" />
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary, #f0f0f0)" }}>Reassign Rider</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #8b8fa3)" }}>
                Ride {ride.id.slice(0, 8)} — {ride.pickupAddress?.slice(0, 40)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted, #8b8fa3)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        {ride.assignedRider && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10
          }}>
            <AlertTriangle size={16} color="#EF4444" />
            <div style={{ fontSize: "0.78rem", color: "var(--text-primary, #f0f0f0)" }}>
              Current rider: <strong>{ride.assignedRider.name}</strong> — this will be replaced
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted, #8b8fa3)", display: "block", marginBottom: 6 }}>Reassign to</label>
          {availableRidersPending ? (
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #8b8fa3)" }}>Loading riders…</div>
          ) : riders.length === 0 ? (
            <div style={{ fontSize: "0.78rem", color: "#EF4444" }}>No available riders found</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflow: "auto" }}>
              {riders.map((r) => (
                <div
                  key={r.riderId}
                  onClick={() => setSelectedRiderId(r.riderId)}
                  style={{
                    border: selectedRiderId === r.riderId ? "1.5px solid #facc15" : r.riderId === recommendedId ? "1.5px solid #22C55E" : "1px solid var(--border-color, #1a1f2e)",
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                    background: selectedRiderId === r.riderId ? "rgba(250,204,21,0.06)" : "transparent",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary, #f0f0f0)" }}>{r.displayName}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted, #8b8fa3)" }}>{r.displayCode}</span>
                    {r.vehicle && <span style={{ fontSize: "0.65rem", color: "var(--text-muted, #8b8fa3)" }}>{r.vehicle.plateNumber}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.72rem", color: "#facc15" }}>★ {r.rating.toFixed(1)}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted, #8b8fa3)" }}>{r.distanceToPickupKm.toFixed(1)}km</span>
                    {r.riderId === recommendedId && (
                      <span style={{ fontSize: "0.6rem", background: "#22C55E", color: "#fff", padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>BEST</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted, #8b8fa3)", display: "block", marginBottom: 6 }}>Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "1px solid var(--border-color, #1a1f2e)", background: "var(--card-bg, #0d1220)",
              color: "var(--text-primary, #f0f0f0)", fontSize: "0.82rem"
            }}
          >
            {REASSIGN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {(reason === "other" || reason === "emergency") && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted, #8b8fa3)", display: "block", marginBottom: 6 }}>Notes</label>
            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Additional details…"
              rows={2}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid var(--border-color, #1a1f2e)", background: "var(--card-bg, #0d1220)",
                color: "var(--text-primary, #f0f0f0)", fontSize: "0.82rem", resize: "vertical"
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color, #1a1f2e)",
              background: "transparent", color: "var(--text-muted, #8b8fa3)", fontSize: "0.78rem", cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRiderId || reassignRiderMutation.isPending}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: selectedRiderId ? "#facc15" : "rgba(255,255,255,0.08)",
              color: selectedRiderId ? "#000" : "var(--text-muted, #8b8fa3)",
              fontSize: "0.78rem", fontWeight: 600, cursor: selectedRiderId ? "pointer" : "not-allowed"
            }}
          >
            {reassignRiderMutation.isPending ? "Reassigning…" : "Confirm Reassign"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({ rideId, onClose }: { rideId: string; onClose: () => void }) {
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    (async () => {
      try {
        const res = await fetch(`/v1/admin/rides/${rideId}/assignment-history`);
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setHistory([]);
      }
      setLoading(false);
    })();
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: 20
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--card-bg, #0d1220)", border: "1px solid var(--border-color, #1a1f2e)",
        borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "70vh",
        overflow: "auto", padding: "24px 28px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <History size={16} color="#a78bfa" />
            <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary, #f0f0f0)" }}>Assignment History</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted, #8b8fa3)", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>

        {loading ? (
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #8b8fa3)", textAlign: "center", padding: 20 }}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #8b8fa3)", textAlign: "center", padding: 20 }}>No assignment history</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((item) => {
              const iconColor = item.eventType.includes("UNASSIGNED") ? "#EF4444" : item.eventType.includes("AUTO") ? "#22C55E" : "#facc15";
              const Icon = item.eventType.includes("UNASSIGNED") ? XCircle : item.eventType.includes("AUTO") ? Zap : ArrowRightLeft;
              const label = item.eventType.replace("ADMIN_", "").replace("_", " ");
              return (
                <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icon size={14} color={iconColor} style={{ marginTop: 3, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-primary, #f0f0f0)" }}>
                      <strong>{label}</strong>
                      {item.payload && typeof item.payload === "object" && "reason" in (item.payload as Record<string, unknown>) && (
                        <span style={{ color: "var(--text-muted, #8b8fa3)" }}> — {(item.payload as Record<string, unknown>).reason as string}</span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted, #8b8fa3)", marginTop: 2 }}>
                      {formatDateTime(item.createdAt)} — Rider: {item.currentRider}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AvailableRidersPanel({ rideId, availableRidersData, availableRidersPending, assignRiderMutation, autoAssignMutation }: {
  rideId: string;
  availableRidersData: AvailableRidersResponse | undefined;
  availableRidersPending: boolean;
  assignRiderMutation: UseMutationResult;
  autoAssignMutation: UseMutationResult;
}) {
  const riders = availableRidersData?.availableRiders ?? [];
  const recommendedId = availableRidersData?.recommendedRiderId;

  const handleAssign = (riderId: string) => {
    assignRiderMutation.mutate({ rideId, riderProfileId: riderId });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #8b8fa3)" }}>{riders.length} riders available</span>
        <button
          onClick={() => autoAssignMutation.mutate({ rideId })}
          disabled={autoAssignMutation.isPending}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
            borderRadius: 8, border: "none", background: "#22C55E", color: "#fff",
            fontSize: "0.75rem", fontWeight: 600, cursor: autoAssignMutation.isPending ? "not-allowed" : "pointer"
          }}
        >
          <Zap size={14} />
          {autoAssignMutation.isPending ? "Assigning…" : "Auto-Assign"}
        </button>
      </div>

      {availableRidersPending ? (
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #8b8fa3)", textAlign: "center", padding: 20 }}>Loading…</div>
      ) : riders.length === 0 ? (
        <div style={{ fontSize: "0.78rem", color: "#EF4444", textAlign: "center", padding: 20 }}>No available riders found</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {riders.map((rider) => (
            <div key={rider.riderId} style={{ position: "relative" }}>
              <RiderCard
                rider={rider}
                isRecommended={rider.riderId === recommendedId}
                onAssign={() => handleAssign(rider.riderId)}
              />
              {rider.riderId !== recommendedId && (
                <button
                  onClick={() => handleAssign(rider.riderId)}
                  style={{
                    position: "absolute", bottom: 10, right: 10,
                    padding: "4px 10px", borderRadius: 6, border: "none",
                    background: "rgba(250,204,21,0.15)", color: "#facc15",
                    fontSize: "0.7rem", fontWeight: 600, cursor: "pointer"
                  }}
                >
                  Select
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RiderAssignmentScreen(props: RiderAssignmentScreenProps) {
  const {
    activeRides, activeRidesPending,
    selectedAssignmentRideId, setSelectedAssignmentRideId,
    availableRidersData, availableRidersPending,
    assignRiderMutation, reassignRiderMutation, unassignRiderMutation, autoAssignMutation
  } = props;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reassignRide, setReassignRide] = useState<Ride | null>(null);
  const [historyRideId, setHistoryRideId] = useState<string | null>(null);
  const [confirmUnassign, setConfirmUnassign] = useState<string | null>(null);

  const rides = (activeRides as Ride[]).filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.pickupAddress?.toLowerCase().includes(q) ||
        r.destinationAddress?.toLowerCase().includes(q) ||
        r.passenger?.name?.toLowerCase().includes(q) ||
        r.assignedRider?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRowClick = (ride: Ride) => {
    setSelectedAssignmentRideId(ride.id);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary, #f0f0f0)", margin: 0 }}>Rider Assignment</h2>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted, #8b8fa3)", margin: "4px 0 0" }}>
            {rides.length} active ride{rides.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted, #8b8fa3)" }} />
          <input
            type="text"
            placeholder="Search rides, passengers, riders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8,
              border: "1px solid var(--border-color, #1a1f2e)", background: "var(--card-bg, #0d1220)",
              color: "var(--text-primary, #f0f0f0)", fontSize: "0.82rem"
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px", borderRadius: 8,
            border: "1px solid var(--border-color, #1a1f2e)", background: "var(--card-bg, #0d1220)",
            color: "var(--text-primary, #f0f0f0)", fontSize: "0.82rem"
          }}
        >
          <option value="all">All Statuses</option>
          <option value="SEARCHING">Searching</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ARRIVING">Arriving</option>
          <option value="ARRIVED">Arrived</option>
        </select>
      </div>

      {/* Table */}
      {activeRidesPending ? (
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #8b8fa3)", textAlign: "center", padding: 40 }}>Loading active rides…</div>
      ) : rides.length === 0 ? (
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #8b8fa3)", textAlign: "center", padding: 40 }}>
          <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <div>No active rides</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Ride ID", "Status", "Passenger", "Pickup", "Destination", "Rider", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left", fontSize: "0.7rem",
                    fontWeight: 600, color: "var(--text-muted, #8b8fa3)",
                    borderBottom: "1px solid var(--border-color, #1a1f2e)",
                    whiteSpace: "nowrap"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rides.map((ride) => (
                <tr
                  key={ride.id}
                  onClick={() => handleRowClick(ride)}
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-color, #1a1f2e)",
                    background: selectedAssignmentRideId === ride.id ? "rgba(250,204,21,0.04)" : "transparent"
                  }}
                  onMouseEnter={(e) => { if (selectedAssignmentRideId !== ride.id) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { if (selectedAssignmentRideId !== ride.id) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem" }}>
                    <span style={{ fontFamily: "monospace", color: "var(--text-muted, #8b8fa3)", fontSize: "0.75rem" }}>{ride.id.slice(0, 10)}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                      background: `${STATUS_COLORS[ride.status] ?? "#8b8fa3"}18`,
                      color: STATUS_COLORS[ride.status] ?? "#8b8fa3"
                    }}>
                      {STATUS_LABELS[ride.status] ?? ride.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--text-primary, #f0f0f0)" }}>
                    {ride.passenger?.name ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.75rem", color: "var(--text-muted, #8b8fa3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ride.pickupAddress ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.75rem", color: "var(--text-muted, #8b8fa3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ride.destinationAddress ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--text-primary, #f0f0f0)" }}>
                    {ride.assignedRider ? (
                      <span>
                        {ride.assignedRider.name}
                        {ride.assignedRider.vehicle && (
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted, #8b8fa3)", marginLeft: 4 }}>
                            {ride.assignedRider.vehicle.plateNumber}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--accent-orange, #ff6b00)", fontWeight: 600 }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {ride.assignmentStatus === "unassigned" ? (
                        <button
                          onClick={() => handleRowClick(ride)}
                          style={{
                            padding: "4px 10px", borderRadius: 6, border: "none",
                            background: "#22C55E", color: "#fff", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          Assign
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => { setSelectedAssignmentRideId(ride.id); setReassignRide(ride); }}
                            style={{
                              padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border-color, #1a1f2e)",
                              background: "transparent", color: "var(--text-muted, #8b8fa3)", fontSize: "0.7rem", cursor: "pointer"
                            }}
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => setConfirmUnassign(ride.id)}
                            style={{
                              padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)",
                              background: "rgba(239,68,68,0.08)", color: "#EF4444", fontSize: "0.7rem", cursor: "pointer"
                            }}
                          >
                            Unassign
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setHistoryRideId(ride.id)}
                        style={{
                          padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border-color, #1a1f2e)",
                          background: "transparent", color: "var(--text-muted, #8b8fa3)", fontSize: "0.7rem", cursor: "pointer"
                        }}
                      >
                        <History size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected ride detail / assign panel */}
      {selectedAssignmentRideId && (
        <div style={{
          marginTop: 20, padding: "16px 20px", borderRadius: 12,
          border: "1px solid var(--border-color, #1a1f2e)",
          background: "var(--card-bg, #0d1220)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary, #f0f0f0)" }}>
              Assign a rider to ride {selectedAssignmentRideId.slice(0, 10)}
            </div>
            <button
              onClick={() => setSelectedAssignmentRideId(null)}
              style={{ background: "none", border: "none", color: "var(--text-muted, #8b8fa3)", cursor: "pointer", fontSize: "1rem" }}
            >
              ✕
            </button>
          </div>
          <AvailableRidersPanel
            rideId={selectedAssignmentRideId}
            availableRidersData={availableRidersData}
            availableRidersPending={availableRidersPending}
            assignRiderMutation={assignRiderMutation}
            autoAssignMutation={autoAssignMutation}
          />
        </div>
      )}

      {/* Modals */}
      {reassignRide && (
        <ReassignModal
          ride={reassignRide}
          onClose={() => setReassignRide(null)}
          availableRidersData={availableRidersData}
          availableRidersPending={availableRidersPending}
          reassignRiderMutation={reassignRiderMutation}
        />
      )}
      {historyRideId && <HistoryPanel rideId={historyRideId} onClose={() => setHistoryRideId(null)} />}

      {/* Confirm unassign */}
      {confirmUnassign && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
        }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmUnassign(null); }}>
          <div style={{
            background: "var(--card-bg, #0d1220)", border: "1px solid var(--border-color, #1a1f2e)",
            borderRadius: 12, padding: 24, maxWidth: 360, width: "100%"
          }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary, #f0f0f0)", marginBottom: 8 }}>Unassign Rider?</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #8b8fa3)", marginBottom: 20 }}>
              This will remove the assigned rider and set the ride back to searching status.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setConfirmUnassign(null)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color, #1a1f2e)",
                  background: "transparent", color: "var(--text-muted, #8b8fa3)", fontSize: "0.78rem", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  unassignRiderMutation.mutate({ rideId: confirmUnassign }, { onSuccess: () => setConfirmUnassign(null) });
                }}
                disabled={unassignRiderMutation.isPending}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: "#EF4444", color: "#fff", fontSize: "0.78rem", fontWeight: 600,
                  cursor: unassignRiderMutation.isPending ? "not-allowed" : "pointer"
                }}
              >
                {unassignRiderMutation.isPending ? "Unassigning…" : "Confirm Unassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
