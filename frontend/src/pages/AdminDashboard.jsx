import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import { getUserName } from "../utils/auth";

function AdminDashboard() {
  const name = getUserName();
  const [stats,  setStats]  = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats").catch(() => ({ data: null })),
      api.get("/admin/pending").catch(() => ({ data: [] })),
    ]).then(([s, p]) => {
      setStats(s.data);
      setRecent(p.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Pending Review",  value: stats?.pending  ?? "…", color: "#f59e0b", icon: "⏳", link: "/admin/pending" },
    { label: "Approved Prices", value: stats?.approved ?? "…", color: "#10b981", icon: "✓",  link: null },
    { label: "Rejected",        value: stats?.rejected ?? "…", color: "#ef4444", icon: "✕",  link: null },
    { label: "Contributors",    value: stats?.totalUsers ?? "…", color: "#6366f1", icon: "👥", link: "/admin/users" },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: "36px" }} className="fade-up">
        <p style={{ color: "var(--accent)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          Admin · Control Panel
        </p>
        <h1 style={{ fontSize:"clamp(24px,5vw,36px)", color:"var(--text)", marginBottom: "6px" }}>
          {name ? `${name.split(" ")[0]}'s Dashboard` : "Admin Dashboard"}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Manage submissions, users, and platform configuration</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns:"repeat(2,1fr)", gap: "16px", marginBottom: "28px" }}>
        {cards.map(({ label, value, color, icon, link }, i) => {
          const inner = (
            <div
              className={`card fade-up fade-up-${i + 1}`}
              style={{ borderLeft: `3px solid ${color}`, cursor: link ? "pointer" : "default", transition: "transform 0.2s" }}
              onMouseEnter={e => { if (link) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px", width: "40px", height: "40px", background: `${color}18`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</span>
                {link && <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "500" }}>View →</span>}
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
              <h2 style={{ fontSize: "40px", fontFamily: "'DM Serif Display',serif", color: "var(--text)", lineHeight: 1 }}>
                {loading ? "…" : value}
              </h2>
            </div>
          );
          return link
            ? <Link key={label} to={link} style={{ textDecoration: "none" }}>{inner}</Link>
            : <div key={label}>{inner}</div>;
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "24px" }}>
        {/* Pending preview */}
        <div className="card fade-up fade-up-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ fontSize: "17px", color: "var(--text)", fontWeight: "600" }}>Latest Pending</h3>
            <Link to="/admin/pending" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: "500" }}>Review all →</Link>
          </div>
          {loading ? (
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading…</p>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <p style={{ fontSize: "28px", marginBottom: "8px" }}>✅</p>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>Queue is empty</p>
            </div>
          ) : (
            recent.map(item => (
              <div key={item._id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: "500", color: "var(--text)" }}>{item.commodity}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{item.marketName} · {item.district}</p>
                </div>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "18px", color: "#f59e0b" }}>₹{item.price}</p>
              </div>
            ))
          )}
        </div>

        {/* Quick actions */}
        <div className="card fade-up fade-up-4">
          <h3 style={{ fontSize: "17px", color: "var(--text)", fontWeight: "600", marginBottom: "18px" }}>Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { to: "/admin/pending", label: "Review Pending Submissions", icon: "⏳", color: "#f59e0b" },
              { to: "/admin/users",   label: "Manage Users & Admins",     icon: "👥", color: "#6366f1" },
              { to: "/admin/manage",  label: "Add Districts & Commodities",icon: "⚙", color: "#10b981" },
              { to: "/markets",       label: "View Market Prices",         icon: "🏪", color: "#e11d48" },
            ].map(({ to, label, icon, color }) => (
              <Link key={to} to={to} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 14px", borderRadius: "10px",
                  border: "1px solid var(--border)", background: "var(--surface2)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)"; }}
                >
                  <span style={{ fontSize: "18px", width: "36px", height: "36px", background: `${color}18`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
                  <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: "500" }}>{label}</span>
                  <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "14px" }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AdminDashboard;
