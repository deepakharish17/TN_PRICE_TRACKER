import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";

const ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = c => ICONS[c] || "🌿";

function MarketPrices() {
  const { districts, commodities } = useSettings();
  const [prices, setPrices]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict]   = useState("");
  const [commodity, setCommodity] = useState("");
  const [view, setView]           = useState("cards");

  useEffect(() => {
    api.get("/price/all").then(r=>setPrices(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const filtered = prices.filter(p =>
    (!district  || p.district  === district) &&
    (!commodity || p.commodity === commodity)
  );

  // Group by commodity for card view
  const grouped = {};
  filtered.forEach(p => { if (!grouped[p.commodity]) grouped[p.commodity]=[]; grouped[p.commodity].push(p); });
  const avg = arr => Math.round(arr.reduce((s,p)=>s+p.price,0)/arr.length*10)/10;

  return (
    <Layout>
      <div style={{ marginBottom:"20px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Live Board</p>
        <h1 style={{ fontSize:"clamp(22px,5vw,36px)", color:"var(--text)", marginBottom:"4px" }}>Market Prices</h1>
        <p style={{ color:"var(--muted)", fontSize:"14px" }}>Latest approved prices across Tamil Nadu</p>
      </div>

      {/* Filters */}
      <div className="card fade-up fade-up-1" style={{ marginBottom:"16px", padding:"12px 14px" }}>
        {/* Selects stack on mobile */}
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            <select value={district} onChange={e=>setDistrict(e.target.value)}
              style={{ flex:"1 1 130px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 10px", color:"var(--text)", fontSize:"13px", cursor:"pointer", outline:"none", minWidth:0 }}>
              <option value="">All Districts</option>
              {districts.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <select value={commodity} onChange={e=>setCommodity(e.target.value)}
              style={{ flex:"1 1 130px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 10px", color:"var(--text)", fontSize:"13px", cursor:"pointer", outline:"none", minWidth:0 }}>
              <option value="">All Commodities</option>
              {commodities.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            {/* View toggle */}
            <div style={{ display:"flex", gap:"3px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"3px" }}>
              {["cards","table"].map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{
                  padding:"5px 12px", borderRadius:"6px", border:"none", cursor:"pointer",
                  background:view===v?"var(--accent)":"transparent",
                  color:view===v?"#fff":"var(--muted)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:"12px",
                }}>{v==="cards"?"⊞ Cards":"☰ Table"}</button>
              ))}
            </div>
            {(district||commodity) && (
              <button className="btn-ghost" style={{ padding:"7px 12px", fontSize:"12px" }} onClick={()=>{setDistrict("");setCommodity("");}}>↺ Clear</button>
            )}
            <span style={{ fontSize:"12px", color:"var(--muted)", marginLeft:"auto" }}>{filtered.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading…</div>
      ) : filtered.length===0 ? (
        <div className="card" style={{ textAlign:"center", padding:"48px" }}>
          <p style={{ fontSize:"32px", marginBottom:"10px" }}>🏪</p>
          <p style={{ color:"var(--text)", fontWeight:"600" }}>No prices found</p>
          <p style={{ color:"var(--muted)", fontSize:"13px", marginTop:"4px" }}>Try different filters</p>
        </div>
      ) : view==="cards" ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"10px" }}>
          {Object.entries(grouped).map(([commodity,entries],i) => (
            <div key={commodity} className={`card fade-up fade-up-${Math.min(i%5+1,5)}`} style={{ padding:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                <span style={{ fontSize:"24px" }}>{getIcon(commodity)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:"600", color:"var(--text)", fontSize:"13px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{commodity}</p>
                  <p style={{ fontSize:"10px", color:"var(--muted)" }}>{entries.length} entr{entries.length===1?"y":"ies"}</p>
                </div>
              </div>
              <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(20px,4vw,26px)", color:"var(--accent)", lineHeight:1 }}>₹{avg(entries)}</p>
              <p style={{ fontSize:"10px", color:"var(--muted)", marginBottom:"8px" }}>avg/kg</p>
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:"8px" }}>
                {entries.slice(0,2).map(e=>(
                  <div key={e._id} style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                    <p style={{ fontSize:"11px", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", flex:1 }}>{e.district}</p>
                    <p style={{ fontSize:"12px", fontWeight:"600", color:"var(--text)", flexShrink:0, marginLeft:"4px" }}>₹{e.price}</p>
                  </div>
                ))}
                {entries.length>2 && <p style={{ fontSize:"10px", color:"var(--accent)" }}>+{entries.length-2} more</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card fade-up" style={{ padding:0, overflow:"hidden" }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Commodity</th><th>Market</th><th>District</th><th>Price</th><th>Date</th></tr></thead>
              <tbody>
                {filtered.map(p=>(
                  <tr key={p._id}>
                    <td><div style={{ display:"flex", alignItems:"center", gap:"8px" }}><span style={{ fontSize:"16px" }}>{getIcon(p.commodity)}</span><span style={{ fontWeight:"500", color:"var(--text)", fontSize:"13px" }}>{p.commodity}</span></div></td>
                    <td style={{ color:"var(--muted)", fontSize:"12px" }}>{p.marketName}</td>
                    <td style={{ color:"var(--muted)", fontSize:"12px" }}>{p.district}</td>
                    <td style={{ fontFamily:"'DM Serif Display',serif", fontSize:"18px", color:"var(--accent)" }}>₹{p.price}</td>
                    <td style={{ fontSize:"11px", color:"var(--muted)", whiteSpace:"nowrap" }}>{new Date(p.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default MarketPrices;
