import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "../api/axios";
import Layout from "../components/Layout";
import { isAdmin } from "../utils/auth";

const COMMODITY_ICONS = { "Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕" };
const getIcon = n => COMMODITY_ICONS[n] || "🌿";
const COLORS = ["#f59e0b","#10b981","#6366f1","#e11d48","#06b6d4","#8b5cf6","#f97316","#84cc16"];

function Analytics() {
  const admin = isAdmin();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState("Tomato");

  useEffect(() => {
    api.get("/price/all").then(r => { setPrices(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Commodity distribution for pie chart
  const commodityCount = prices.reduce((acc, p) => { acc[p.commodity] = (acc[p.commodity] || 0) + 1; return acc; }, {});
  const pieData = Object.entries(commodityCount).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name, value]) => ({ name, value }));

  // Price trend for selected commodity (group by date)
  const trendData = (() => {
    const filtered = prices.filter(p => p.commodity === selectedCommodity);
    const byDate = filtered.reduce((acc, p) => {
      const date = new Date(p.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
      if (!acc[date]) acc[date] = { prices: [], date };
      acc[date].prices.push(p.price);
      return acc;
    }, {});
    return Object.values(byDate).map(({ date, prices }) => ({
      date, avg: Math.round(prices.reduce((s,v)=>s+v,0)/prices.length * 10)/10,
      min: Math.min(...prices), max: Math.max(...prices),
    })).slice(-14);
  })();

  // District price comparison for selected commodity
  const districtData = (() => {
    const filtered = prices.filter(p => p.commodity === selectedCommodity);
    const byDistrict = filtered.reduce((acc, p) => {
      if (!acc[p.district]) acc[p.district] = [];
      acc[p.district].push(p.price);
      return acc;
    }, {});
    return Object.entries(byDistrict).map(([district, ps]) => ({
      district: district.length > 10 ? district.slice(0,10)+"…" : district,
      avg: Math.round(ps.reduce((s,v)=>s+v,0)/ps.length * 10)/10,
    })).sort((a,b) => a.avg - b.avg).slice(0,10);
  })();

  // Top expensive + cheapest right now
  const latestByDistrict = (() => {
    const filtered = prices.filter(p => p.commodity === selectedCommodity);
    const map = {};
    filtered.forEach(p => { if (!map[p.district] || new Date(p.createdAt) > new Date(map[p.district].createdAt)) map[p.district] = p; });
    return Object.values(map).sort((a,b) => a.price - b.price);
  })();

  // Stats
  const allPricesForCommodity = prices.filter(p => p.commodity === selectedCommodity).map(p => p.price);
  const avgPrice = allPricesForCommodity.length ? (allPricesForCommodity.reduce((s,v)=>s+v,0)/allPricesForCommodity.length).toFixed(1) : "—";
  const minPrice = allPricesForCommodity.length ? Math.min(...allPricesForCommodity) : "—";
  const maxPrice = allPricesForCommodity.length ? Math.max(...allPricesForCommodity) : "—";

  const allCommodities = [...new Set(prices.map(p => p.commodity))].sort();

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", padding:"12px 16px" }}>
        <p style={{ color:"var(--muted)", fontSize:"12px", marginBottom:"6px" }}>{label}</p>
        {payload.map(p => <p key={p.name} style={{ color:p.color, fontSize:"13px", fontWeight:"600" }}>₹{p.value}</p>)}
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Insights</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>Analytics</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Price trends, district comparisons and market insights</p>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"80px", color:"var(--muted)" }}>Loading data…</div>
      ) : (
        <>
          {/* Commodity selector */}
          <div className="card fade-up fade-up-1" style={{ marginBottom:"24px", padding:"16px 20px" }}>
            <p style={{ fontSize:"12px", color:"var(--muted)", fontWeight:"600", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Select Commodity to Analyse</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {allCommodities.map(c => (
                <button key={c} onClick={() => setSelectedCommodity(c)} style={{
                  padding:"6px 14px", borderRadius:"99px", cursor:"pointer", fontSize:"13px", fontWeight: selectedCommodity===c ? "600" : "400",
                  border:`1px solid ${selectedCommodity===c ? "var(--accent)" : "var(--border)"}`,
                  background: selectedCommodity===c ? "rgba(245,158,11,0.15)" : "transparent",
                  color: selectedCommodity===c ? "var(--accent)" : "var(--muted)", transition:"all 0.15s",
                }}>{getIcon(c)} {c}</button>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }}>
            {[
              { label:"Avg Price",   value:`₹${avgPrice}`, color:"#f59e0b", icon:"📊" },
              { label:"Lowest",      value:`₹${minPrice}`, color:"#10b981", icon:"↓" },
              { label:"Highest",     value:`₹${maxPrice}`, color:"#ef4444", icon:"↑" },
              { label:"Data Points", value:allPricesForCommodity.length, color:"#6366f1", icon:"🗂" },
            ].map(({ label, value, color, icon }, i) => (
              <div key={label} className={`card fade-up fade-up-${i+1}`} style={{ borderLeft:`3px solid ${color}` }}>
                <span style={{ fontSize:"18px", display:"block", marginBottom:"8px" }}>{icon}</span>
                <p style={{ color:"var(--muted)", fontSize:"12px", marginBottom:"4px" }}>{label}</p>
                <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"28px", color:"var(--text)", lineHeight:1 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:"24px", marginBottom:"24px" }}>
            {/* Price trend line chart */}
            <div className="card fade-up fade-up-2">
              <h3 style={{ fontSize:"16px", color:"var(--text)", fontWeight:"600", marginBottom:"6px" }}>
                {getIcon(selectedCommodity)} {selectedCommodity} — Price Trend
              </h3>
              <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"20px" }}>Average price over last 14 days</p>
              {trendData.length < 2 ? (
                <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)", fontSize:"13px" }}>Not enough data for trend</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill:"var(--muted)", fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"var(--muted)", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill:"var(--accent)", r:4 }} name="Avg ₹" />
                    <Line type="monotone" dataKey="min" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Min ₹" />
                    <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Max ₹" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Commodity distribution pie */}
            <div className="card fade-up fade-up-3">
              <h3 style={{ fontSize:"16px", color:"var(--text)", fontWeight:"600", marginBottom:"6px" }}>Submission Mix</h3>
              <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"16px" }}>Top commodities by submission count</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} entries`, n]} contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px" }} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize:"11px", color:"var(--muted)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* District bar chart */}
          <div className="card fade-up fade-up-4" style={{ marginBottom:"24px" }}>
            <h3 style={{ fontSize:"16px", color:"var(--text)", fontWeight:"600", marginBottom:"6px" }}>
              District Price Comparison — {selectedCommodity}
            </h3>
            <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"20px" }}>Average price per district (sorted lowest → highest)</p>
            {districtData.length === 0 ? (
              <p style={{ color:"var(--muted)", textAlign:"center", padding:"40px", fontSize:"13px" }}>No data for this commodity</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={districtData} barSize={28}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="district" tick={{ fill:"var(--muted)", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"var(--muted)", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avg" fill="var(--accent)" radius={[6,6,0,0]} name="Avg ₹" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Cheapest vs expensive districts */}
          {latestByDistrict.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
              <div className="card fade-up">
                <h3 style={{ fontSize:"15px", color:"#10b981", fontWeight:"600", marginBottom:"14px" }}>✅ Cheapest Districts</h3>
                {latestByDistrict.slice(0,5).map(p => (
                  <div key={p._id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:"13px", color:"var(--text)" }}>{p.district}</span>
                    <span style={{ fontSize:"14px", fontWeight:"600", color:"#10b981" }}>₹{p.price}</span>
                  </div>
                ))}
              </div>
              <div className="card fade-up">
                <h3 style={{ fontSize:"15px", color:"#ef4444", fontWeight:"600", marginBottom:"14px" }}>⚠️ Most Expensive</h3>
                {[...latestByDistrict].reverse().slice(0,5).map(p => (
                  <div key={p._id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:"13px", color:"var(--text)" }}>{p.district}</span>
                    <span style={{ fontSize:"14px", fontWeight:"600", color:"#ef4444" }}>₹{p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

export default Analytics;
