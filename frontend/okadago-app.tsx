import { useState } from "react";

const Y = "#F5C800";
const YD = "#C9A200";
const BG = "#111111";
const CARD = "#1A1A1A";
const CARD2 = "#222222";
const BORDER = "#2A2A2A";
const TEXT = "#FFFFFF";
const MUTED = "#888888";
const SOFT = "#BBBBBB";
const GREEN = "#22C55E";
const RED = "#EF4444";

// ── Icons (SVG inline) ──────────────────────────────────────────────
const Icon = ({ d, size = 20, color = TEXT, fill = "none", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const HomeIco = ({ c }) => <Icon d="M3 12L12 3l9 9v9h-6v-6H9v6H3z" color={c} fill={c} strokeWidth={0} size={22} />;
const EarnIco = ({ c }) => <Icon d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4v2m0 8v2m-3-7c0-.83.9-1.5 2-1.5h2c1.1 0 2 .67 2 1.5S14.1 12 13 12h-2c-1.1 0-2 .67-2 1.5S9.9 15 11 15h2c1.1 0 2-.67 2-1.5" color={c} size={22} />;
const TripsIco = ({ c }) => <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" color={c} size={22} />;
const WalletIco = ({ c }) => <Icon d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm18 4H2" color={c} size={22} />;
const ProfileIco = ({ c }) => <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 110 8 4 4 0 010-8z" color={c} size={22} />;

const NAV = [
  { id: "dashboard", label: "Home", Ico: HomeIco },
  { id: "earnings", label: "Earnings", Ico: EarnIco },
  { id: "trips", label: "Trips", Ico: TripsIco },
  { id: "wallet", label: "Wallet", Ico: WalletIco },
  { id: "profile", label: "Profile", Ico: ProfileIco },
];

// ── Reusable ──────────────────────────────────────────────────────
function TopBar({ title, back, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {back && (
          <button onClick={onBack} style={{ background: CARD2, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon d="M15 18l-6-6 6-6" color={TEXT} size={18} />
          </button>
        )}
        <span style={{ color: TEXT, fontSize: 17, fontWeight: 700 }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

function YBtn({ label, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{ background: Y, border: "none", borderRadius: 12, padding: "15px", width: "100%", color: "#000", fontWeight: 800, fontSize: 15, cursor: "pointer", ...style }}>
      {label}
    </button>
  );
}

function Row({ label, value, valueColor = SOFT, border = true }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderBottom: border ? `1px solid ${BORDER}` : "none" }}>
      <span style={{ color: MUTED, fontSize: 14 }}>{label}</span>
      <span style={{ color: valueColor, fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ── Splash / Login ────────────────────────────────────────────────
function SplashScreen({ go }) {
  return (
    <div style={{ background: Y, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 28px 40px" }}>
      <div>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#000", letterSpacing: "-0.04em", lineHeight: 1.1 }}>Okada<span style={{ color: "#000" }}>Go</span></div>
        <div style={{ color: "#333", fontSize: 13, marginTop: 4 }}>Move · Deliver · Earn</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56 }}>🏍️</div>
        <div style={{ background: "rgba(0,0,0,0.08)", borderRadius: 16, padding: "20px", marginTop: 20 }}>
          <div style={{ color: "#000", fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>Every trip</div>
          <div style={{ color: "#000", fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>takes you forward</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={() => go("dashboard")} style={{ background: "#000", border: "none", borderRadius: 12, padding: "16px", color: Y, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
          Login
        </button>
        <button onClick={() => go("dashboard")} style={{ background: "rgba(0,0,0,0.12)", border: "none", borderRadius: 12, padding: "16px", color: "#000", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          Sign Up
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
function DashboardScreen({ go }) {
  const [online, setOnline] = useState(true);
  const bars = [22, 38, 28, 45, 35, 52, 40];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {/* Header */}
      <div style={{ background: CARD, padding: "14px 18px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => go("menu")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 22, height: 2, background: TEXT, borderRadius: 2 }} />)}
            </div>
          </button>
          <span style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>Dashboard</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: Y, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔔</div>
        </div>
        {/* Online toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: online ? GREEN : RED }} />
          <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{online ? "Online" : "Offline"}</span>
          <div onClick={() => setOnline(v => !v)} style={{ marginLeft: "auto", width: 48, height: 26, borderRadius: 13, background: online ? GREEN : BORDER, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: online ? 25 : 3, transition: "left 0.2s" }} />
          </div>
        </div>
      </div>

      {/* Earnings card */}
      <div style={{ background: CARD, margin: 14, borderRadius: 16, padding: "18px 20px", border: `1px solid ${BORDER}` }}>
        <div style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>Today's Earnings</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: TEXT, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>GHS 152.50</div>
          <div style={{ background: Y, borderRadius: 10, padding: "6px 10px", fontSize: 18 }}>💰</div>
        </div>
        <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>5 Trips</div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          {[
            { label: "Online Time", value: "3h 45m" },
            { label: "Completed", value: "5" },
            { label: "Cancelled", value: "0" },
            { label: "Rating", value: "★ 4.8" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: MUTED, fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { icon: "🟢", label: "Go Online", action: () => setOnline(true) },
            { icon: "💵", label: "My Earnings", action: () => go("earnings") },
            { icon: "🎁", label: "Incentives", action: () => go("incentives") },
            { icon: "🎧", label: "Support", action: () => {} },
          ].map(a => (
            <button key={a.label} onClick={a.action} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ color: SOFT, fontSize: 10, fontWeight: 600, textAlign: "center" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div style={{ margin: "0 14px 14px", background: CARD, borderRadius: 16, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>Performance</span>
          <span style={{ color: Y, fontSize: 12, fontWeight: 600 }}>This Week ▾</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: `${h}px`, background: i === 6 ? Y : CARD2, borderRadius: "3px 3px 0 0" }} />
              <div style={{ color: MUTED, fontSize: 9 }}>{days[i]}</div>
            </div>
          ))}
        </div>
        <div style={{ color: GREEN, fontSize: 12, marginTop: 10, textAlign: "center" }}>You're doing great! Keep it up 🔥</div>
      </div>

      {/* Incoming Request */}
      <div style={{ margin: "0 14px 80px" }}>
        <YBtn label="Simulate Incoming Request" onClick={() => go("request")} />
      </div>
    </div>
  );
}

// ── Request Incoming ──────────────────────────────────────────────
function RequestScreen({ go }) {
  const [timer, setTimer] = useState(15);
  useState(() => {
    const t = setInterval(() => setTimer(v => v > 0 ? v - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Map area */}
      <div style={{ flex: 1, background: "#1a1a2e", position: "relative", overflow: "hidden" }}>
        <svg width="100%" height="100%" style={{ opacity: 0.6 }}>
          {[...Array(15)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 30} x2="100%" y2={i * 30} stroke="#252540" strokeWidth="1" />)}
          {[...Array(12)].map((_, i) => <line key={`v${i}`} x1={i * 35} y1="0" x2={i * 35} y2="100%" stroke="#252540" strokeWidth="1" />)}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#2A2A50" strokeWidth="10" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#2A2A50" strokeWidth="8" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#2A2A50" strokeWidth="6" />
          <polyline points="30%,200 30%,50% 70%,50% 70%,120" stroke={Y} strokeWidth="3" fill="none" strokeDasharray="8 4" />
          <circle cx="30%" cy="200" r="10" fill={GREEN} />
          <circle cx="70%" cy="120" r="10" fill={RED} />
          <text x="30%" y="204" textAnchor="middle" fontSize="9" fill="#fff">P</text>
          <text x="70%" y="124" textAnchor="middle" fontSize="9" fill="#fff">D</text>
          <circle cx="50%" cy="50%" r="14" fill={Y} />
          <text x="50%" y="155" textAnchor="middle" fontSize="14">🏍</text>
        </svg>
        {/* Timer ring */}
        <div style={{ position: "absolute", bottom: 16, left: 16, width: 52, height: 52, borderRadius: "50%", background: "#000", border: `3px solid ${Y}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: Y, fontWeight: 900, fontSize: 18 }}>{timer}</span>
        </div>
        {/* Sound */}
        <div style={{ position: "absolute", top: 12, right: 16, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 12 }}>🔊</div>
      </div>

      {/* Bottom sheet */}
      <div style={{ background: CARD, borderRadius: "20px 20px 0 0", padding: "20px 18px 32px", border: `1px solid ${BORDER}` }}>
        <div style={{ textAlign: "center", color: TEXT, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Request Incoming</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ color: MUTED, fontSize: 11 }}>Pickup</div>
              <div style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>East Legon, Accra</div>
              <div style={{ color: MUTED, fontSize: 11 }}>1.2 km away</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: RED, marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ color: MUTED, fontSize: 11 }}>Drop-off</div>
              <div style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>Osu, Accra</div>
              <div style={{ color: MUTED, fontSize: 11 }}>6.5 km away</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, background: CARD2, borderRadius: 10, padding: "12px 14px" }}>
          <div>
            <div style={{ color: MUTED, fontSize: 11 }}>Fare</div>
            <div style={{ color: TEXT, fontSize: 20, fontWeight: 900 }}>GHS 18.00</div>
          </div>
          <div style={{ background: GREEN, borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700 }}>Cash</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => go("dashboard")} style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "15px", color: SOFT, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Decline
          </button>
          <button onClick={() => go("ontrip")} style={{ flex: 2, background: Y, border: "none", borderRadius: 12, padding: "15px", color: "#000", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// ── On Trip ────────────────────────────────────────────────────────
function OnTripScreen({ go }) {
  const [arrived, setArrived] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Map */}
      <div style={{ flex: 1, background: "#1a1a2e", position: "relative", overflow: "hidden" }}>
        <svg width="100%" height="100%" style={{ opacity: 0.6 }}>
          {[...Array(15)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 30} x2="100%" y2={i * 30} stroke="#252540" strokeWidth="1" />)}
          {[...Array(12)].map((_, i) => <line key={`v${i}`} x1={i * 35} y1="0" x2={i * 35} y2="100%" stroke="#252540" strokeWidth="1" />)}
          <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#2A2A50" strokeWidth="10" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#2A2A50" strokeWidth="8" />
          <polyline points="50%,260 50%,40% 75%,40% 75%,80" stroke={Y} strokeWidth="3" fill="none" strokeDasharray="8 4" />
          <circle cx="50%" cy="260" r="10" fill={GREEN} />
          <circle cx="75%" cy="80" r="10" fill={RED} />
          <circle cx="55%" cy="40%" r="14" fill={Y} />
          <text x="55%" y="155" textAnchor="middle" fontSize="14">🏍</text>
        </svg>
        {/* SOS */}
        <div style={{ position: "absolute", top: 12, right: 16, background: RED, borderRadius: 8, padding: "6px 14px", color: "#fff", fontWeight: 800, fontSize: 12 }}>SOS</div>
      </div>

      {/* Bottom */}
      <div style={{ background: CARD, borderRadius: "20px 20px 0 0", padding: "16px 18px 32px" }}>
        {/* Rider info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `2px solid ${Y}` }}>🧑</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>Kwame Mensah</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {"★★★★★".split("").map((s, i) => <span key={i} style={{ color: Y, fontSize: 11 }}>{s}</span>)}
              <span style={{ color: MUTED, fontSize: 11, marginLeft: 2 }}>4.8</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>💬</div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: Y, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>📞</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN }} />
              <div style={{ width: 1, height: 16, background: BORDER }} />
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: RED }} />
            </div>
            <div>
              <div style={{ color: MUTED, fontSize: 10, marginBottom: 1 }}>Pickup</div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>East Legon, Accra</div>
              <div style={{ color: MUTED, fontSize: 10, marginBottom: 1 }}>Drop-off</div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 600 }}>Osu, Accra</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: MUTED, fontSize: 10 }}>Distance</div>
              <div style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>6.5 km</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: MUTED, fontSize: 10 }}>Time</div>
              <div style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>18 min</div>
            </div>
          </div>
        </div>

        <YBtn
          label={arrived ? "Complete Trip ✓" : "Arrived at Pickup"}
          onClick={() => arrived ? go("dashboard") : setArrived(true)}
        />
      </div>
    </div>
  );
}

// ── Earnings ───────────────────────────────────────────────────────
function EarningsScreen() {
  const [tab, setTab] = useState("Day");
  const history = [
    { date: "May 10, 2024", amount: "GHS 152.50" },
    { date: "May 9, 2024", amount: "GHS 98.00" },
    { date: "May 8, 2024", amount: "GHS 120.00" },
    { date: "May 7, 2024", amount: "GHS 76.50" },
  ];

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <TopBar title="Earnings" right={<div style={{ fontSize: 18 }}>📅</div>} />

      {/* Tabs */}
      <div style={{ display: "flex", margin: "0 14px 16px", background: CARD2, borderRadius: 10, padding: 4 }}>
        {["Day", "Week", "Month"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? Y : "transparent", border: "none", borderRadius: 8, padding: "8px", color: tab === t ? "#000" : MUTED, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Today total */}
      <div style={{ margin: "0 14px 16px", background: CARD, borderRadius: 16, padding: "18px 20px", border: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 6 }}>Today's Earnings</div>
            <div style={{ color: TEXT, fontSize: 28, fontWeight: 900 }}>GHS 152.50</div>
          </div>
          <div style={{ fontSize: 20 }}>📅</div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Row label="Base Fare" value="GHS 110.00" />
          <Row label="Incentives" value="GHS 30.00" valueColor={Y} />
          <Row label="Tips" value="GHS 12.50" valueColor={GREEN} />
          <Row label="Other" value="GHS 0.00" border={false} />
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 4, borderTop: `1px solid ${BORDER}` }}>
            <span style={{ color: MUTED, fontSize: 13 }}>Total Trips</span>
            <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>5</span>
          </div>
        </div>
      </div>

      <div style={{ margin: "0 14px 14px" }}>
        <YBtn label="Cash Out" />
      </div>

      {/* History */}
      <div style={{ margin: "0 14px 80px", background: CARD, borderRadius: 16, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
        <div style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Earnings History</div>
        {history.map((h, i) => (
          <Row key={i} label={h.date} value={h.amount} valueColor={TEXT} border={i < history.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ── Trips History ─────────────────────────────────────────────────
function TripsScreen() {
  const trips = [
    { date: "May 10, 2024", from: "East Legon, Accra", to: "Osu, Accra", time: "09:45 AM", amount: "GHS 18.00", method: "Cash" },
    { date: "May 10, 2024", from: "Madina, Accra", to: "Airport City, Accra", time: "08:30 AM", amount: "GHS 25.00", method: "Cash" },
    { date: "May 10, 2024", from: "Lapaz, Accra", to: "Kaneshie, Accra", time: "07:15 AM", amount: "GHS 15.00", method: "Cash" },
    { date: "May 9, 2024", from: "East Legon, Accra", to: "Adabraka, Accra", time: "06:30 PM", amount: "GHS 20.00", method: "Cash" },
    { date: "May 9, 2024", from: "Osu, Accra", to: "North Ridge, Accra", time: "05:10 PM", amount: "GHS 18.00", method: "Cash" },
  ];

  const grouped = trips.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <TopBar title="Trips History" right={<div style={{ color: Y, fontSize: 13, fontWeight: 600 }}>All ▾</div>} />
      <div style={{ padding: "0 14px 80px" }}>
        {Object.entries(grouped).map(([date, list]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ color: MUTED, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{date}</div>
            {list.map((trip, i) => (
              <div key={i} style={{ background: CARD, borderRadius: 12, padding: "14px 16px", marginBottom: 8, border: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ paddingTop: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
                      <div style={{ width: 1, height: 12, background: BORDER }} />
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: RED }} />
                    </div>
                    <div>
                      <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{trip.from}</div>
                      <div style={{ color: SOFT, fontSize: 13 }}>{trip.to}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>{trip.amount}</div>
                    <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{trip.time}</div>
                  </div>
                </div>
                <div style={{ color: MUTED, fontSize: 11, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>{trip.method}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Wallet ─────────────────────────────────────────────────────────
function WalletScreen() {
  const methods = [
    { icon: "📱", name: "MTN Mobile Money", detail: "024 123 4567", linked: true },
    { icon: "📱", name: "Vodafone Cash", detail: "020 123 4567", linked: false },
    { icon: "🏦", name: "Bank Transfer", detail: "•••• 4242", linked: false },
  ];
  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <TopBar title="Wallet" />
      {/* Balance card */}
      <div style={{ margin: "0 14px 16px", background: `linear-gradient(135deg, ${Y} 0%, ${YD} 100%)`, borderRadius: 16, padding: "24px 20px" }}>
        <div style={{ color: "rgba(0,0,0,0.6)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Wallet Balance</div>
        <div style={{ color: "#000", fontSize: 28, fontWeight: 900 }}>GHS 120.50</div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 8, padding: "6px 12px", fontSize: 18 }}>💳</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 14px 16px" }}>
        <YBtn label="Cash Out" style={{ flex: 1 }} />
        <button style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "15px", color: TEXT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Transaction History
        </button>
      </div>

      {/* Payout methods */}
      <div style={{ margin: "0 14px 80px", background: CARD, borderRadius: 16, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
        <div style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Payout Methods</div>
        {methods.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i < methods.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: CARD2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{m.name}</div>
              <div style={{ color: MUTED, fontSize: 11 }}>{m.detail}</div>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${m.linked ? Y : BORDER}`, background: m.linked ? Y : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {m.linked && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#000" }} />}
            </div>
          </div>
        ))}
        <button style={{ width: "100%", marginTop: 14, background: "transparent", border: `1px dashed ${BORDER}`, borderRadius: 10, padding: "13px", color: Y, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          + Add Payout Method
        </button>
      </div>
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────────────
function ProfileScreen({ go }) {
  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <TopBar title="Profile" />
      <div style={{ margin: "0 14px 16px", background: CARD, borderRadius: 16, padding: "20px", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: CARD2, border: `3px solid ${Y}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🧑</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: TEXT, fontSize: 16, fontWeight: 800 }}>Kwame Mensah</div>
          <div style={{ color: MUTED, fontSize: 12 }}>+233 20 123 4567</div>
          <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
            {"★★★★★".split("").map((s, i) => <span key={i} style={{ color: Y, fontSize: 12 }}>{s}</span>)}
            <span style={{ color: MUTED, fontSize: 11, marginLeft: 3 }}>4.8</span>
          </div>
        </div>
      </div>

      {/* Vehicle info */}
      <div style={{ margin: "0 14px 12px", background: CARD, borderRadius: 14, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
        <div style={{ color: TEXT, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Vehicle Information</div>
        <Row label="Plate Number" value="GG 1234-20" />
        <Row label="Vehicle Type" value="Bajaj Boxer" border={false} />
      </div>

      {/* Account info */}
      <div style={{ margin: "0 14px 14px", background: CARD, borderRadius: 14, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
        <div style={{ color: TEXT, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Account Information</div>
        <Row label="Email" value="kwamem@gmail.com" />
        <Row label="Joined" value="April 15, 2024" border={false} />
      </div>

      <div style={{ margin: "0 14px 80px" }}>
        <YBtn label="Edit Profile" />
      </div>
    </div>
  );
}

// ── Incentives ────────────────────────────────────────────────────
function IncentivesScreen({ go }) {
  const [tab, setTab] = useState("Ongoing");
  const bonuses = [
    { title: "5 Trips Bonus", desc: "Complete 5 trips today", reward: "GHS 20", progress: 3, total: 5 },
    { title: "10 Trips Bonus", desc: "Complete 10 trips today", reward: "GHS 40", progress: 3, total: 10 },
    { title: "Peak Hours Bonus", desc: "Complete 3 trips (5PM – 8PM)", reward: "GHS 15", progress: 1, total: 3 },
  ];
  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <TopBar title="Incentives" back onBack={() => go("dashboard")} />
      <div style={{ margin: "0 14px 16px", background: `linear-gradient(135deg, ${Y} 0%, #E6A800 100%)`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ color: "#000", fontSize: 13, fontWeight: 700 }}>Complete more trips</div>
        <div style={{ color: "#000", fontSize: 13, fontWeight: 700 }}>earn more rewards!</div>
        <div style={{ marginTop: 8, fontSize: 24 }}>🎁</div>
      </div>

      <div style={{ display: "flex", margin: "0 14px 16px", background: CARD2, borderRadius: 10, padding: 4 }}>
        {["Ongoing", "Completed"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? Y : "transparent", border: "none", borderRadius: 8, padding: "8px", color: tab === t ? "#000" : MUTED, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 14px 80px", display: "flex", flexDirection: "column", gap: 12 }}>
        {bonuses.map((b, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 14, padding: "16px 18px", border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>{b.title}</div>
              <div style={{ color: Y, fontSize: 14, fontWeight: 800 }}>{b.reward}</div>
            </div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>{b.desc}</div>
            <div style={{ background: BORDER, borderRadius: 4, height: 6, marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${(b.progress / b.total) * 100}%`, background: Y, borderRadius: 4 }} />
            </div>
            <div style={{ color: MUTED, fontSize: 11 }}>{b.progress} / {b.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Menu ───────────────────────────────────────────────────────────
function MenuScreen({ go }) {
  const items = [
    { icon: "🏠", label: "Dashboard", screen: "dashboard" },
    { icon: "💵", label: "My Earnings", screen: "earnings" },
    { icon: "📋", label: "Trips History", screen: "trips" },
    { icon: "💳", label: "Wallet", screen: "wallet" },
    { icon: "🎁", label: "Incentives", screen: "incentives" },
    { icon: "⭐", label: "Ratings", screen: null },
    { icon: "🎧", label: "Support Center", screen: null },
    { icon: "⚙️", label: "Settings", screen: "settings" },
  ];
  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <TopBar title="Menu" right={<button onClick={() => go("dashboard")} style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED, fontSize: 20 }}>✕</button>} />
      {/* Profile row */}
      <div style={{ margin: "0 14px 20px", display: "flex", alignItems: "center", gap: 14, background: CARD, borderRadius: 14, padding: "16px" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: CARD2, border: `2px solid ${Y}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧑</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: TEXT, fontSize: 15, fontWeight: 700 }}>Kwame Mensah</div>
          <div style={{ color: MUTED, fontSize: 12 }}>+233 20 123 4567</div>
          <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
            {"★★★★★".split("").map((s, i) => <span key={i} style={{ color: Y, fontSize: 11 }}>{s}</span>)}
            <span style={{ color: MUTED, fontSize: 11, marginLeft: 2 }}>4.8</span>
          </div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN }} />
        <span style={{ color: GREEN, fontSize: 11, fontWeight: 600 }}>Online</span>
      </div>

      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item, i) => (
          <button key={i} onClick={() => item.screen && go(item.screen)} style={{ display: "flex", alignItems: "center", gap: 14, background: "transparent", border: "none", padding: "14px 4px", cursor: "pointer", borderBottom: `1px solid ${BORDER}`, width: "100%" }}>
            <span style={{ fontSize: 20, width: 28 }}>{item.icon}</span>
            <span style={{ color: TEXT, fontSize: 14, fontWeight: 500, flex: 1, textAlign: "left" }}>{item.label}</span>
            <Icon d="M9 18l6-6-6-6" color={MUTED} size={16} />
          </button>
        ))}
        <button style={{ display: "flex", alignItems: "center", gap: 14, background: "transparent", border: "none", padding: "14px 4px", cursor: "pointer", width: "100%", marginTop: 8 }}>
          <span style={{ fontSize: 20, width: 28 }}>🚪</span>
          <span style={{ color: RED, fontSize: 14, fontWeight: 600 }}>Logout</span>
        </button>
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────
function SettingsScreen({ go }) {
  const items = [
    { label: "General" },
    { label: "Notifications" },
    { label: "Privacy" },
    { label: "Language", value: "English" },
    { label: "Change Password" },
    { label: "Support Center" },
    { label: "About OkadaGo Rider" },
  ];
  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      <TopBar title="Settings" back onBack={() => go("menu")} />
      <div style={{ margin: "0 14px 80px", background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: i < items.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <span style={{ color: TEXT, fontSize: 14 }}>{item.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {item.value && <span style={{ color: MUTED, fontSize: 13 }}>{item.value}</span>}
              <Icon d="M9 18l6-6-6-6" color={MUTED} size={16} />
            </div>
          </div>
        ))}
        <div style={{ padding: "15px 18px" }}>
          <span style={{ color: RED, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Logout</span>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────
const FULL_SCREENS = ["splash", "request", "ontrip"];
const BACK_SCREENS = ["incentives", "menu", "settings"];

export default function App() {
  const [screen, setScreen] = useState("splash");

  const go = (s) => setScreen(s);

  const screens = {
    splash: <SplashScreen go={go} />,
    dashboard: <DashboardScreen go={go} />,
    request: <RequestScreen go={go} />,
    ontrip: <OnTripScreen go={go} />,
    earnings: <EarningsScreen />,
    trips: <TripsScreen />,
    wallet: <WalletScreen />,
    profile: <ProfileScreen go={go} />,
    incentives: <IncentivesScreen go={go} />,
    menu: <MenuScreen go={go} />,
    settings: <SettingsScreen go={go} />,
  };

  const showNav = !FULL_SCREENS.includes(screen) && !BACK_SCREENS.includes(screen);
  const navMap = { dashboard: "dashboard", earnings: "earnings", trips: "trips", wallet: "wallet", profile: "profile" };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#050505", fontFamily: "'Inter','SF Pro Display',-apple-system,sans-serif" }}>
      <div style={{ width: 390, height: 844, background: BG, borderRadius: 44, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px #222" }}>
        {/* Status bar */}
        {screen !== "splash" && (
          <div style={{ background: BG, padding: "12px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, zIndex: 10 }}>
            <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>9:41</span>
            <div style={{ width: 90, height: 14, background: "#000", borderRadius: 7 }} />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ color: TEXT, fontSize: 11 }}>📶</span>
              <span style={{ color: TEXT, fontSize: 11 }}>WiFi</span>
              <div style={{ width: 18, height: 10, border: `1.5px solid ${TEXT}`, borderRadius: 2, display: "flex", alignItems: "center", padding: "1px" }}>
                <div style={{ height: "100%", width: "75%", background: GREEN, borderRadius: 1 }} />
              </div>
            </div>
          </div>
        )}

        {/* Screen */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {screens[screen]}
        </div>

        {/* Bottom Nav */}
        {showNav && (
          <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, padding: "10px 8px 20px", display: "flex", flexShrink: 0 }}>
            {NAV.map(item => {
              const active = navMap[screen] === item.id || screen === item.id;
              return (
                <button key={item.id} onClick={() => go(item.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}>
                  <item.Ico c={active ? Y : MUTED} />
                  <span style={{ color: active ? Y : MUTED, fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
