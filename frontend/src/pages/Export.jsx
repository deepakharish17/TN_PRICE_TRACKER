import { useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";
import { getToken } from "../utils/auth";

function Export() {
  const { districts, commodities } = useSettings();
  const [filters, setFilters] = useState({ district:"", commodity:"", from:"", to:"" });
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview]     = useState(null);
  const [loading, setLoading]     = useState(false);

  const update = (k,v) => setFilters(f=>({...f,[k]:v}));

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (filters.district)  p.set("district",  filters.district);
    if (filters.commodity) p.set("commodity", filters.commodity);
    if (filters.from)      p.set("from",      filters.from);
    if (filters.to)        p.set("to",        filters.to);
    return p.toString();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const qs = buildQuery();
      const response = await fetch(`http://localhost:5000/api/admin/export/csv?${qs}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `tn-prices-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Export failed"); }
    finally { setExporting(false); }
  };

  const loadPreview = async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const r = await api.get(`/price/all?${qs}`);
      setPreview(r.data.slice(0,10));
    } catch {} finally { setLoading(false); }
  };

  const COMMODITY_ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Admin · Export</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>Export Data</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Download approved price data as CSV with optional filters</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"380px 1fr", gap:"24px", alignItems:"start" }}>
        {/* Filters panel */}
        <div className="card fade-up fade-up-1" style={{ borderTop:"2px solid var(--accent)" }}>
          <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"20px" }}>Export Filters</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            <div>
              <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>🗺️ District</label>
              <select className="input" value={filters.district} style={{ cursor:"pointer" }} onChange={e=>update("district",e.target.value)}>
                <option value="">All Districts</option>
                {districts.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>🌾 Commodity</label>
              <select className="input" value={filters.commodity} style={{ cursor:"pointer" }} onChange={e=>update("commodity",e.target.value)}>
                <option value="">All Commodities</option>
                {commodities.map(c=><option key={c} value={c}>{(COMMODITY_ICONS[c]||"🌿")+" "+c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>📅 Date From</label>
              <input type="date" className="input" value={filters.from} onChange={e=>update("from",e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>📅 Date To</label>
              <input type="date" className="input" value={filters.to} onChange={e=>update("to",e.target.value)} />
            </div>

            <div style={{ display:"flex", gap:"10px", marginTop:"4px" }}>
              <button className="btn-ghost" onClick={loadPreview} disabled={loading} style={{ flex:1, justifyContent:"center" }}>
                {loading ? "Loading…" : "👁 Preview"}
              </button>
              <button className="btn" onClick={handleExport} disabled={exporting} style={{ flex:1, justifyContent:"center" }}>
                {exporting ? "Exporting…" : "📤 Export CSV"}
              </button>
            </div>

            {(filters.district||filters.commodity||filters.from||filters.to) && (
              <button className="btn-ghost" onClick={()=>setFilters({district:"",commodity:"",from:"",to:""})} style={{ fontSize:"12px" }}>
                ↺ Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Preview / info */}
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {/* Info cards */}
          {[
            { icon:"📄", title:"CSV Format", desc:"Exports as comma-separated values compatible with Excel, Google Sheets, and any data tool." },
            { icon:"🔒", title:"Admin Only", desc:"Only approved submissions are exported. Pending and rejected prices are excluded." },
            { icon:"🔍", title:"Filtered Export", desc:"Use the filters to export specific districts, commodities, or date ranges." },
          ].map(({icon,title,desc},i)=>(
            <div key={title} className={`card fade-up fade-up-${i+1}`} style={{ display:"flex", gap:"14px" }}>
              <span style={{ fontSize:"20px", width:"42px", height:"42px", background:"var(--surface2)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{icon}</span>
              <div><p style={{ fontWeight:"600", color:"var(--text)", marginBottom:"4px" }}>{title}</p><p style={{ fontSize:"13px", color:"var(--muted)", lineHeight:"1.5" }}>{desc}</p></div>
            </div>
          ))}

          {/* Preview table */}
          {preview && (
            <div className="card fade-up" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)" }}>
                <p style={{ fontSize:"14px", color:"var(--text)", fontWeight:"600" }}>Preview (first 10 rows)</p>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Commodity</th><th>Market</th><th>District</th><th>Price</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(p=>(
                    <tr key={p._id}>
                      <td>{(COMMODITY_ICONS[p.commodity]||"🌿")+" "+p.commodity}</td>
                      <td style={{ color:"var(--muted)", fontSize:"13px" }}>{p.marketName}</td>
                      <td style={{ color:"var(--muted)", fontSize:"13px" }}>{p.district}</td>
                      <td style={{ fontFamily:"'DM Serif Display',serif", fontSize:"18px", color:"var(--accent)" }}>₹{p.price}</td>
                      <td style={{ fontSize:"12px", color:"var(--muted)" }}>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Export;
