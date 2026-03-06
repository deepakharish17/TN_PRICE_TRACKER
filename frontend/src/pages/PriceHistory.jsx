import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const COMMODITY_ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = c => COMMODITY_ICONS[c] || "🌿";

function PriceHistory() {
  const { commodities, districts } = useSettings();
  const [allPrices, setAllPrices]  = useState([]);
  const [loading, setLoading]      = useState(true);
  const [commodity, setCommodity]  = useState("");
  const [district, setDistrict]    = useState("");

  useEffect(()=>{
    api.get("/price/all").then(r=>setAllPrices(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  // Filter
  const filtered = allPrices.filter(p=>
    (!commodity || p.commodity === commodity) &&
    (!district  || p.district  === district)
  );

  // Build daily chart data
  const chartData = (() => {
    const byDate = {};
    filtered.forEach(p => {
      const d = new Date(p.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(p.price);
    });
    return Object.entries(byDate)
      .sort((a,b) => new Date(a[0]) - new Date(b[0]))
      .slice(-30)
      .map(([date, prices]) => ({
        date,
        avg: Math.round(prices.reduce((s,v)=>s+v,0)/prices.length * 10)/10,
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: prices.length,
      }));
  })();

  const avgPrice   = chartData.length ? Math.round(chartData.reduce((s,d)=>s+d.avg,0)/chartData.length*10)/10 : 0;
  const lowestDay  = chartData.length ? [...chartData].sort((a,b)=>a.avg-b.avg)[0] : null;
  const highestDay = chartData.length ? [...chartData].sort((a,b)=>b.avg-a.avg)[0] : null;
  const trend      = chartData.length>=2 ? chartData[chartData.length-1].avg - chartData[0].avg : 0;

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>History</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>📦 Price History</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>30-day historical price trends per commodity and district</p>
      </div>

      {/* Filters */}
      <div className="card fade-up fade-up-1" style={{ marginBottom:"24px", padding:"16px 20px" }}>
        <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", alignItems:"center" }}>
          <select className="input" value={commodity} style={{ flex:1, minWidth:"200px", marginTop:0, cursor:"pointer" }} onChange={e=>setCommodity(e.target.value)}>
            <option value="">All Commodities</option>
            {commodities.map(c=><option key={c} value={c}>{getIcon(c)} {c}</option>)}
          </select>
          <select className="input" value={district} style={{ flex:1, minWidth:"180px", marginTop:0, cursor:"pointer" }} onChange={e=>setDistrict(e.target.value)}>
            <option value="">All Districts</option>
            {districts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          {(commodity||district) && (
            <button className="btn-ghost" onClick={()=>{setCommodity("");setDistrict("");}}>↺ Clear</button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {chartData.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }} className="fade-up fade-up-2">
          {[
            { label:"Average Price",  value:`₹${avgPrice}`,           color:"#6366f1", icon:"📊" },
            { label:"Lowest Avg Day", value: lowestDay ? `₹${lowestDay.avg}` : "—", color:"#10b981", icon:"📉" },
            { label:"Highest Avg Day",value: highestDay ? `₹${highestDay.avg}` : "—", color:"#ef4444", icon:"📈" },
            { label:"30d Trend",      value: trend===0?"Stable": trend>0?`+₹${trend.toFixed(1)}`:`-₹${Math.abs(trend).toFixed(1)}`, color: trend>0?"#ef4444":trend<0?"#10b981":"#6366f1", icon: trend>0?"↑":trend<0?"↓":"→" },
          ].map(({label,value,color,icon})=>(
            <div key={label} className="card" style={{ borderLeft:`3px solid ${color}` }}>
              <span style={{ fontSize:"18px", width:"38px", height:"38px", background:`${color}18`, borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"10px" }}>{icon}</span>
              <p style={{ color:"var(--muted)", fontSize:"12px", marginBottom:"4px" }}>{label}</p>
              <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"26px", color, lineHeight:1 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="card fade-up fade-up-3" style={{ marginBottom:"24px" }}>
        <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>
          {commodity ? `${getIcon(commodity)} ${commodity}` : "All Commodities"} — Price Over 30 Days
          {district && <span style={{ color:"var(--muted)", fontWeight:"400", fontSize:"14px" }}> · {district}</span>}
        </h3>
        <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"20px" }}>Average daily price in ₹/kg</p>
        {loading ? (
          <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)" }}>Loading…</div>
        ) : chartData.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)" }}>No historical data for this selection</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill:"var(--muted)", fontSize:11 }} />
              <YAxis tick={{ fill:"var(--muted)", fontSize:11 }} domain={["auto","auto"]} />
              {avgPrice > 0 && <ReferenceLine y={avgPrice} stroke="var(--accent)" strokeDasharray="6 3" label={{ value:`Avg ₹${avgPrice}`, fill:"var(--accent)", fontSize:11, position:"insideTopRight" }} />}
              <Tooltip contentStyle={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px" }}
                formatter={(v,n) => [`₹${v}`, n==="avg"?"Average":n==="min"?"Lowest":"Highest"]} />
              <Line type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill:"var(--accent)", r:3 }} name="avg" />
              <Line type="monotone" dataKey="min" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="4 4" name="min" />
              <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="4 4" name="max" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Raw data table */}
      {chartData.length > 0 && (
        <div className="card fade-up fade-up-4" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 24px", borderBottom:"1px solid var(--border)" }}>
            <h3 style={{ fontSize:"16px", color:"var(--text)" }}>Daily Summary</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Avg Price</th><th>Lowest</th><th>Highest</th><th>Entries</th></tr></thead>
            <tbody>
              {[...chartData].reverse().map(row=>(
                <tr key={row.date}>
                  <td style={{ color:"var(--muted)", fontSize:"13px" }}>{row.date}</td>
                  <td style={{ fontFamily:"'DM Serif Display',serif", fontSize:"18px", color:"var(--accent)" }}>₹{row.avg}</td>
                  <td style={{ color:"#10b981", fontWeight:"600" }}>₹{row.min}</td>
                  <td style={{ color:"#ef4444", fontWeight:"600" }}>₹{row.max}</td>
                  <td><span style={{ fontSize:"12px", padding:"2px 8px", background:"var(--surface2)", borderRadius:"99px", color:"var(--muted)" }}>{row.count} price{row.count!==1?"s":""}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export default PriceHistory;
