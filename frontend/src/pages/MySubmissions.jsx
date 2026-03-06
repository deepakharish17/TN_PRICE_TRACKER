import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

const COMMODITY_ICONS = {
  "Tomato": "🍅",
  "Onion": "🧅",
  "Potato": "🥔",
  "Rice (Raw)": "🍚",
  "Rice (Boiled)": "🍚",
  "Wheat": "🌾",
  "Tur Dal": "🫘",
  "Chana Dal": "🫘",
  "Moong Dal": "🫘",
  "Groundnut Oil": "🫒",
  "Coconut Oil": "🥥",
  "Milk": "🥛",
  "Eggs (dozen)": "🥚",
  "Banana": "🍌",
  "Brinjal": "🍆",
  "Carrot": "🥕",
};

const getCommodityIcon = (name) => COMMODITY_ICONS[name] || "🌿";

const STATUS_CONFIG = {
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", label: "Approved" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  label: "Rejected" },
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", label: "Pending"  },
};

function MySubmissions() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/price/my");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? data : data.filter(d => d.status === filter);

  const counts = {
    all:      data.length,
    approved: data.filter(d => d.status === "approved").length,
    pending:  data.filter(d => d.status === "pending").length,
    rejected: data.filter(d => d.status === "rejected").length,
  };

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "32px" }} className="fade-up">
        <p style={{ color: "var(--accent)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          History
        </p>
        <h1 style={{ fontSize: "36px", color: "var(--text)", marginBottom: "6px" }}>
          My Submissions
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>
          Track the status of your price reports
        </p>
      </div>

      {/* Filter tabs */}
      {!loading && data.length > 0 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }} className="fade-up">
          {[
            { key: "all",      label: "All",      color: "var(--accent)" },
            { key: "approved", label: "Approved", color: "#10b981" },
            { key: "pending",  label: "Pending",  color: "#f59e0b" },
            { key: "rejected", label: "Rejected", color: "#ef4444" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "7px 16px",
                borderRadius: "99px",
                border: `1px solid ${filter === key ? color : "var(--border)"}`,
                background: filter === key ? `${color}18` : "transparent",
                color: filter === key ? color : "var(--muted)",
                fontSize: "13px", fontWeight: "500",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {label}
              <span style={{
                marginLeft: "6px",
                background: filter === key ? color : "var(--surface2)",
                color: filter === key ? "#0a0e1a" : "var(--muted)",
                borderRadius: "99px", padding: "1px 7px",
                fontSize: "11px", fontWeight: "700",
              }}>{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--muted)" }}>
          Loading submissions…
        </div>
      ) : data.length === 0 ? (
        <div className="card fade-up" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <h3 style={{ color: "var(--text)", marginBottom: "8px" }}>No submissions yet</h3>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
            Start contributing by adding commodity prices from your local market.
          </p>
          <Link to="/add">
            <button className="btn" style={{ padding: "10px 24px", fontSize: "14px" }}>
              Add your first price →
            </button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card fade-up" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>No {filter} submissions.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filtered.map((item, i) => {
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            return (
              <div
                key={item._id}
                className={`card fade-up fade-up-${Math.min(i + 1, 4)}`}
                style={{ display: "flex", alignItems: "center", gap: "18px", padding: "20px 24px" }}
              >
                {/* Icon */}
                <div style={{
                  width: "52px", height: "52px",
                  background: "var(--surface2)",
                  borderRadius: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px", flexShrink: 0,
                }}>
                  {getCommodityIcon(item.commodity)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text)", marginBottom: "3px" }}>
                    {item.commodity}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.marketName} · {item.district}
                  </p>
                  {item.status === "rejected" && item.rejectionReason && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                      ✕ {item.rejectionReason}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* Price */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "24px", fontFamily: "'DM Serif Display', serif", color: "#f59e0b", lineHeight: 1 }}>
                    ₹{item.price}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--muted)" }}>per kg</p>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: "12px", fontWeight: "600",
                  padding: "6px 14px", borderRadius: "99px",
                  background: sc.bg, color: sc.color,
                  border: `1px solid ${sc.border}`,
                  flexShrink: 0, textTransform: "capitalize",
                }}>
                  {sc.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default MySubmissions;
