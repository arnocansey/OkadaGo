"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";

type PromoCodeRecord = {
  id: string;
  code: string;
  name: string;
  type: "FLAT" | "PERCENTAGE" | "CREDIT";
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
  discountValue: string | number;
  maxDiscount: string | number | null;
  minRideAmount: string | number | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  city: string | null;
  currency: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  _count?: { redemptions: number };
};

type PromoFormState = {
  code: string;
  name: string;
  type: "FLAT" | "PERCENTAGE" | "CREDIT";
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  discountValue: string;
  maxDiscount: string;
  minRideAmount: string;
  maxRedemptions: string;
  perUserLimit: string;
  city: string;
  currency: "GHS" | "NGN" | "";
};

const emptyForm = (): PromoFormState => ({
  code: "",
  name: "",
  type: "FLAT",
  status: "DRAFT",
  discountValue: "",
  maxDiscount: "",
  minRideAmount: "",
  maxRedemptions: "",
  perUserLimit: "",
  city: "",
  currency: "GHS",
});

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

type PromoCodesManagementProps = {
  token?: string | null;
  defaultCurrency?: string;
};

export function PromoCodesManagement({ token, defaultCurrency = "GHS" }: PromoCodesManagementProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [form, setForm] = useState<PromoFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const promosQuery = useQuery({
    queryKey: ["admin-promotions", token, statusFilter],
    queryFn: () =>
      requestJson<PromoCodeRecord[]>(
        statusFilter ? `/admin/promotions?status=${statusFilter}` : "/admin/promotions",
        { token },
      ),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      requestJson<PromoCodeRecord>("/admin/promotions", {
        method: "POST",
        token,
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          type: form.type,
          status: form.status,
          discountValue: Number(form.discountValue),
          maxDiscount: optionalNumber(form.maxDiscount),
          minRideAmount: optionalNumber(form.minRideAmount),
          maxRedemptions: optionalNumber(form.maxRedemptions),
          perUserLimit: optionalNumber(form.perUserLimit),
          city: form.city.trim() || undefined,
          currency: form.currency || undefined,
        }),
      }),
    onSuccess: async () => {
      setForm(emptyForm());
      setFormError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-promotions", token] });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ promoCodeId, patch }: { promoCodeId: string; patch: Record<string, unknown> }) =>
      requestJson<PromoCodeRecord>(`/admin/promotions/${promoCodeId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(patch),
      }),
    onSuccess: async () => {
      setEditingId(null);
      setForm(emptyForm());
      setFormError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-promotions", token] });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const promos = promosQuery.data ?? [];

  const activeCount = useMemo(() => promos.filter((promo) => promo.status === "ACTIVE").length, [promos]);
  const pausedCount = useMemo(() => promos.filter((promo) => promo.status === "PAUSED").length, [promos]);

  function startEdit(promo: PromoCodeRecord) {
    setEditingId(promo.id);
    setFormError("");
    setForm({
      code: promo.code,
      name: promo.name,
      type: promo.type,
      status: promo.status === "PAUSED" ? "PAUSED" : promo.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
      discountValue: `${parseNumber(promo.discountValue)}`,
      maxDiscount: promo.maxDiscount != null ? `${parseNumber(promo.maxDiscount)}` : "",
      minRideAmount: promo.minRideAmount != null ? `${parseNumber(promo.minRideAmount)}` : "",
      maxRedemptions: promo.maxRedemptions != null ? `${promo.maxRedemptions}` : "",
      perUserLimit: promo.perUserLimit != null ? `${promo.perUserLimit}` : "",
      city: promo.city ?? "",
      currency: (promo.currency as "GHS" | "NGN" | null) ?? "GHS",
    });
  }

  function submitForm() {
    setFormError("");
    if (!form.code.trim() || !form.name.trim() || !form.discountValue.trim()) {
      setFormError("Code, name, and discount value are required.");
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      discountValue: Number(form.discountValue),
      maxDiscount: optionalNumber(form.maxDiscount),
      minRideAmount: optionalNumber(form.minRideAmount),
      maxRedemptions: optionalNumber(form.maxRedemptions),
      perUserLimit: optionalNumber(form.perUserLimit),
      city: form.city.trim() || undefined,
      currency: form.currency || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ promoCodeId: editingId, patch: payload });
      return;
    }

    createMutation.mutate();
  }

  return (
    <section className="exact-admin-card wide">
      <div className="exact-admin-cardhead">
        <div>
          <h3>Promo codes</h3>
          <p>Create, edit, and pause promotion codes wired to the live backend.</p>
        </div>
        <div className="exact-admin-inline-actions">
          <select
            className="exact-admin-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="EXPIRED">Expired</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div className="exact-admin-kpis exact-admin-kpis-compact">
        <article className="exact-admin-kpi">
          <span>Total codes</span>
          <strong>{promos.length}</strong>
        </article>
        <article className="exact-admin-kpi">
          <span>Active</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="exact-admin-kpi">
          <span>Paused</span>
          <strong>{pausedCount}</strong>
        </article>
      </div>

      <div className="exact-admin-form-grid">
        <label>
          Code
          <input
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
            placeholder="WELCOME10"
          />
        </label>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Welcome discount"
          />
        </label>
        <label>
          Type
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({ ...current, type: event.target.value as PromoFormState["type"] }))
            }
          >
            <option value="FLAT">Flat</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="CREDIT">Credit</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as PromoFormState["status"] }))
            }
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
        </label>
        <label>
          Discount value
          <input
            value={form.discountValue}
            onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))}
            placeholder={form.type === "PERCENTAGE" ? "10" : "5"}
          />
        </label>
        <label>
          Max discount
          <input
            value={form.maxDiscount}
            onChange={(event) => setForm((current) => ({ ...current, maxDiscount: event.target.value }))}
            placeholder="Optional cap"
          />
        </label>
        <label>
          Min ride amount
          <input
            value={form.minRideAmount}
            onChange={(event) => setForm((current) => ({ ...current, minRideAmount: event.target.value }))}
            placeholder="Optional minimum"
          />
        </label>
        <label>
          Currency
          <select
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({ ...current, currency: event.target.value as PromoFormState["currency"] }))
            }
          >
            <option value="GHS">GHS</option>
            <option value="NGN">NGN</option>
          </select>
        </label>
        <label>
          City
          <input
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            placeholder="Optional city scope"
          />
        </label>
        <label>
          Max redemptions
          <input
            value={form.maxRedemptions}
            onChange={(event) => setForm((current) => ({ ...current, maxRedemptions: event.target.value }))}
            placeholder="Optional total limit"
          />
        </label>
        <label>
          Per-user limit
          <input
            value={form.perUserLimit}
            onChange={(event) => setForm((current) => ({ ...current, perUserLimit: event.target.value }))}
            placeholder="Optional per passenger"
          />
        </label>
      </div>

      {formError ? <p className="exact-admin-form-error">{formError}</p> : null}

      <div className="exact-admin-inline-actions">
        <button
          type="button"
          className="exact-admin-button"
          disabled={createMutation.isPending || updateMutation.isPending}
          onClick={submitForm}
        >
          {editingId ? "Save changes" : "Create promo code"}
        </button>
        {editingId ? (
          <button
            type="button"
            className="exact-admin-button ghost"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm());
              setFormError("");
            }}
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      {promosQuery.isLoading ? (
        <div className="status-chip warning">Loading promo codes</div>
      ) : promosQuery.isError ? (
        <EmptyCard title="Could not load promo codes." body={promosQuery.error.message} />
      ) : promos.length === 0 ? (
        <EmptyCard
          title="No promo codes yet."
          body="Create your first promotion code above to start offering discounts in the apps."
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Value</th>
                <th>Redemptions</th>
                <th>Valid until</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <strong>{promo.code}</strong>
                  </td>
                  <td>{promo.name}</td>
                  <td>{promo.type}</td>
                  <td>
                    <span className={`status-chip ${promo.status === "ACTIVE" ? "success" : "neutral"}`}>
                      {promo.status}
                    </span>
                  </td>
                  <td>
                    {promo.type === "PERCENTAGE"
                      ? `${parseNumber(promo.discountValue)}%`
                      : formatMoney(promo.currency ?? defaultCurrency, promo.discountValue)}
                  </td>
                  <td>{promo._count?.redemptions ?? 0}</td>
                  <td>{formatDateTime(promo.endsAt)}</td>
                  <td>
                    <div className="exact-admin-inline-actions">
                      <button type="button" className="exact-admin-button ghost" onClick={() => startEdit(promo)}>
                        Edit
                      </button>
                      {promo.status === "ACTIVE" ? (
                        <button
                          type="button"
                          className="exact-admin-button ghost"
                          onClick={() =>
                            updateMutation.mutate({ promoCodeId: promo.id, patch: { status: "PAUSED" } })
                          }
                        >
                          Pause
                        </button>
                      ) : promo.status === "PAUSED" || promo.status === "DRAFT" ? (
                        <button
                          type="button"
                          className="exact-admin-button ghost"
                          onClick={() =>
                            updateMutation.mutate({ promoCodeId: promo.id, patch: { status: "ACTIVE" } })
                          }
                        >
                          Activate
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
