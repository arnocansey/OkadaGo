import { Bell, Send, Users, Megaphone } from "lucide-react";
import { useState } from "react";
import { EmptyCard } from "./EmptyCard";

type NotificationForm = {
  title: string;
  body: string;
  audience: "all" | "riders" | "passengers";
};

export type NotificationsScreenProps = {
  ridersCount: number;
  passengersCount: number;
};

export function NotificationsScreen({ ridersCount, passengersCount }: NotificationsScreenProps) {
  const [form, setForm] = useState<NotificationForm>({
    title: "",
    body: "",
    audience: "all"
  });
  const [sent, setSent] = useState<{ title: string; audience: string; sentAt: string }[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!form.title || !form.body) return;
    setIsSending(true);
    // Placeholder: real implementation would call /admin/notifications POST
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSent((prev) => [
      { title: form.title, audience: form.audience, sentAt: new Date().toISOString() },
      ...prev
    ]);
    setForm({ title: "", body: "", audience: "all" });
    setIsSending(false);
  };

  const audienceCount =
    form.audience === "riders" ? ridersCount : form.audience === "passengers" ? passengersCount : ridersCount + passengersCount;

  return (
    <div className="exact-admin-screen">
      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Bell size={22} /></div>
          <div>
            <span>Total Reach</span>
            <strong>{ridersCount + passengersCount}</strong>
            <small>All registered users</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Users size={22} /></div>
          <div>
            <span>Riders</span>
            <strong>{ridersCount}</strong>
            <small>Supply pool</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Users size={22} /></div>
          <div>
            <span>Passengers</span>
            <strong>{passengersCount}</strong>
            <small>Demand base</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Megaphone size={22} /></div>
          <div>
            <span>Broadcasts Sent</span>
            <strong>{sent.length}</strong>
            <small>This session</small>
          </div>
        </article>
      </section>

      <div className="admin-screen-grid-2">
        {/* Compose */}
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Broadcast Notification</h3>
              <p>Send push alerts to riders, passengers, or all users.</p>
            </div>
          </div>
          <div className="admin-form">
            <label>
              Audience
              <select
                className="admin-input"
                value={form.audience}
                onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value as NotificationForm["audience"] }))}
              >
                <option value="all">All users ({ridersCount + passengersCount})</option>
                <option value="riders">Riders only ({ridersCount})</option>
                <option value="passengers">Passengers only ({passengersCount})</option>
              </select>
            </label>
            <label>
              Notification Title
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Service Update"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={100}
              />
            </label>
            <label>
              Message Body
              <textarea
                className="admin-input"
                placeholder="Enter your notification message..."
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                rows={4}
                maxLength={500}
              />
            </label>

            <div className="admin-notification-preview">
              <div className="admin-notification-preview-card">
                <Bell size={14} />
                <div>
                  <strong>{form.title || "Notification Title"}</strong>
                  <p>{form.body || "Your message will appear here..."}</p>
                </div>
              </div>
              <small>Preview · Will be sent to {audienceCount} users</small>
            </div>

            <button
              type="button"
              className="button"
              disabled={isSending || !form.title || !form.body}
              onClick={handleSend}
            >
              <Send size={14} style={{ marginRight: 6 }} />
              {isSending ? "Sending..." : `Send to ${audienceCount} users`}
            </button>

            <div className="admin-notification-note">
              <strong>Note:</strong> This UI is ready for backend integration.
              Connect to <code>/admin/notifications</code> POST endpoint to activate push delivery.
            </div>
          </div>
        </article>

        {/* History */}
        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Sent This Session</h3></div>
            </div>
            {sent.length === 0 ? (
              <EmptyCard title="No notifications sent yet." body="Your sent broadcasts will appear here." />
            ) : (
              <ul className="admin-reference-list">
                {sent.map((item, index) => (
                  <li key={index} className="admin-reference-list-row">
                    <Bell size={14} />
                    <div>
                      <strong>{item.title}</strong>
                      <small>Audience: {item.audience}</small>
                    </div>
                    <small>{new Date(item.sentAt).toLocaleTimeString("en-GH")}</small>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Tips for Effective Alerts</h3></div>
            </div>
            <ul style={{ padding: "8px 0", listStyle: "none" }}>
              {[
                "Keep titles under 50 characters for best visibility.",
                "Use action words: 'New surge zone active' > 'Surge update'.",
                "Send to riders for operational alerts.",
                "Send to passengers for promotions and feature announcements.",
                "Avoid sending more than 3 broadcasts per day."
              ].map((tip, i) => (
                <li key={i} style={{ padding: "6px 0", fontSize: 13, borderBottom: "1px solid #f3f4f6" }}>
                  {tip}
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </div>
  );
}
