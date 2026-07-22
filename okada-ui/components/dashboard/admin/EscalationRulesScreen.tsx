"use client";

import { useState, type FC } from "react";
import { EmptyCard } from "./EmptyCard";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";

export type EscalationRule = {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  thresholdHours: number;
  action: string;
  targetRole: string;
  enabled: boolean;
  lastRunAt?: string | null;
  lastActionCount?: number;
};

export type EscalationRulesScreenProps = {
  rules: EscalationRule[];
  onToggleRule: (id: string, enabled: boolean) => void;
  onCreateRule: (rule: Omit<EscalationRule, "id">) => void;
  isMutating?: boolean;
};

const TIMELINE_STEPS = [
  { time: "0h", event: "Ticket created", detail: "Assigned to L1 support" },
  { time: "4h", event: "No response", detail: "Escalate to L2" },
  { time: "12h", event: "Unresolved", detail: "Notify admin" },
  { time: "24h", event: "Critical", detail: "Auto-suspend rider (if rider-related)" }
];

const emptyForm = {
  name: "",
  description: "",
  triggerCondition: "ticket_unanswered",
  thresholdHours: 4,
  action: "notify_admin",
  targetRole: "admin",
  enabled: true
};

const EscalationRulesScreen: FC<EscalationRulesScreenProps> = ({
  rules,
  onToggleRule,
  onCreateRule,
  isMutating = false
}) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const activeRules = rules.filter((r) => r.enabled).length;

  function submit() {
    if (!form.name.trim() || !form.description.trim()) return;
    onCreateRule({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      thresholdHours: Number(form.thresholdHours) || 4
    });
    setForm(emptyForm);
    setShowForm(false);
  }

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Escalation Rules"
        subtitle="Automate how long tickets wait before escalating to the next ops tier."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close form" : "Create Rule"}
          </button>
        }
      />

      <AdminKpiRow
        items={[
          { label: "Total Rules", value: rules.length, hint: "Configured workflows" },
          { label: "Active Rules", value: activeRules, hint: "Currently enabled" },
          { label: "Actions Configured", value: rules.length, hint: "Escalation actions" }
        ]}
      />

      {showForm ? (
        <article className="admin-reference-card" style={{ marginBottom: 20 }}>
          <div className="admin-reference-cardhead">
            <div>
              <h3>New escalation rule</h3>
              <p>Enabled rules run automatically every minute against tickets and SOS incidents.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label>
              Name
              <input className="admin-search-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label>
              Trigger
              <input className="admin-search-input" value={form.triggerCondition} onChange={(e) => setForm((f) => ({ ...f, triggerCondition: e.target.value }))} />
            </label>
            <label>
              Threshold (hours)
              <input
                className="admin-search-input"
                type="number"
                min={1}
                value={form.thresholdHours}
                onChange={(e) => setForm((f) => ({ ...f, thresholdHours: Number(e.target.value) }))}
              />
            </label>
            <label>
              Action
              <input className="admin-search-input" value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))} />
            </label>
            <label>
              Target role
              <input className="admin-search-input" value={form.targetRole} onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))} />
            </label>
            <label className="admin-form-span">
              Description
              <input className="admin-search-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </label>
          </div>
          <div className="admin-page-header-actions" style={{ marginTop: 16 }}>
            <button type="button" className="admin-btn-primary" disabled={isMutating} onClick={submit}>
              Save rule
            </button>
          </div>
        </article>
      ) : null}

      <div className="admin-screen-grid-2">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Escalation Rules</h3>
              <p>{rules.length} rules configured</p>
            </div>
          </div>
          {rules.length === 0 ? (
            <EmptyCard title="No escalation rules yet." body="Create a rule to define how support tickets escalate over time." />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Trigger</th>
                    <th>Threshold</th>
                    <th>Last run</th>
                    <th>Role</th>
                    <th>Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <strong>{rule.name}</strong>
                        <br />
                        <small>{rule.description}</small>
                      </td>
                      <td><code className="admin-inline-code">{rule.triggerCondition}</code></td>
                      <td>{rule.thresholdHours}h</td>
                      <td>
                        <small>
                          {rule.lastRunAt
                            ? new Date(rule.lastRunAt).toLocaleString()
                            : "Not yet"}
                        </small>
                        {typeof rule.lastActionCount === "number" ? (
                          <>
                            <br />
                            <small>{rule.lastActionCount} actions</small>
                          </>
                        ) : null}
                      </td>
                      <td>{rule.targetRole}</td>
                      <td>
                        <button
                          type="button"
                          className={rule.enabled ? "admin-btn-primary" : "admin-btn-secondary"}
                          disabled={isMutating}
                          onClick={() => onToggleRule(rule.id, !rule.enabled)}
                        >
                          {rule.enabled ? "On" : "Off"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Suggested timeline</h3>
                <p>Reference SLA path</p>
              </div>
            </div>
            <ul className="admin-summary-list">
              {TIMELINE_STEPS.map((step) => (
                <li key={step.time}>
                  <span>
                    <strong>{step.time}</strong> · {step.event}
                    <br />
                    <small>{step.detail}</small>
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </div>
  );
};

export default EscalationRulesScreen;
