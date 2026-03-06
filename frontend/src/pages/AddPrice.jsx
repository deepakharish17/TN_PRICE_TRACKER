import { useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { isAdmin } from "../utils/auth";
import { useSettings } from "../hooks/useSettings";

const ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = n => ICONS[n] || "🌿";

function AddPrice() {
  const admin = isAdmin();
  const { districts, commodities } = useSettings();
  const [form, setForm]   = useState({ commodity:"", market:"", district:"", price:"" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError(""); setSuccess(null);
    try {
      await api.post("/price/add", { commodity:form.commodity, marketName:form.market, district:form.district, price:Number(form.price), ...(admin&&{status:"approved"}) });
      setSuccess({ commodity:form.commodity, price:form.price, market:form.market });
      setForm({ commodity:"", market:"", district:"", price:"" });
    } catch(err) { setError(err.response?.data || "Submission failed."); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      <div style={{ marginBottom:"20px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>{admin?"Admin · Publish":"Contribute"}</p>
        <h1 style={{ fontSize:"clamp(22px,5vw,34px)", color:"var(--text)", marginBottom:"4px" }}>{admin?"Add & Publish":"Add Price"}</h1>
        <p style={{ color:"var(--muted)", fontSize:"14px" }}>{admin?"Instantly approved and live":"Goes live after admin review"}</p>
      </div>

      {admin && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"9px 14px", borderRadius:"10px", marginBottom:"16px", background:"rgba(225,29,72,0.08)", border:"1px solid rgba(225,29,72,0.25)" }}>
          <span>🛡️</span>
          <span style={{ fontSize:"13px", color:"#e11d48", fontWeight:"600" }}>Admin mode — instant publish</span>
        </div>
      )}

      {/* Full width form on mobile */}
      <div className="card fade-up fade-up-1" style={{ borderTop:"2px solid var(--accent)", maxWidth:"520px" }}>
        {success && (
          <div style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:"10px", padding:"12px 14px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"22px" }}>{getIcon(success.commodity)}</span>
            <div>
              <p style={{ color:"#10b981", fontWeight:"600", fontSize:"13px" }}>{admin?"✅ Published!":"✅ Submitted for review!"}</p>
              <p style={{ color:"var(--muted)", fontSize:"12px" }}>{success.commodity} · ₹{success.price}/kg · {success.market}</p>
            </div>
          </div>
        )}
        {error && (
          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"10px", padding:"12px", color:"#ef4444", fontSize:"13px", marginBottom:"16px" }}>{error}</div>
        )}

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>{form.commodity?getIcon(form.commodity):"🛒"} Commodity</label>
            <select className="input" value={form.commodity} required style={{ cursor:"pointer" }} onChange={e=>set("commodity",e.target.value)}>
              <option value="">Select commodity…</option>
              {commodities.map(c=><option key={c} value={c}>{getIcon(c)} {c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>🏪 Market Name</label>
            <input className="input" placeholder="e.g. Koyambedu Market" value={form.market} required onChange={e=>set("market",e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>🗺️ District</label>
            <select className="input" value={form.district} required style={{ cursor:"pointer" }} onChange={e=>set("district",e.target.value)}>
              <option value="">Select district…</option>
              {districts.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>💰 Price per kg (₹)</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"var(--accent)", fontSize:"16px", fontWeight:"700", pointerEvents:"none", marginTop:"3px" }}>₹</span>
              <input type="number" min="0.5" step="0.5" className="input" placeholder="0.00" value={form.price} required style={{ paddingLeft:"30px" }} onChange={e=>set("price",e.target.value)} />
            </div>
          </div>

          {/* Preview */}
          {form.commodity && form.price && form.district && (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", background:"var(--surface2)", border:"1px solid var(--border)" }}>
              <span style={{ fontSize:"20px" }}>{getIcon(form.commodity)}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:"13px", fontWeight:"600", color:"var(--text)" }}>{form.commodity}</p>
                <p style={{ fontSize:"11px", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{form.market||"—"} · {form.district}</p>
              </div>
              <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"20px", color:"var(--accent)", flexShrink:0 }}>₹{form.price}</p>
            </div>
          )}

          <button type="submit" className="btn" disabled={loading} style={{ padding:"14px", justifyContent:"center", fontSize:"15px", width:"100%", marginTop:"4px" }}>
            {loading?"Submitting…":admin?"⚡ Publish Immediately":"Submit for Review →"}
          </button>
        </form>
      </div>

      {/* Info steps — shown below form on mobile */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"10px", marginTop:"16px", maxWidth:"520px" }}>
        {(admin
          ? [{ icon:"⚡",title:"Instant Publish",desc:"Goes live immediately" },{ icon:"🗺️",title:"All Districts",desc:"All 22+ TN districts" }]
          : [{ icon:"📋",title:"Submit",desc:"Fill today's market price" },{ icon:"🔍",title:"Review",desc:"Admin verifies" },{ icon:"📢",title:"Publish",desc:"Goes live on board" }]
        ).map(({icon,title,desc})=>(
          <div key={title} className="card fade-up" style={{ display:"flex", gap:"10px", alignItems:"center", padding:"12px 14px" }}>
            <span style={{ fontSize:"18px", width:"36px", height:"36px", background:"var(--surface2)", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{icon}</span>
            <div>
              <p style={{ fontWeight:"600", color:"var(--text)", fontSize:"13px" }}>{title}</p>
              <p style={{ fontSize:"12px", color:"var(--muted)" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default AddPrice;
