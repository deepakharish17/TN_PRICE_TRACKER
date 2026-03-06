import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import { getUserName } from "../utils/auth";

const COMMODITY_ICONS = {
  "Tomato": "🍅", "Onion": "🧅", "Potato": "🥔",
  "Rice (Raw)": "🍚", "Rice (Boiled)": "🍚", "Wheat": "🌾",
  "Tur Dal": "🫘", "Chana Dal": "🫘", "Moong Dal": "🫘",
  "Groundnut Oil": "🫒", "Coconut Oil": "🥥", "Milk": "🥛",
  "Eggs (dozen)": "🥚", "Banana": "🍌", "Brinjal": "🍆", "Carrot": "🥕",
};
const getIcon = (name) => COMMODITY_ICONS[name] || "🌿";

const STATIC_STATS = [
  { label: "Tracked Commodities", value: "12", delta: "+2 this week",  color: "#f59e0b", icon: "🌾" },
  { label: "Markets Covered",     value: "25", delta: "+3 this month", color: "#10b981", icon: "🏪" },
  { label: "Price Updates Today", value: "48", delta: "Live",          color: "#6366f1", icon: "📊" },
];

function Dashboard() {
  const name = getUserName();
  const [myPrices, setMyPrices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/price/my").catch(() => ({ data: [] })),
      api.get("/notifications").catch(() => ({ data: [] })),
    ]).then(([p, n]) => {
      setMyPrices(p.data.slice(0, 3));
      setUnreadCount(n.data.filter(x => !x.read).length);
    }).finally(() => setLoading(false));
  }, []);

  const approved = myPrices.filter(p => p.status === "approved").length;

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "40px" }} className="fade-up">
        <p style={{ color: "var(--accent)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          Overview
        </p>
        <h1 style={{ fontSize: "36px", color: "var(--text)", marginBottom: "6px" }}>
          {name ? `Hello, ${name.split(" ")[0]} 👋` : "Market Dashboard"}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>
          Real-time commodity price monitoring across Tamil Nadu
        </p>
      </div>

      {/* User quick stats */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "My Submissions",       value: String(myPrices.length), color: "#6366f1", icon: "📋", link: "/my" },
            { label: "Approved",             value: String(approved),        color: "#10b981", icon: "✓",  link: "/my" },
            { label: "Unread Notifications", value: String(unreadCount),     color: "#f59e0b", icon: "🔔", link: "/notifications" },
          ].map(({ label, value, color, icon, link }, i) => (
            <Link key={label} to={link} style={{ textDecoration: "none" }}>
              <div
                className={`card fade-up fade-up-${i + 1}`}
                style={{ borderTop: `2px solid ${color}`, cursor: "pointer", transition: "transform 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <span style={{ fontSize: "18px", width: "40px", height: "40px", background: `${color}18`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: "11px", color, fontWeight: "600" }}>View →</span>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "4px" }}>{label}</p>
                <h2 style={{ fontSize: "40px", fontFamily: "'DM Serif Display', serif", color: "var(--text)", lineHeight: 1 }}>{value}</h2>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Platform stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "32px" }}>
        {STATIC_STATS.map(({ label, value, delta, color, icon }, i) => (
          <div key={label} className={`card fade-up fade-up-${i + 4}`} style={{ cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "22px", width: "44px", height: "44px", background: `${color}18`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
              </span>
              <span style={{ fontSize: "11px", fontWeight: "600", color, background: `${color}18`, padding: "4px 10px", borderRadius: "99px", border: `1px solid ${color}30` }}>
                {delta}
              </span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "4px" }}>{label}</p>
            <h2 style={{ fontSize: "40px", fontFamily: "'DM Serif Display', serif", color: "var(--text)", lineHeight: 1 }}>{value}</h2>
            <div style={{ height: "2px", borderRadius: "2px", background: `linear-gradient(90deg, ${color}, transparent)`, marginTop: "16px" }} />
          </div>
        ))}
      </div>

      {/* Recent submissions */}
      <div className="card fade-up" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", color: "var(--text)", fontWeight: "600" }}>Recent Submissions</h3>
          <Link to="/my" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: "500" }}>View all →</Link>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", fontSize: "14px", padding: "20px 0" }}>Loading…</p>
        ) : myPrices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>You haven't submitted any prices yet.</p>
            <Link to="/add">
              <button className="btn" style={{ padding: "10px 20px", fontSize: "13px" }}>Add your first price →</button>
            </Link>
          </div>
        ) : (
          myPrices.map((item) => {
            const statusColor = item.status === "approved" ? "#10b981" : item.status === "rejected" ? "#ef4444" : "#f59e0b";
            return (
              <div key={item._id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                  {getIcon(item.commodity)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: "500", color: "var(--text)" }}>{item.commodity}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{item.marketName} · {item.district}</p>
                </div>
                <p style={{ fontSize: "16px", fontWeight: "600", color: "#f59e0b" }}>₹{item.price}/kg</p>
                <span style={{ fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "99px", background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30`, textTransform: "capitalize" }}>
                  {item.status}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* CTA */}
      <div className="card fade-up" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.08))", border: "1px solid rgba(245,158,11,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "6px" }}>Contribute today</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>Help farmers and buyers with accurate, up-to-date market prices</p>
        </div>
        <Link to="/add">
          <button className="btn" style={{ whiteSpace: "nowrap" }}>Add Price →</button>
        </Link>
      </div>
    </Layout>
  );
}

export default Dashboard;
