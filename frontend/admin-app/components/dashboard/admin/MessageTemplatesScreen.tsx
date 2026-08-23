"use client";

import { useState, useMemo } from "react";
import { Mail, MessageSquare, Plus, Search, X, Edit3, Trash2, Copy, Eye, Tag } from "lucide-react";
import { AdminPageHeader } from "./ui/AdminPageHeader";

export type MessageTemplatesScreenRecord = {
  id: string;
  name: string;
  category: string;
  channel: string;
  subject: string;
  body: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MessageTemplatesScreenProps = {
  dataLoading?: boolean;
  messageTemplates: MessageTemplatesScreenRecord[];
  onCreateTemplate: (input: { name: string; category: string; channel: string; subject: string; body: string }) => void;
  onUpdateTemplate: (id: string, updates: Record<string, unknown>) => void;
  onDeleteTemplate: (id: string) => void;
  isMutating?: boolean;
};

const CATEGORY_CHIPS: string[] = ["Ride", "Delivery", "Promotion", "Account", "Safety"];

const CHANNEL_COLORS: Record<string, { bg: string; text: string }> = {
  SMS: { bg: "#1e3a5f", text: "#60a5fa" },
  PUSH: { bg: "#1a3c2a", text: "#4ade80" },
  EMAIL: { bg: "#3c2a1a", text: "#fbbf24" },
  Push: { bg: "#1a3c2a", text: "#4ade80" },
  Email: { bg: "#3c2a1a", text: "#fbbf24" },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Ride: { bg: "#1e3a5f", text: "#60a5fa" },
  Delivery: { bg: "#1a3c2a", text: "#4ade80" },
  Promotion: { bg: "#3c2a1a", text: "#fbbf24" },
  Account: { bg: "#2a1a3c", text: "#a78bfa" },
  Safety: { bg: "#3c1a1a", text: "#f87171" },
};

export function MessageTemplatesScreen({ dataLoading = false, messageTemplates, onCreateTemplate, onUpdateTemplate, onDeleteTemplate, isMutating = false }: MessageTemplatesScreenProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "All">("All");
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplatesScreenRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "Ride", channel: "SMS", subject: "", body: "" });

  const filteredTemplates = useMemo(() => {
    let templates = messageTemplates;
    if (activeCategory !== "All") {
      templates = templates.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      templates = templates.filter(
        (t) => t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
      );
    }
    return templates;
  }, [search, activeCategory, messageTemplates]);

  const activeCount = messageTemplates.filter((t) => t.active).length;
  const smsCount = messageTemplates.filter((t) => t.channel === "SMS").length;
  const pushCount = messageTemplates.filter((t) => t.channel === "Push" || t.channel === "PUSH").length;

  function submitTemplate() {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    if (editingId) {
      onUpdateTemplate(editingId, { ...form, name: form.name.trim(), subject: form.subject.trim(), body: form.body.trim() });
    } else {
      onCreateTemplate({ ...form, name: form.name.trim(), subject: form.subject.trim(), body: form.body.trim() });
    }
    setForm({ name: "", category: "Ride", channel: "SMS", subject: "", body: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(tpl: MessageTemplatesScreenRecord) {
    setEditingId(tpl.id);
    setForm({ name: tpl.name, category: tpl.category, channel: tpl.channel, subject: tpl.subject, body: tpl.body });
    setShowForm(true);
  }

  function duplicateTemplate(tpl: MessageTemplatesScreenRecord) {
    setEditingId(null);
    setForm({ name: `${tpl.name} (copy)`, category: tpl.category, channel: tpl.channel, subject: tpl.subject, body: tpl.body });
    setShowForm(true);
  }

  if (dataLoading) {
    return (
      <div className="mt-admin-screen">
        <AdminPageHeader title="Message Templates" subtitle="Reusable notification and message templates" />
        <div className="mt-loading-skeleton">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="mt-admin-screen">
      <AdminPageHeader
        title="Message Templates"
        subtitle="Reusable notification and message templates"
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => { setShowForm((v) => !v); setEditingId(null); setForm({ name: "", category: "Ride", channel: "SMS", subject: "", body: "" }); }}>
            <Plus size={14} />
            <span>{showForm ? "Close form" : "New Template"}</span>
          </button>
        }
      />

      {showForm && (
        <article className="admin-reference-card" style={{ marginBottom: 16 }}>
          <div className="admin-reference-cardhead">
            <div>
              <h3>{editingId ? "Edit Template" : "New Template"}</h3>
              <p>Create a reusable notification or message template</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label>
              Template Name
              <input className="admin-search-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ride Assigned" />
            </label>
            <label>
              Category
              <select className="admin-search-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORY_CHIPS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Channel
              <select className="admin-search-input" value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
                <option value="SMS">SMS</option>
                <option value="Push">Push</option>
                <option value="Email">Email</option>
              </select>
            </label>
            <label className="admin-form-span">
              Subject
              <input className="admin-search-input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Notification subject" />
            </label>
            <label className="admin-form-span">
              Body
              <textarea className="admin-search-input" rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Use {{variable}} for dynamic values" style={{ resize: "vertical" }} />
            </label>
          </div>
          <div className="admin-page-header-actions" style={{ marginTop: 16 }}>
            <button type="button" className="admin-btn-primary" disabled={isMutating} onClick={submitTemplate}>
              {editingId ? "Update template" : "Save template"}
            </button>
            <button type="button" className="admin-btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </article>
      )}

      <div className="mt-kpi-row">
        <div className="mt-kpi-card">
          <div className="mt-kpi-icon"><Mail size={18} /></div>
          <div className="mt-kpi-content">
            <span className="mt-kpi-value">{messageTemplates.length}</span>
            <span className="mt-kpi-label">Total Templates</span>
          </div>
        </div>
        <div className="mt-kpi-card">
          <div className="mt-kpi-icon"><MessageSquare size={18} /></div>
          <div className="mt-kpi-content">
            <span className="mt-kpi-value">{activeCount}</span>
            <span className="mt-kpi-label">Active</span>
          </div>
        </div>
        <div className="mt-kpi-card">
          <div className="mt-kpi-icon"><MessageSquare size={18} /></div>
          <div className="mt-kpi-content">
            <span className="mt-kpi-value">{smsCount}</span>
            <span className="mt-kpi-label">SMS Templates</span>
          </div>
        </div>
        <div className="mt-kpi-card">
          <div className="mt-kpi-icon"><Mail size={18} /></div>
          <div className="mt-kpi-content">
            <span className="mt-kpi-value">{pushCount}</span>
            <span className="mt-kpi-label">Push Templates</span>
          </div>
        </div>
      </div>

      <div className="mt-toolbar">
        <div className="mt-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="mt-search-clear" onClick={() => setSearch("")}>
              <X size={12} />
            </button>
          )}
        </div>
        <div className="mt-chip-group">
          {(["All", ...CATEGORY_CHIPS] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`mt-chip${activeCategory === cat ? " mt-chip--active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              <Tag size={10} />
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-table-card">
        <table className="mt-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Channel</th>
              <th>Subject / Preview</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((tpl) => (
              <tr key={tpl.id}>
                <td>
                  <span className="mt-template-name">{tpl.name}</span>
                </td>
                <td>
                  <span
                    className="mt-badge"
                    style={{ background: CATEGORY_COLORS[tpl.category]?.bg ?? "#333", color: CATEGORY_COLORS[tpl.category]?.text ?? "#ccc" }}
                  >
                    {tpl.category}
                  </span>
                </td>
                <td>
                  <span
                    className="mt-badge"
                    style={{ background: CHANNEL_COLORS[tpl.channel]?.bg ?? "#333", color: CHANNEL_COLORS[tpl.channel]?.text ?? "#ccc" }}
                  >
                    {tpl.channel}
                  </span>
                </td>
                <td>
                  <div className="mt-template-subject">{tpl.subject}</div>
                  <div className="mt-template-body">{tpl.body}</div>
                </td>
                <td>
                  <small>{new Date(tpl.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</small>
                </td>
                <td>
                  <div className="mt-action-btns">
                    <button
                      type="button"
                      className="mt-action-btn mt-action-btn--preview"
                      title="Preview"
                      onClick={() => setPreviewTemplate(tpl)}
                    >
                      <Eye size={13} />
                    </button>
                    <button type="button" className="mt-action-btn mt-action-btn--edit" title="Edit" onClick={() => startEdit(tpl)}>
                      <Edit3 size={13} />
                    </button>
                    <button type="button" className="mt-action-btn mt-action-btn--copy" title="Duplicate" onClick={() => duplicateTemplate(tpl)}>
                      <Copy size={13} />
                    </button>
                    <button type="button" className="mt-action-btn mt-action-btn--delete" title="Delete" onClick={() => { if (window.confirm(`Delete "${tpl.name}"?`)) onDeleteTemplate(tpl.id); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTemplates.length === 0 && (
          <div className="mt-empty">
            <Mail size={24} />
            <p>No templates match your search.</p>
          </div>
        )}
      </div>

      {previewTemplate && (
        <div className="mt-modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mt-modal-header">
              <h3>Template Preview</h3>
              <button type="button" className="mt-modal-close" onClick={() => setPreviewTemplate(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="mt-modal-body">
              <div className="mt-preview-row">
                <span className="mt-preview-label">Name</span>
                <span className="mt-preview-value">{previewTemplate.name}</span>
              </div>
              <div className="mt-preview-row">
                <span className="mt-preview-label">Category</span>
                <span
                  className="mt-badge"
                  style={{ background: CATEGORY_COLORS[previewTemplate.category]?.bg ?? "#333", color: CATEGORY_COLORS[previewTemplate.category]?.text ?? "#ccc" }}
                >
                  {previewTemplate.category}
                </span>
              </div>
              <div className="mt-preview-row">
                <span className="mt-preview-label">Channel</span>
                <span
                  className="mt-badge"
                  style={{ background: CHANNEL_COLORS[previewTemplate.channel]?.bg ?? "#333", color: CHANNEL_COLORS[previewTemplate.channel]?.text ?? "#ccc" }}
                >
                  {previewTemplate.channel}
                </span>
              </div>
              <div className="mt-preview-row">
                <span className="mt-preview-label">Subject</span>
                <span className="mt-preview-value">{previewTemplate.subject}</span>
              </div>
              <div className="mt-preview-row mt-preview-row--body">
                <span className="mt-preview-label">Body</span>
                <div className="mt-preview-body">{previewTemplate.body}</div>
              </div>
              <div className="mt-preview-row">
                <span className="mt-preview-label">Last Updated</span>
                <span className="mt-preview-value">{new Date(previewTemplate.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mt-admin-screen { display: flex; flex-direction: column; gap: 20px; }
        .mt-loading-skeleton { padding: 40px; text-align: center; color: var(--text-secondary, #94a3b8); }

        .mt-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .mt-kpi-card { background: var(--surface, #1e293b); border: 1px solid var(--border, #334155); border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 12px; }
        .mt-kpi-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(99, 102, 241, 0.12); color: #818cf8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mt-kpi-content { display: flex; flex-direction: column; }
        .mt-kpi-value { font-size: 1.4rem; font-weight: 700; color: var(--text-primary, #f1f5f9); line-height: 1.2; }
        .mt-kpi-label { font-size: 0.72rem; color: var(--text-secondary, #94a3b8); }

        .mt-toolbar { display: flex; flex-direction: column; gap: 12px; }
        .mt-search-box { display: flex; align-items: center; gap: 8px; background: var(--surface, #1e293b); border: 1px solid var(--border, #334155); border-radius: 8px; padding: 8px 12px; }
        .mt-search-box svg { color: var(--text-secondary, #94a3b8); flex-shrink: 0; }
        .mt-search-box input { background: transparent; border: none; outline: none; color: var(--text-primary, #f1f5f9); font-size: 0.82rem; flex: 1; }
        .mt-search-box input::placeholder { color: var(--text-secondary, #64748b); }
        .mt-search-clear { background: none; border: none; color: var(--text-secondary, #94a3b8); cursor: pointer; display: flex; padding: 2px; border-radius: 4px; }
        .mt-search-clear:hover { color: var(--text-primary, #f1f5f9); background: rgba(255,255,255,0.06); }

        .mt-chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
        .mt-chip { display: inline-flex; align-items: center; gap: 4px; background: var(--surface, #1e293b); border: 1px solid var(--border, #334155); border-radius: 20px; padding: 5px 12px; font-size: 0.72rem; color: var(--text-secondary, #94a3b8); cursor: pointer; transition: all 0.15s; }
        .mt-chip:hover { border-color: rgba(99, 102, 241, 0.4); color: var(--text-primary, #f1f5f9); }
        .mt-chip--active { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.4); color: #818cf8; }

        .mt-btn-primary { display: inline-flex; align-items: center; gap: 6px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; border-radius: 8px; padding: 8px 14px; font-size: 0.78rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .mt-btn-primary:hover { background: rgba(99, 102, 241, 0.25); }

        .mt-table-card { background: var(--surface, #1e293b); border: 1px solid var(--border, #334155); border-radius: 10px; overflow: hidden; }
        .mt-table { width: 100%; border-collapse: collapse; }
        .mt-table th { text-align: left; padding: 10px 14px; font-size: 0.7rem; font-weight: 600; color: var(--text-secondary, #94a3b8); text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border, #334155); background: rgba(0,0,0,0.15); }
        .mt-table td { padding: 10px 14px; font-size: 0.8rem; color: var(--text-primary, #f1f5f9); border-bottom: 1px solid var(--border, #1e293b); }
        .mt-table tr:last-child td { border-bottom: none; }
        .mt-table tr:hover td { background: rgba(99, 102, 241, 0.04); }

        .mt-template-name { font-weight: 600; font-size: 0.82rem; }
        .mt-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.68rem; font-weight: 600; white-space: nowrap; }
        .mt-template-subject { font-size: 0.78rem; font-weight: 500; color: var(--text-primary, #f1f5f9); margin-bottom: 2px; }
        .mt-template-body { font-size: 0.72rem; color: var(--text-secondary, #94a3b8); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .mt-action-btns { display: flex; gap: 4px; }
        .mt-action-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border, #334155); background: transparent; color: var(--text-secondary, #94a3b8); cursor: pointer; transition: all 0.15s; }
        .mt-action-btn--preview:hover { background: rgba(99, 102, 241, 0.12); color: #818cf8; border-color: rgba(99, 102, 241, 0.3); }
        .mt-action-btn--edit:hover { background: rgba(34, 197, 94, 0.12); color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
        .mt-action-btn--copy:hover { background: rgba(251, 191, 36, 0.12); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); }
        .mt-action-btn--delete:hover { background: rgba(239, 68, 68, 0.12); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

        .mt-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; color: var(--text-secondary, #64748b); }
        .mt-empty p { font-size: 0.82rem; }

        .mt-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .mt-modal { background: var(--surface, #1e293b); border: 1px solid var(--border, #334155); border-radius: 12px; width: 480px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .mt-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border, #334155); }
        .mt-modal-header h3 { font-size: 0.9rem; font-weight: 600; color: var(--text-primary, #f1f5f9); }
        .mt-modal-close { background: none; border: none; color: var(--text-secondary, #94a3b8); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
        .mt-modal-close:hover { background: rgba(255,255,255,0.06); color: var(--text-primary, #f1f5f9); }
        .mt-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .mt-preview-row { display: flex; align-items: center; gap: 12px; }
        .mt-preview-row--body { flex-direction: column; align-items: flex-start; gap: 6px; }
        .mt-preview-label { font-size: 0.7rem; font-weight: 600; color: var(--text-secondary, #94a3b8); text-transform: uppercase; letter-spacing: 0.04em; min-width: 80px; }
        .mt-preview-value { font-size: 0.82rem; color: var(--text-primary, #f1f5f9); }
        .mt-preview-body { font-size: 0.82rem; color: var(--text-primary, #f1f5f9); background: rgba(0,0,0,0.2); border: 1px solid var(--border, #334155); border-radius: 8px; padding: 12px; width: 100%; line-height: 1.5; }

        @media (max-width: 900px) {
          .mt-kpi-row { grid-template-columns: repeat(2, 1fr); }
          .mt-chip-group { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
        }
      `}</style>
    </div>
  );
}
