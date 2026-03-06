import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

const COMMODITY_ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = c => COMMODITY_ICONS[c] || "🌿";
const COLORS = ["#f59e0b","#6366f1","#10b981","#e11d48"];

function Compare() {
  const { districts } = useSettings();
  const [allPrices, setAllPrices]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState([]); // max 4 districts
  const [search, setSearch]           = useState("");

  useEffect(() => {
    api.get("/price/all").then(r => setAllPrices(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const toggleDistrict = (d) => {
    if (selected.includes(d)) { setSelected(s => s.filter(x=>x!==d)); return; }
    if (selected.length >= 4) return; // max 4
    setSelected(s => [...s, d]);
  };

  const filteredDistricts = districts.filter(d =>
    !search || d.toLowerCase().includes(search.toLowerCase())
  );

  // Build comparison table: commodity → { district: avgPrice }
  const commodities = [...new Set(allPrices.map(p=>p.commodity))].sort();

  const priceMap = {}; // priceMap[commodity][district] = avgPrice
  allPrices.forEach(p => {
    if (!priceMap[p.commodity]) priceMap[p.commodity] = {};
    if (!priceMap[p.commodity][p.district]) priceMap[p.commodity][p.district] = [];
    priceMap[p.commodity][p.district].push(p.price);
  });

  const avg = (arr) => arr ? Math.round(arr.reduce((s,v)=>s+v,0)/arr.length * 10)/10 : null;

  // Summary: total basket cost per district
  const basketCost = selected.map(d => {
    const total = commodities.reduce((s, c) => {
      const a = avg(priceMap[c]?.[d]);
      return s + (a || 0);
    }, 0);
    return { district: d, total: Math.round(total) };
  }).sort((a,b) => a.total - b.total);

  // Radar data: top 8 commodities
  const radarCommodities = commodities.slice(0, 8);
  const radarData = radarCommodities.map(c => {
    const row = { commodity: c.length > 10 ? c.slice(0,10)+"…" : c };
    selected.forEach(d => { row[d] = avg(priceMap[c]?.[d]) || 0; });
    return row;
  });

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Compare</p>
        <h1 style={{ fontSize:"clamp(24px,5vw,36px)", color:"var(--text)", marginBottom:"6px" }}>Compare Districts</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Select up to 4 districts to compare commodity prices side by side</p>
      </div>

      {/* District selector */}
      <div className="card fade-up fade-up-1" style={{ marginBottom:"24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <p style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"600" }}>
            Select districts
            <span style={{ marginLeft:"8px", color:"var(--accent)" }}>({selected.length}/4 selected)</span>
          </p>
          <input placeholder="Search district…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"6px 12px", color:"var(--text)", fontSize:"13px", outline:"none", width:"200px" }} />
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
          {filteredDistricts.map(d => {
            const idx = selected.indexOf(d);
            const isSelected = idx !== -1;
            const color = isSelected ? COLORS[idx] : null;
            return (
              <button key={d} onClick={()=>toggleDistrict(d)} style={{
                padding:"6px 14px", borderRadius:"99px", cursor: (!isSelected && selected.length>=4) ? "not-allowed" : "pointer",
                border:`1px solid ${color || "var(--border)"}`,
                background: color ? `${color}18` : "transparent",
                color: color || "var(--muted)",
                fontSize:"13px", fontWeight: isSelected ? "600" : "400",
                transition:"all 0.15s",
                opacity: (!isSelected && selected.length>=4) ? 0.4 : 1,
              }}>
                {isSelected && <span style={{ marginRight:"6px", fontSize:"10px", fontWeight:"700", background:color, color:"#fff", borderRadius:"50%", width:"16px", height:"16px", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{idx+1}</span>}
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length === 0 ? (
        <div className="card fade-up" style={{ textAlign:"center", padding:"60px" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>🗺️</div>
          <h3 style={{ color:"var(--text)", marginBottom:"8px" }}>Select districts to compare</h3>
          <p style={{ color:"var(--muted)", fontSize:"14px" }}>Choose 2–4 districts above to see a side-by-side price comparison</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading prices…</div>
      ) : (
        <>
          {/* Basket cost summary */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fit,minmax(min(100%,200px),1fr))`, gap:"16px", marginBottom:"24px" }}>
            {basketCost.map(({district,total},i) => {
              const isLowest = i===0;
              const color = COLORS[selected.indexOf(district)];
              return (
                <div key={district} className="card fade-up" style={{ borderTop:`2px solid ${color}`, textAlign:"center" }}>
                  {isLowest && <span style={{ fontSize:"10px", fontWeight:"700", color:"#10b981", background:"rgba(16,185,129,0.1)", padding:"2px 8px", borderRadius:"99px", display:"inline-block", marginBottom:"8px" }}>✓ Cheapest</span>}
                  <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>{district}</h3>
                  <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"32px", color, lineHeight:1 }}>₹{total}</p>
                  <p style={{ fontSize:"12px", color:"var(--muted)", marginTop:"4px" }}>Total basket cost</p>
                </div>
              );
            })}
          </div>

          {/* Radar chart */}
          {selected.length >= 2 && (
            <div className="card fade-up" style={{ marginBottom:"24px" }}>
              <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>Price Radar</h3>
              <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"16px" }}>Multi-commodity comparison across selected districts</p>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="commodity" tick={{ fill:"var(--muted)", fontSize:11 }} />
                  <Tooltip contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px" }} formatter={(v,n)=>[`₹${v}`,n]} />
                  {selected.map((d,i) => (
                    <Radar key={d} name={d} dataKey={d} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", justifyContent:"center", gap:"20px", marginTop:"8px" }}>
                {selected.map((d,i) => (
                  <div key={d} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <span style={{ width:"12px", height:"3px", background:COLORS[i], display:"inline-block", borderRadius:"2px" }} />
                    <span style={{ fontSize:"13px", color:"var(--muted)" }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full comparison table */}
          <div className="card fade-up" style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"18px 24px", borderBottom:"1px solid var(--border)" }}>
              <h3 style={{ fontSize:"16px", color:"var(--text)" }}>Full Price Table</h3>
            </div>
            <div style={{ overflowX:"auto" }}>
              <div className="table-wrap"><table className="data-table">
                <thead>
                  <tr>
                    <th>Commodity</th>
                    {selected.map((d,i) => (
                      <th key={d} style={{ color:COLORS[i] }}>{d}</th>
                    ))}
                    <th>Cheapest</th>
                  </tr>
                </thead>
                <tbody>
                  {commodities.map(c => {
                    const prices = selected.map(d => ({ d, v: avg(priceMap[c]?.[d]) }));
                    const valid  = prices.filter(p=>p.v!==null);
                    if (valid.length === 0) return null;
                    const minP   = Math.min(...valid.map(p=>p.v));
                    const cheapest = valid.find(p=>p.v===minP)?.d;
                    return (
                      <tr key={c}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                            <span style={{ width:"30px", height:"30px", background:"var(--surface2)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px" }}>{getIcon(c)}</span>
                            <span style={{ fontWeight:"500", color:"var(--text)" }}>{c}</span>
                          </div>
                        </td>
                        {selected.map((d,i) => {
                          const v = avg(priceMap[c]?.[d]);
                          const isMin = v === minP && valid.length > 1;
                          return (
                            <td key={d} style={{ fontFamily:"'DM Serif Display',serif", fontSize:"18px", color: isMin ? "#10b981" : "var(--text)" }}>
                              {v ? `₹${v}` : <span style={{ color:"var(--muted)", fontSize:"12px" }}>N/A</span>}
                            </td>
                          );
                        })}
                        <td>
                          {cheapest && valid.length > 1 && (
                            <span style={{ fontSize:"12px", fontWeight:"600", color:"#10b981", background:"rgba(16,185,129,0.1)", padding:"3px 10px", borderRadius:"99px" }}>
                              {cheapest}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
</div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}


export default Compare;