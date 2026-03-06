import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "../api/axios";
import Layout from "../components/Layout";
import { isAdmin } from "../utils/auth";

const ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = n => ICONS[n] || "🌿";
const COLORS = ["#f59e0b","#10b981","#6366f1","#e11d48","#06b6d4","#8b5cf6","#f97316","#84cc16"];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", padding:"10px 14px" }}>
      <p style={{ color:"var(--muted)", fontSize:"11px", marginBottom:"4px" }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, fontSize:"13px", fontWeight:"600" }}>₹{p.value}</p>)}
    </div>
  );
};

function Analytics() {
  const admin = isAdmin();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState("Tomato");

  useEffect(() => {
    api.get("/price/all").then(r => { setPrices(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const allCommodities = [...new Set(prices.map(p => p.commodity))].sort();

  const commodityCount = prices.reduce((a,p) => { a[p.commodity]=(a[p.commodity]||0)+1; return a; }, {});
  const pieData = Object.entries(commodityCount).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value])=>({name,value}));

  const trendData = (() => {
    const byDate = {};
    prices.filter(p=>p.commodity===sel).forEach(p => {
      const d = new Date(p.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
      if (!byDate[d]) byDate[d] = { date:d, prices:[] };
      byDate[d].prices.push(p.price);
    });
    return Object.values(byDate).slice(-14).map(({date,prices}) => ({
      date, avg:Math.round(prices.reduce((s,v)=>s+v,0)/prices.length*10)/10,
      min:Math.min(...prices), max:Math.max(...prices),
    }));
  })();

  const districtData = (() => {
    const byD = {};
    prices.filter(p=>p.commodity===sel).forEach(p => { if(!byD[p.district]) byD[p.district]=[]; byD[p.district].push(p.price); });
    return Object.entries(byD).map(([d,ps])=>({
      district: d.length>8 ? d.slice(0,8)+"…" : d,
      avg: Math.round(ps.reduce((s,v)=>s+v,0)/ps.length*10)/10,
    })).sort((a,b)=>a.avg-b.avg).slice(0,8);
  })();

  const selPrices = prices.filter(p=>p.commodity===sel).map(p=>p.price);
  const avg = selPrices.length ? (selPrices.reduce((s,v)=>s+v,0)/selPrices.length).toFixed(1) : "—";
  const min = selPrices.length ? Math.min(...selPrices) : "—";
  const max = selPrices.length ? Math.max(...selPrices) : "—";

  const latestByDistrict = (() => {
    const map = {};
    prices.filter(p=>p.commodity===sel).forEach(p => {
      if (!map[p.district] || new Date(p.createdAt) > new Date(map[p.district].createdAt)) map[p.district] = p;
    });
    return Object.values(map).sort((a,b)=>a.price-b.price);
  })();

  return (
    <Layout>
      <div style={{ marginBottom:"24px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Insights</p>
        <h1 style={{ fontSize:"clamp(22px,5vw,36px)", color:"var(--text)", marginBottom:"4px" }}>Analytics</h1>
        <p style={{ color:"var(--muted)", fontSize:"14px" }}>Price trends, district comparisons and market insights</p>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading…</div>
      ) : (<>

        {/* Commodity selector — scrolls horizontally on mobile */}
        <div className="card fade-up fade-up-1" style={{ marginBottom:"20px", padding:"14px 16px" }}>
          <p style={{ fontSize:"11px", color:"var(--muted)", fontWeight:"700", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Select Commodity</p>
          <div style={{ display:"flex", overflowX:"auto", gap:"8px", paddingBottom:"4px", WebkitOverflowScrolling:"touch" }}>
            {allCommodities.map(c => (
              <button key={c} onClick={() => setSel(c)} style={{
                padding:"6px 12px", borderRadius:"99px", cursor:"pointer", fontSize:"12px", fontWeight:sel===c?"700":"400",
                border:`1px solid ${sel===c?"var(--accent)":"var(--border)"}`,
                background:sel===c?"rgba(245,158,11,0.15)":"transparent",
                color:sel===c?"var(--accent)":"var(--muted)",
                whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s",
              }}>{getIcon(c)} {c}</button>
            ))}
          </div>
        </div>

        {/* Stat cards — 2 cols on mobile */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px", marginBottom:"20px" }}>
          {[
            { label:"Avg Price",   value:`₹${avg}`, color:"#f59e0b", icon:"📊" },
            { label:"Lowest",      value:`₹${min}`, color:"#10b981", icon:"↓" },
            { label:"Highest",     value:`₹${max}`, color:"#ef4444", icon:"↑" },
            { label:"Data Points", value:selPrices.length, color:"#6366f1", icon:"🗂" },
          ].map(({label,value,color,icon},i) => (
            <div key={label} className={`card fade-up fade-up-${i+1}`} style={{ borderLeft:`3px solid ${color}`, padding:"14px" }}>
              <span style={{ fontSize:"16px", display:"block", marginBottom:"6px" }}>{icon}</span>
              <p style={{ color:"var(--muted)", fontSize:"11px", marginBottom:"3px" }}>{label}</p>
              <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(20px,4vw,28px)", color:"var(--text)", lineHeight:1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Trend chart — full width, scrollable */}
        <div className="card fade-up fade-up-2" style={{ marginBottom:"16px", padding:"16px" }}>
          <h3 style={{ fontSize:"15px", color:"var(--text)", marginBottom:"2px" }}>{getIcon(sel)} {sel} — Price Trend</h3>
          <p style={{ fontSize:"11px", color:"var(--muted)", marginBottom:"14px" }}>Last 14 days avg / min / max</p>
          <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
            {trendData.length < 2 ? (
              <p style={{ textAlign:"center", padding:"30px", color:"var(--muted)", fontSize:"13px" }}>Not enough data yet</p>
            ) : (
              <div style={{ minWidth:"300px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill:"var(--muted)", fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"var(--muted)", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`} width={40} />
                    <Tooltip content={<Tip />} />
                    <Line type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2.5} dot={{ r:3 }} name="Avg" />
                    <Line type="monotone" dataKey="min" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Min" />
                    <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Max" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Pie + District — stack on mobile */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"16px", marginBottom:"16px" }}>
          {/* Pie chart */}
          <div className="card fade-up fade-up-3" style={{ padding:"16px" }}>
            <h3 style={{ fontSize:"15px", color:"var(--text)", marginBottom:"2px" }}>Submission Mix</h3>
            <p style={{ fontSize:"11px", color:"var(--muted)", marginBottom:"12px" }}>Top commodities by count</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v,n) => [`${v}`, n]} contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", fontSize:"12px" }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize:"10px", color:"var(--muted)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* District bar chart */}
          <div className="card fade-up fade-up-4" style={{ padding:"16px" }}>
            <h3 style={{ fontSize:"15px", color:"var(--text)", marginBottom:"2px" }}>District Comparison</h3>
            <p style={{ fontSize:"11px", color:"var(--muted)", marginBottom:"12px" }}>{sel} — cheapest first</p>
            <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
              {districtData.length === 0 ? (
                <p style={{ color:"var(--muted)", textAlign:"center", padding:"30px", fontSize:"13px" }}>No data yet</p>
              ) : (
                <div style={{ minWidth:"280px" }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={districtData} barSize={20}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="district" tick={{ fill:"var(--muted)", fontSize:9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"var(--muted)", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`} width={38} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="avg" fill="var(--accent)" radius={[4,4,0,0]} name="Avg ₹" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cheapest / Expensive */}
        {latestByDistrict.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"14px" }}>
            <div className="card fade-up" style={{ padding:"16px" }}>
              <h3 style={{ fontSize:"14px", color:"#10b981", marginBottom:"12px" }}>✅ Cheapest Districts</h3>
              {latestByDistrict.slice(0,5).map(p => (
                <div key={p._id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:"13px", color:"var(--text)" }}>{p.district}</span>
                  <span style={{ fontSize:"13px", fontWeight:"600", color:"#10b981" }}>₹{p.price}</span>
                </div>
              ))}
            </div>
            <div className="card fade-up" style={{ padding:"16px" }}>
              <h3 style={{ fontSize:"14px", color:"#ef4444", marginBottom:"12px" }}>⚠️ Most Expensive</h3>
              {[...latestByDistrict].reverse().slice(0,5).map(p => (
                <div key={p._id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:"13px", color:"var(--text)" }}>{p.district}</span>
                  <span style={{ fontSize:"13px", fontWeight:"600", color:"#ef4444" }}>₹{p.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>)}
    </Layout>
  );
}

export default Analytics;
