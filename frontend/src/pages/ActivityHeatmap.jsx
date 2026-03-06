import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function ActivityHeatmap() {
  const [allPrices, setAllPrices]  = useState([]);
  const [users, setUsers]          = useState([]);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/price/all").catch(()=>({data:[]})),
      api.get("/admin/users").catch(()=>({data:[]})),
    ]).then(([p,u]) => {
      setAllPrices(p.data);
      setUsers(u.data);
    }).finally(()=>setLoading(false));
  },[]);

  // Build 52-week heatmap (GitHub style)
  const buildHeatmap = () => {
    const counts = {};
    allPrices.forEach(p => {
      const d = new Date(p.createdAt).toDateString();
      counts[d] = (counts[d]||0)+1;
    });

    const today = new Date();
    const weeks = [];
    let current = new Date(today);
    current.setDate(current.getDate() - current.getDay()); // Start of week

    for (let w = 51; w >= 0; w--) {
      const week = [];
      const weekStart = new Date(current);
      weekStart.setDate(weekStart.getDate() - w*7);
      for (let d = 0; d < 7; d++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + d);
        const key = day.toDateString();
        week.push({ date: day, count: counts[key]||0, key });
      }
      weeks.push(week);
    }
    return weeks;
  };

  const heatmap = buildHeatmap();
  const maxCount = Math.max(...heatmap.flat().map(d=>d.count), 1);

  const getColor = (count) => {
    if (count === 0) return "var(--surface2)";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "rgba(245,158,11,0.25)";
    if (intensity < 0.5)  return "rgba(245,158,11,0.5)";
    if (intensity < 0.75) return "rgba(245,158,11,0.75)";
    return "#f59e0b";
  };

  // Daily breakdown bar chart (last 30 days)
  const last30 = (() => {
    const counts = {};
    const today = new Date();
    for (let i=29; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate()-i);
      counts[d.toDateString()] = { date:d.toLocaleDateString("en-IN",{day:"numeric",month:"short"}), count:0 };
    }
    allPrices.forEach(p => {
      const k = new Date(p.createdAt).toDateString();
      if (counts[k]) counts[k].count++;
    });
    return Object.values(counts);
  })();

  const maxBar = Math.max(...last30.map(d=>d.count), 1);

  // District activity
  const districtActivity = (() => {
    const counts = {};
    allPrices.forEach(p => { counts[p.district] = (counts[p.district]||0)+1; });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  })();

  // Stats
  const totalToday = allPrices.filter(p=>new Date(p.createdAt).toDateString()===new Date().toDateString()).length;
  const totalWeek  = allPrices.filter(p=>(Date.now()-new Date(p.createdAt))/86400000 < 7).length;
  const totalMonth = allPrices.filter(p=>(Date.now()-new Date(p.createdAt))/86400000 < 30).length;

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Admin · Activity</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>📊 Activity Heatmap</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Platform submission activity, district hotspots and trends</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"28px" }} className="fade-up fade-up-1">
        {[
          { label:"Today",      value:totalToday,       color:"#f59e0b" },
          { label:"This Week",  value:totalWeek,        color:"#6366f1" },
          { label:"This Month", value:totalMonth,       color:"#10b981" },
          { label:"Total Users",value:users.length,     color:"#e11d48" },
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{ borderLeft:`3px solid ${color}`, textAlign:"center" }}>
            <p style={{ color:"var(--muted)", fontSize:"12px", marginBottom:"6px" }}>{label}</p>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"38px", color, lineHeight:1 }}>{value}</p>
            <p style={{ fontSize:"11px", color:"var(--muted)", marginTop:"4px" }}>submissions</p>
          </div>
        ))}
      </div>

      {/* GitHub-style heatmap */}
      <div className="card fade-up fade-up-2" style={{ marginBottom:"24px", overflowX:"auto" }}>
        <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>52-Week Submission Activity</h3>
        <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"20px" }}>Each cell = one day of platform activity</p>
        {loading ? <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)" }}>Loading…</div> : (
          <>
            <div style={{ display:"flex", gap:"3px", overflowX:"auto", paddingBottom:"8px" }}>
              {heatmap.map((week, wi) => (
                <div key={wi} style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                  {week.map((day, di) => (
                    <div key={di} title={`${day.date.toDateString()}: ${day.count} submissions`}
                      style={{ width:"12px", height:"12px", borderRadius:"2px", background:getColor(day.count), cursor:"default", transition:"transform 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.4)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"10px" }}>
              <span style={{ fontSize:"11px", color:"var(--muted)" }}>Less</span>
              {[0,0.25,0.5,0.75,1].map((v,i)=>(
                <div key={i} style={{ width:"12px", height:"12px", borderRadius:"2px", background:v===0?"var(--surface2)":`rgba(245,158,11,${v})` }} />
              ))}
              <span style={{ fontSize:"11px", color:"var(--muted)" }}>More</span>
            </div>
          </>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px" }}>
        {/* Last 30 days bar */}
        <div className="card fade-up fade-up-3">
          <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>Last 30 Days</h3>
          <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"16px" }}>Daily submission count</p>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:"120px" }}>
            {last30.map((d,i)=>(
              <div key={i} title={`${d.date}: ${d.count}`} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", height:"100%" }}>
                <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%" }}>
                  <div style={{ width:"100%", height:`${(d.count/maxBar)*100}%`, minHeight:d.count>0?"4px":"0", background:"var(--accent)", borderRadius:"2px 2px 0 0", opacity:0.7+0.3*(d.count/maxBar), transition:"height 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px" }}>
            <span style={{ fontSize:"10px", color:"var(--muted)" }}>{last30[0]?.date}</span>
            <span style={{ fontSize:"10px", color:"var(--muted)" }}>{last30[last30.length-1]?.date}</span>
          </div>
        </div>

        {/* District activity */}
        <div className="card fade-up fade-up-4">
          <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>Top Districts by Activity</h3>
          <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"16px" }}>Most active submission districts</p>
          {districtActivity.map(([district, count], i) => {
            const pct = Math.round((count / allPrices.length) * 100);
            return (
              <div key={district} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  <span style={{ fontSize:"13px", color:"var(--text)" }}>{district}</span>
                  <span style={{ fontSize:"12px", color:"var(--muted)" }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height:"6px", background:"var(--surface2)", borderRadius:"99px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`hsl(${200+i*15},70%,55%)`, borderRadius:"99px", transition:"width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

export default ActivityHeatmap;
