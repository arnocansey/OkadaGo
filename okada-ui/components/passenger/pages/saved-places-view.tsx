"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Home, Pencil, Trash2 } from "lucide-react";
import { fetchJson, requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useGeoLocation } from "@/components/passenger/hooks/use-geo-location";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { paxToast } from "@/components/passenger/lib/toast";
import { SubPageShell } from "@/components/passenger/ui/sub-page-shell";
import { ListRowsSkeleton } from "@/components/passenger/ui/skeletons";
import { parseCoord, type SavedPlace } from "@/components/passenger/types";

const LABEL_PRESETS = [
  { id: "Home", icon: Home },
  { id: "Work", icon: Briefcase }
];

export function SavedPlacesView() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { center } = useGeoLocation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const placesQuery = useQuery({
    queryKey: ["saved-places"],
    queryFn: () =>
      requestJson<SavedPlace[]>("/places/saved", { token: session?.token }),
    enabled: Boolean(session?.token)
  });

  const resetForm = useCallback(() => {
    setEditingId(null);
    setLabel("Home");
    setAddress("");
    setNotes("");
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session?.token || !label.trim() || !address.trim()) {
        throw new Error("Label and address are required.");
      }

      let latitude = center[0];
      let longitude = center[1];
      try {
        const geocoded = await fetchJson<{ latitude: number; longitude: number }>(
          `/bootstrap/forward-geocode?q=${encodeURIComponent(address.trim())}`
        );
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      } catch {
        // fall back to current location
      }

      const body = {
        label: label.trim(),
        address: address.trim(),
        latitude,
        longitude,
        notes: notes.trim() || undefined
      };

      if (editingId) {
        return requestJson(`/places/saved/${editingId}`, {
          method: "PATCH",
          token: session.token,
          body: JSON.stringify(body)
        });
      }

      return requestJson("/places/saved", {
        method: "POST",
        token: session.token,
        body: JSON.stringify(body)
      });
    },
    onSuccess: async () => {
      resetForm();
      paxToast.success(editingId ? "Place updated" : "Place saved");
      await queryClient.invalidateQueries({ queryKey: ["saved-places"] });
    },
    onError: (error) => {
      paxToast.error("Could not save place", (error as Error).message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (placeId: string) =>
      requestJson(`/places/saved/${placeId}`, {
        method: "DELETE",
        token: session?.token
      }),
    onSuccess: async () => {
      paxToast.success("Place removed");
      await queryClient.invalidateQueries({ queryKey: ["saved-places"] });
    },
    onError: (error) => {
      paxToast.error("Could not delete place", (error as Error).message);
    }
  });

  useEffect(() => {
    if (!editingId) return;
    const place = (placesQuery.data ?? []).find((p) => p.id === editingId);
    if (!place) return;
    setLabel(place.label);
    setAddress(place.address);
    setNotes(place.notes ?? "");
  }, [editingId, placesQuery.data]);

  return (
    <PassengerAppFrame>
      <SubPageShell title="Saved places">
        <div className="pax-card mb-6 p-4">
          <h2 className="mb-4 font-bold">{editingId ? "Edit place" : "Add place"}</h2>

          <div className="mb-4 flex gap-2">
            {LABEL_PRESETS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setLabel(id)}
                className={`pax-chip${label === id ? " pax-chip--active" : ""}`}
              >
                <Icon size={14} /> {id}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label className="pax-field-label">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="pax-input" placeholder="Home" />
          </div>
          <div className="mb-3">
            <label className="pax-field-label">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pax-input"
              placeholder="Ring Road, Accra"
            />
          </div>
          <div className="mb-4">
            <label className="pax-field-label">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="pax-input" placeholder="Gate code, landmark…" />
          </div>

          {saveMutation.error ? (
            <p className="mb-3 text-sm pax-text-danger">{(saveMutation.error as Error).message}</p>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="pax-btn-primary !h-11"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving…" : editingId ? "Update place" : "Save place"}
            </button>
            {editingId ? (
              <button type="button" className="pax-btn-secondary" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </div>

        {placesQuery.isLoading ? (
          <ListRowsSkeleton count={3} />
        ) : (placesQuery.data ?? []).length === 0 ? (
          <p className="pax-empty text-sm">No saved places yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(placesQuery.data ?? []).map((place) => (
              <article key={place.id} className="pax-card p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{place.label}</div>
                    <div className="mt-0.5 text-sm pax-text-secondary">{place.address}</div>
                    {place.notes ? <div className="mt-1 text-xs pax-text-muted">{place.notes}</div> : null}
                    <div className="mt-1 text-xs pax-text-muted">
                      {parseCoord(place.latitude).toFixed(4)}, {parseCoord(place.longitude).toFixed(4)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-[var(--pax-surface-elevated)] pax-text-primary"
                    aria-label={`Edit ${place.label}`}
                    onClick={() => setEditingId(place.id)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-[var(--pax-surface-elevated)] pax-text-danger"
                    aria-label={`Delete ${place.label}`}
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove ${place.label}?`)) {
                        deleteMutation.mutate(place.id);
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SubPageShell>
    </PassengerAppFrame>
  );
}
