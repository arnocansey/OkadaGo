"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Shield, Trash2 } from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { paxToast } from "@/components/passenger/lib/toast";
import { SubPageShell } from "@/components/passenger/ui/sub-page-shell";
import { ListRowsSkeleton } from "@/components/passenger/ui/skeletons";
import type { SafetyContact, SafetyOverview } from "@/components/passenger/types";

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  if (value.startsWith("+")) return value;
  return digits ? `+233${digits}` : value;
}

export function SafetySettingsView() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["safety-overview"],
    queryFn: () =>
      requestJson<SafetyOverview>("/safety/overview", { token: session?.token }),
    enabled: Boolean(session?.token)
  });

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName("");
    setPhone("");
    setRelationship("");
    setIsPrimary(false);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session?.token || !name.trim() || !phone.trim()) {
        throw new Error("Name and phone are required.");
      }

      const body = {
        name: name.trim(),
        phoneE164: formatPhoneInput(phone.trim()),
        relationship: relationship.trim() || undefined,
        isPrimary
      };

      if (editingId) {
        return requestJson(`/safety/contacts/${editingId}`, {
          method: "PATCH",
          token: session.token,
          body: JSON.stringify(body)
        });
      }

      return requestJson("/safety/contacts", {
        method: "POST",
        token: session.token,
        body: JSON.stringify(body)
      });
    },
    onSuccess: async () => {
      resetForm();
      paxToast.success(editingId ? "Contact updated" : "Emergency contact added");
      await queryClient.invalidateQueries({ queryKey: ["safety-overview"] });
    },
    onError: (error) => {
      paxToast.error("Could not save contact", (error as Error).message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) =>
      requestJson(`/safety/contacts/${contactId}`, {
        method: "DELETE",
        token: session?.token
      }),
    onSuccess: async () => {
      paxToast.success("Contact removed");
      await queryClient.invalidateQueries({ queryKey: ["safety-overview"] });
    },
    onError: (error) => {
      paxToast.error("Could not remove contact", (error as Error).message);
    }
  });

  useEffect(() => {
    if (!editingId) return;
    const contact = (overviewQuery.data?.contacts ?? []).find((c) => c.id === editingId);
    if (!contact) return;
    setName(contact.name);
    setPhone(contact.phoneE164);
    setRelationship(contact.relationship ?? "");
    setIsPrimary(Boolean(contact.isPrimary));
  }, [editingId, overviewQuery.data]);

  const contacts = overviewQuery.data?.contacts ?? [];
  const incidents = overviewQuery.data?.incidents ?? [];

  return (
    <PassengerAppFrame>
      <SubPageShell title="Safety settings">
        <div className="pax-alert-box mb-6">
          <div className="flex items-center gap-2 pax-alert-box-title">
            <Shield size={16} /> Trusted contacts
          </div>
          <div className="pax-alert-box-sub mt-1">
            Same emergency contacts as the passenger app. Add at least one primary contact so trip SOS can reach someone quickly.
          </div>
        </div>

        <div className="pax-card mb-6 p-4">
          <h2 className="mb-4 font-bold">{editingId ? "Edit contact" : "Add emergency contact"}</h2>

          <div className="mb-3">
            <label className="pax-field-label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="pax-input" placeholder="Ama Mensah" />
          </div>
          <div className="mb-3">
            <label className="pax-field-label">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pax-input"
              placeholder="+233 24 123 4567"
            />
          </div>
          <div className="mb-3">
            <label className="pax-field-label">Relationship</label>
            <input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="pax-input"
              placeholder="Sister, partner, friend…"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsPrimary((v) => !v)}
            className={`mb-4 w-full pax-btn-secondary ${isPrimary ? "border-[var(--pax-primary)] pax-text-primary" : ""}`}
          >
            {isPrimary ? "Primary contact ✓" : "Set as primary contact"}
          </button>

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
              {saveMutation.isPending ? "Saving…" : editingId ? "Update contact" : "Add contact"}
            </button>
            {editingId ? (
              <button type="button" className="pax-btn-secondary" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </div>

        {overviewQuery.isLoading ? (
          <ListRowsSkeleton count={3} />
        ) : contacts.length === 0 ? (
          <p className="mb-6 pax-empty text-sm">
            No emergency contacts yet. Add one above — it syncs with the mobile passenger app.
          </p>
        ) : (
          <div className="mb-8 flex flex-col gap-3">
            <h3 className="pax-section-title">Your contacts</h3>
            {contacts.map((contact: SafetyContact) => (
              <article key={contact.id} className="pax-card p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{contact.name}</div>
                    <div className="mt-0.5 text-sm pax-text-secondary">{contact.phoneE164}</div>
                    {contact.relationship ? (
                      <div className="mt-0.5 text-xs pax-text-muted">{contact.relationship}</div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {contact.isPrimary ? <span className="pax-badge pax-badge--active">Primary</span> : null}
                      {contact.isVerified ? <span className="pax-badge pax-badge--success">Verified</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-[var(--pax-surface-elevated)] pax-text-primary"
                    onClick={() => setEditingId(contact.id)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-[var(--pax-surface-elevated)] pax-text-danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove ${contact.name}?`)) {
                        deleteMutation.mutate(contact.id);
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

        {incidents.length > 0 ? (
          <div>
            <h3 className="pax-section-title">Recent safety reports</h3>
            <div className="flex flex-col gap-2">
              {incidents.slice(0, 5).map((incident) => (
                <article key={incident.id} className="pax-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{incident.category}</span>
                    <span className="pax-badge pax-badge--muted">{incident.status.replace(/_/g, " ")}</span>
                  </div>
                  <p className="mt-1 text-sm pax-text-secondary">{incident.description}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </SubPageShell>
    </PassengerAppFrame>
  );
}
