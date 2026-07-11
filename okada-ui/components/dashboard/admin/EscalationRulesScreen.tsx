import { FC } from 'react';

export type EscalationRule = {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  thresholdHours: number;
  action: string;
  targetRole: string;
  enabled: boolean;
};

export type EscalationRulesScreenProps = {
  rules: EscalationRule[];
  onToggleRule: (id: string) => void;
  onEditRule: (id: string) => void;
};

const TIMELINE_STEPS = [
  { time: '0h', event: 'Ticket created', detail: 'Assigned to L1 support' },
  { time: '4h', event: 'No response', detail: 'Escalate to L2' },
  { time: '12h', event: 'Unresolved', detail: 'Notify admin' },
  { time: '24h', event: 'Critical', detail: 'Auto-suspend rider (if rider-related)' },
];

const EscalationRulesScreen: FC<EscalationRulesScreenProps> = ({
  rules,
  onToggleRule,
  onEditRule,
}) => {
  const activeRules = rules.filter((r) => r.enabled).length;

  return (
    <div className="admin-screen">
      <div className="admin-screen-header">
        <h1>Automated Incident Escalation Rules</h1>
      </div>

      <div className="admin-reference-kpi">
        <div className="admin-reference-kpi-item">
          <span className="kpi-value">{rules.length}</span>
          <span className="kpi-label">Total Rules</span>
        </div>
        <div className="admin-reference-kpi-item">
          <span className="kpi-value">{activeRules}</span>
          <span className="kpi-label">Active Rules</span>
        </div>
        <div className="admin-reference-kpi-item">
          <span className="kpi-value">{rules.length}</span>
          <span className="kpi-label">Actions Configured</span>
        </div>
      </div>

      <div className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <h2>Escalation Rules</h2>
          <button className="admin-btn-primary" type="button">
            Create Rule
          </button>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Rule Name</th>
                <th>Description</th>
                <th>Trigger Condition</th>
                <th>Threshold</th>
                <th>Action</th>
                <th>Target Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <label className="admin-toggle">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => onToggleRule(rule.id)}
                      />
                      <span className="admin-toggle-slider" />
                    </label>
                  </td>
                  <td className="admin-table-cell-primary">{rule.name}</td>
                  <td>{rule.description}</td>
                  <td>{rule.triggerCondition}</td>
                  <td>{rule.thresholdHours}h</td>
                  <td>{rule.action}</td>
                  <td>{rule.targetRole}</td>
                  <td>
                    <button
                      className="admin-btn-secondary"
                      type="button"
                      onClick={() => onEditRule(rule.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    No escalation rules configured. Create a rule to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <h2>Default Escalation Timeline</h2>
        </div>
        <div className="admin-timeline">
          {TIMELINE_STEPS.map((step, index) => (
            <div key={step.time} className="admin-timeline-step">
              <div className="admin-timeline-marker">
                <span className="admin-timeline-dot" />
                {index < TIMELINE_STEPS.length - 1 && (
                  <span className="admin-timeline-connector" />
                )}
              </div>
              <div className="admin-timeline-content">
                <div className="admin-timeline-time">{step.time}</div>
                <div className="admin-timeline-event">{step.event}</div>
                <div className="admin-timeline-detail">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EscalationRulesScreen;
