import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all"); // all | unread | read
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id===id ? {...n, read:true} : n));
    } catch {}
  };

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.put("/notifications/read-all");
      setNotifications(prev => prev.map(n=>({...n, read:true})));
    } catch {}
    finally { setMarking(false); }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n=>n._id!==id));
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (filter==="unread") return !n.read;
    if (filter==="read")   return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n=>!n.read).length;

  const getIcon = (msg) => {
    if (msg.includes("approved") || msg.includes("✅")) return { icon:"✅", color:"#10b981", bg:"rgba(16,185,129,0.08)" };
    if (msg.includes("rejected") || msg.includes("❌")) return { icon:"❌", color:"#ef4444", bg:"rgba(239,68,68,0.08)" };
    if (msg.includes("Welcome")  || msg.includes("👋")) return { icon:"👋", color:"#6366f1", bg:"rgba(99,102,241,0.08)" };
    return { icon:"🔔", color:"#f59e0b", bg:"rgba(245,158,11,0.08)" };
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const TabBtn = ({id, label, count}) => (
    <button onClick={()=>setFilter(id)} style={{
      padding:"7px 16px", borderRadius:"8px", border:"none", cursor:"pointer",
      fontFamily:"'DM Sans',sans-serif", fontSize:"13px", fontWeight: filter===id?"600":"400",
      background: filter===id ? "var(--surface2)" : "transparent",
      color: filter===id ? "var(--text)" : "var(--muted)", transition:"all 0.15s",
      display:"flex", alignItems:"center", gap:"6px",
    }}>
      {label}
      {count > 0 && (
        <span style={{ fontSize:"10px", fontWeight:"700", padding:"1px 6px", borderRadius:"99px", background:"var(--accent)", color:"#fff" }}>{count}</span>
      )}
    </button>
  );

  return (
    <Layout>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"32px" }} className="fade-up">
        <div>
          <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Updates</p>
          <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>Notifications</h1>
          <p style={{ color:"var(--muted)", fontSize:"15px" }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount>1?"s":""}` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-ghost" onClick={markAllRead} disabled={marking}>
            {marking ? "Marking…" : "✓ Mark all read"}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }} className="fade-up">
        <TabBtn id="all"    label="All"    count={0} />
        <TabBtn id="unread" label="Unread" count={unreadCount} />
        <TabBtn id="read"   label="Read"   count={0} />
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card fade-up" style={{ textAlign:"center", padding:"60px" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔔</div>
          <p style={{ color:"var(--text)", fontWeight:"600", marginBottom:"6px" }}>No notifications</p>
          <p style={{ color:"var(--muted)", fontSize:"14px" }}>{filter==="unread" ? "No unread notifications" : "Nothing here yet"}</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {filtered.map((n, i) => {
            const { icon, color, bg } = getIcon(n.message);
            return (
              <div
                key={n._id}
                className={`fade-up fade-up-${Math.min(i+1,5)}`}
                onClick={()=>!n.read && markRead(n._id)}
                style={{
                  display:"flex", alignItems:"flex-start", gap:"14px",
                  padding:"16px 20px", borderRadius:"12px",
                  background: n.read ? "var(--surface)" : bg,
                  border:`1px solid ${n.read ? "var(--border)" : color+"40"}`,
                  cursor: n.read ? "default" : "pointer",
                  transition:"all 0.2s", position:"relative",
                }}
                onMouseEnter={e=>{ if(!n.read) e.currentTarget.style.transform="translateX(4px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="translateX(0)"; }}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span style={{ position:"absolute", top:"14px", left:"8px", width:"6px", height:"6px", borderRadius:"50%", background:color }} />
                )}

                <div style={{ width:"40px", height:"40px", borderRadius:"10px", background: n.read?"var(--surface2)":bg, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
                  {icon}
                </div>

                <div style={{ flex:1 }}>
                  <p style={{ fontSize:"14px", color:"var(--text)", lineHeight:"1.5", marginBottom:"4px", fontWeight: n.read?"400":"500" }}>
                    {n.message}
                  </p>
                  <p style={{ fontSize:"12px", color:"var(--muted)" }}>{timeAgo(n.createdAt)}</p>
                </div>

                <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                  {!n.read && (
                    <button onClick={e=>{e.stopPropagation();markRead(n._id);}} style={{
                      padding:"4px 10px", borderRadius:"6px", border:"1px solid "+color+"40",
                      background:bg, color, fontSize:"11px", fontWeight:"600", cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif",
                    }}>Mark read</button>
                  )}
                  <button onClick={e=>{e.stopPropagation();deleteNotif(n._id);}} style={{
                    padding:"4px 8px", borderRadius:"6px", border:"1px solid var(--border)",
                    background:"transparent", color:"var(--muted)", fontSize:"14px", cursor:"pointer",
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="rgba(239,68,68,0.3)";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="var(--border)";}}
                  >×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default Notifications;
