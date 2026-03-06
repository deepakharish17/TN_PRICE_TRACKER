import { useState, useEffect } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { isAdmin } from "../utils/auth";
import { useSettings } from "../hooks/useSettings";

const COMMODITY_ICONS = {
  "Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚",
  "Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘",
  "Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛",
  "Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕",
};
const getIcon = (name) => COMMODITY_ICONS[name] || "🌿";

function AddPrice() {
  const admin = isAdmin();
  const { districts, commodities } = useSettings();
  const [form, setForm]       = useState({ commodity: "", market: "", district: "", price: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError]     = useState("");

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess(null);
    try {
      await api.post("/price/add", {
        commodity:  form.commodity,
        marketName: form.market,
        district:   form.district,
        price:      Number(form.price),
        // Admin submissions auto-approved
        ...(admin && { status: "approved" }),
      });
      setSuccess({ commodity: form.commodity, price: form.price, market: form.market });
      setForm({ commodity: "", market: "", district: "", price: "" });
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const adminSteps = [
    { icon: "⚡", title: "Instant Publish",  desc: "Admin submissions are approved automatically and go live immediately." },
    { icon: "🗺️", title: "Any District",     desc: "You can submit prices for all 22+ Tamil Nadu districts." },
    { icon: "📊", title: "Sets the baseline", desc: "Your prices serve as reference data for the platform." },
  ];

  const userSteps = [
    { icon: "📋", title: "Submit",   desc: "Fill in the price you observed at the market today." },
    { icon: "🔍", title: "Review",   desc: "An admin will verify and approve your submission." },
    { icon: "📢", title: "Publish",  desc: "Approved prices appear live on the market board." },
  ];

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: "32px" }} className="fade-up">
        <p style={{ color: "var(--accent)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          {admin ? "Admin · Direct Publish" : "Contribute"}
        </p>
        <h1 style={{ fontSize: "36px", color: "var(--text)", marginBottom: "6px" }}>
          {admin ? "Add & Publish Price" : "Add Commodity Price"}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>
          {admin
            ? "Prices you submit are instantly approved and visible on the market board"
            : "Submit a current market price — it'll go live after admin review"}
        </p>
      </div>

      {/* Admin badge */}
      {admin && (
        <div className="fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          padding: "10px 16px", borderRadius: "10px", marginBottom: "24px",
          background: "rgba(225,29,72,0.08)", border: "1px solid rgba(225,29,72,0.25)",
        }}>
          <span style={{ fontSize: "16px" }}>🛡️</span>
          <span style={{ fontSize: "13px", color: "#e11d48", fontWeight: "600" }}>
            Admin mode — submissions are instantly published
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", maxWidth: "920px" }}>

        {/* ── Form ── */}
        <div className="card fade-up fade-up-1" style={{ borderTop: `2px solid var(--accent)` }}>

          {/* Success banner */}
          {success && (
            <div style={{
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "12px", padding: "16px",
              marginBottom: "24px", display: "flex", alignItems: "center", gap: "14px",
            }}>
              <span style={{ fontSize: "28px" }}>{getIcon(success.commodity)}</span>
              <div>
                <p style={{ color: "#10b981", fontWeight: "600", fontSize: "14px" }}>
                  {admin ? "✅ Published successfully!" : "✅ Submitted for review!"}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>
                  {success.commodity} · ₹{success.price}/kg · {success.market}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px", padding: "12px 16px",
              color: "#ef4444", fontSize: "14px", marginBottom: "20px",
            }}>{error}</div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Commodity */}
            <div>
              <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                {form.commodity ? getIcon(form.commodity) : "🛒"} Commodity
              </label>
              <select className="input" value={form.commodity} required style={{ cursor: "pointer" }}
                onChange={e => update("commodity", e.target.value)}>
                <option value="">Select a commodity…</option>
                {commodities.map(c => (
                  <option key={c} value={c}>{getIcon(c)} {c}</option>
                ))}
              </select>
            </div>

            {/* Market name */}
            <div>
              <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>🏪 Market Name</label>
              <input className="input" placeholder="e.g. Koyambedu Market"
                value={form.market} required onChange={e => update("market", e.target.value)} />
            </div>

            {/* District */}
            <div>
              <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>🗺️ District</label>
              <select className="input" value={form.district} required style={{ cursor: "pointer" }}
                onChange={e => update("district", e.target.value)}>
                <option value="">Select district…</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Price */}
            <div>
              <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>💰 Price per kg (₹)</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  color: "var(--accent)", fontSize: "16px", fontWeight: "700", pointerEvents: "none",
                  marginTop: "3px",
                }}>₹</span>
                <input type="number" min="0.5" step="0.5" className="input"
                  placeholder="0.00" value={form.price} required
                  style={{ paddingLeft: "30px" }}
                  onChange={e => update("price", e.target.value)} />
              </div>
            </div>

            {/* Preview chip */}
            {form.commodity && form.price && form.district && (
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 14px", borderRadius: "10px",
                background: "var(--surface2)", border: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: "22px" }}>{getIcon(form.commodity)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{form.commodity}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>{form.market || "—"} · {form.district}</p>
                </div>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "22px", color: "var(--accent)" }}>
                  ₹{form.price}
                </p>
              </div>
            )}

            <button type="submit" className="btn" disabled={loading}
              style={{ padding: "14px", justifyContent: "center", fontSize: "15px" }}>
              {loading
                ? "Submitting…"
                : admin
                  ? "⚡ Publish Immediately"
                  : "Submit for review →"}
            </button>
          </form>
        </div>

        {/* ── Info panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {(admin ? adminSteps : userSteps).map(({ icon, title, desc }, i) => (
            <div key={title} className={`card fade-up fade-up-${i + 2}`}
              style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span style={{
                fontSize: "20px", width: "44px", height: "44px",
                background: "var(--surface2)", borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{icon}</span>
              <div>
                <p style={{ fontWeight: "600", color: "var(--text)", marginBottom: "4px" }}>{title}</p>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.6" }}>{desc}</p>
              </div>
            </div>
          ))}

          {/* Commodity count badge */}
          <div className={`card fade-up fade-up-${(admin ? adminSteps : userSteps).length + 2}`}
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Platform Stats
            </p>
            <div style={{ display: "flex", gap: "20px" }}>
              <div>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "28px", color: "var(--accent)", lineHeight: 1 }}>{commodities.length}</p>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>Commodities</p>
              </div>
              <div style={{ width: "1px", background: "var(--border)" }} />
              <div>
                <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "28px", color: "var(--accent)", lineHeight: 1 }}>{districts.length}</p>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>Districts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AddPrice;
