import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { getUserEmail } from "../utils/auth";

const MEDALS = ["🥇","🥈","🥉"];
const TIER_COLORS = ["#f59e0b","#94a3b8","#cd7f32","#6366f1","#10b981"];

function Leaderboard() {
  const myEmail = getUserEmail();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState("all"); // all | month | week

  useEffect(() => {
    api.get(`/price/leaderboard?period=${period}`)
      .then(r => setLeaders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const myRank = leaders.findIndex(l => l.email === myEmail) + 1;

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Community</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>🏆 Leaderboard</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Top contributors who submitted approved commodity prices</p>
      </div>

      {/* Period filter */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"24px" }} className="fade-up">
        {[{id:"all",label:"All Time"},{id:"month",label:"This Month"},{id:"week",label:"This Week"}].map(({id,label})=>(
          <button key={id} onClick={()=>{ setPeriod(id); setLoading(true); }} style={{
            padding:"8px 18px", borderRadius:"99px", border:`1px solid ${period===id?"var(--accent)":"var(--border)"}`,
            background: period===id ? "rgba(245,158,11,0.12)" : "transparent",
            color: period===id ? "var(--accent)" : "var(--muted)",
            fontFamily:"'DM Sans',sans-serif", fontSize:"13px", fontWeight: period===id?"600":"400",
            cursor:"pointer", transition:"all 0.15s",
          }}>{label}</button>
        ))}
        {myRank > 0 && (
          <span style={{ marginLeft:"auto", padding:"8px 16px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"99px", fontSize:"13px", color:"var(--muted)" }}>
            Your rank: <strong style={{ color:"var(--accent)" }}>#{myRank}</strong>
          </span>
        )}
      </div>

      {/* Top 3 podium */}
      {!loading && leaders.length >= 3 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1fr", gap:"16px", marginBottom:"28px", alignItems:"end" }} className="fade-up fade-up-1">
          {[leaders[1], leaders[0], leaders[2]].map((l, podiumIdx) => {
            const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
            const heights  = ["160px","200px","140px"];
            const colors   = ["#94a3b8","#f59e0b","#cd7f32"];
            const color    = colors[podiumIdx];
            const initials = l.name?.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() || "?";
            return (
              <div key={l._id} className="card" style={{ textAlign:"center", padding:"24px 16px", borderTop:`3px solid ${color}`, height:heights[podiumIdx], display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center" }}>
                <div style={{ fontSize:"32px", marginBottom:"4px" }}>{MEDALS[realRank-1]}</div>
                <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", fontWeight:"700", color:"#fff", margin:"0 auto 10px", boxShadow:`0 4px 12px ${color}40` }}>{initials}</div>
                <p style={{ fontWeight:"600", color:"var(--text)", fontSize:"14px", marginBottom:"2px" }}>{l.name || "User"}</p>
                <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"8px" }}>{l.email}</p>
                <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"28px", color, lineHeight:1 }}>{l.count}</p>
                <p style={{ fontSize:"11px", color:"var(--muted)" }}>approved</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="card fade-up fade-up-2" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid var(--border)" }}>
          <h3 style={{ fontSize:"16px", color:"var(--text)" }}>Full Rankings</h3>
        </div>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading…</div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>No data yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th><th>Contributor</th><th>Approved</th><th>Pending</th><th>Total</th><th>Badge</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((l, i) => {
                const isMe = l.email === myEmail;
                const color = TIER_COLORS[Math.min(i, 4)];
                const badge = i===0?"🏆 Champion": i===1?"🥈 Expert": i===2?"🥉 Pro": i<10?"⭐ Top 10":"👤 Contributor";
                const initials = l.name?.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()||"?";
                return (
                  <tr key={l._id} style={{ background: isMe ? "rgba(245,158,11,0.04)" : undefined }}>
                    <td>
                      <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:"20px", color: i<3?MEDALS[i].color:"var(--muted)" }}>
                        {i < 3 ? MEDALS[i] : `#${i+1}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:"700", color:"#fff", flexShrink:0 }}>{initials}</div>
                        <div>
                          <p style={{ fontWeight:"500", color:"var(--text)", fontSize:"14px" }}>{l.name || "Unknown"}{isMe && <span style={{ marginLeft:"6px", fontSize:"10px", color:"var(--accent)", fontWeight:"700" }}>YOU</span>}</p>
                          <p style={{ fontSize:"11px", color:"var(--muted)" }}>{l.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ color:"#10b981", fontWeight:"600" }}>{l.count}</span></td>
                    <td><span style={{ color:"#f59e0b" }}>{l.pending||0}</span></td>
                    <td><span style={{ color:"var(--text)", fontWeight:"600" }}>{l.total||l.count}</span></td>
                    <td><span style={{ fontSize:"12px", padding:"3px 10px", borderRadius:"99px", background:`${color}18`, color, border:`1px solid ${color}30` }}>{badge}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default Leaderboard;
