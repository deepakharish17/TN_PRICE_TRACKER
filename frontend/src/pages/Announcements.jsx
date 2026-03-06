import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { isAdmin } from "../utils/auth";

function Toast({ msg, type, onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t);},[onClose]);
  return <div className={`toast toast-${type}`}><span>{type==="success"?"✅":"❌"}</span><span style={{flex:1,fontSize:"14px",color:"var(--text)"}}>{msg}</span><span onClick={onClose} style={{cursor:"pointer",color:"var(--muted)"}}>×</span></div>;
}

const TYPE_CONFIG = {
  info:    { icon:"📢", color:"#6366f1", bg:"rgba(99,102,241,0.08)",  label:"Info" },
  alert:   { icon:"⚠️", color:"#f59e0b", bg:"rgba(245,158,11,0.08)", label:"Alert" },
  success: { icon:"✅", color:"#10b981", bg:"rgba(16,185,129,0.08)",  label:"Good News" },
  urgent:  { icon:"🚨", color:"#ef4444", bg:"rgba(239,68,68,0.08)",   label:"Urgent" },
};

function Announcements() {
  const admin = isAdmin();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState({ title:"", body:"", type:"info" });
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type="success") => setToast({msg,type});

  useEffect(()=>{
    api.get("/announcements").then(r=>setItems(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const handlePost = async () => {
    if (!form.title.trim() || !form.body.trim()) return showToast("Fill in all fields","error");
    setSaving(true);
    try {
      const r = await api.post("/announcements", form);
      setItems(prev => [r.data, ...prev]);
      setForm({ title:"", body:"", type:"info" });
      setShowForm(false);
      showToast("Announcement posted!");
    } catch { showToast("Failed to post","error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setItems(prev => prev.filter(a=>a._id!==id));
      showToast("Deleted");
    } catch { showToast("Failed","error"); }
  };

  const timeAgo = (d) => {
    const s = (Date.now()-new Date(d))/1000;
    if (s<60) return "Just now";
    if (s<3600) return `${Math.floor(s/60)}m ago`;
    if (s<86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"32px" }} className="fade-up">
        <div>
          <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>News</p>
          <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>📰 Announcements</h1>
          <p style={{ color:"var(--muted)", fontSize:"15px" }}>Platform news, price alerts and admin updates</p>
        </div>
        {admin && <button className="btn" onClick={()=>setShowForm(!showForm)}>{showForm?"✕ Cancel":"📣 Post Announcement"}</button>}
      </div>

      {/* Admin compose form */}
      {admin && showForm && (
        <div className="card fade-up" style={{ marginBottom:"24px", borderTop:"2px solid var(--accent)" }}>
          <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"16px" }}>New Announcement</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ display:"flex", gap:"12px" }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Title</label>
                <input className="input" value={form.title} placeholder="Announcement title…" onChange={e=>setForm({...form,title:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Type</label>
                <select className="input" value={form.type} style={{ cursor:"pointer" }} onChange={e=>setForm({...form,type:e.target.value})}>
                  {Object.entries(TYPE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Message</label>
              <textarea className="input" rows={4} value={form.body} placeholder="Write the announcement body…" onChange={e=>setForm({...form,body:e.target.value})} style={{ resize:"vertical" }} />
            </div>
            {/* Preview */}
            {form.title && (
              <div style={{ padding:"14px 16px", borderRadius:"12px", background:TYPE_CONFIG[form.type].bg, border:`1px solid ${TYPE_CONFIG[form.type].color}30` }}>
                <p style={{ fontSize:"11px", color:TYPE_CONFIG[form.type].color, fontWeight:"700", marginBottom:"4px", textTransform:"uppercase" }}>Preview</p>
                <p style={{ fontSize:"15px", fontWeight:"600", color:"var(--text)", marginBottom:"4px" }}>{TYPE_CONFIG[form.type].icon} {form.title}</p>
                <p style={{ fontSize:"13px", color:"var(--muted)" }}>{form.body || "…"}</p>
              </div>
            )}
            <div style={{ display:"flex", gap:"10px" }}>
              <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn" onClick={handlePost} disabled={saving}>{saving?"Posting…":"📣 Post to all users"}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div className="card fade-up" style={{ textAlign:"center", padding:"60px" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>📭</div>
          <p style={{ color:"var(--text)", fontWeight:"600", marginBottom:"6px" }}>No announcements yet</p>
          <p style={{ color:"var(--muted)", fontSize:"14px" }}>Check back later for platform news and updates</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          {items.map((item, i) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            return (
              <div key={item._id} className={`card fade-up fade-up-${Math.min(i+1,5)}`} style={{ background:cfg.bg, border:`1px solid ${cfg.color}25`, position:"relative" }}>
                {admin && (
                  <button onClick={()=>handleDelete(item._id)} style={{ position:"absolute", top:"14px", right:"14px", background:"transparent", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:"18px" }}
                    onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>×</button>
                )}
                <div style={{ display:"flex", alignItems:"flex-start", gap:"14px" }}>
                  <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:`${cfg.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{cfg.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                      <h3 style={{ fontSize:"16px", color:"var(--text)" }}>{item.title}</h3>
                      <span style={{ fontSize:"10px", fontWeight:"700", padding:"2px 8px", borderRadius:"99px", background:`${cfg.color}18`, color:cfg.color, textTransform:"uppercase" }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize:"14px", color:"var(--muted)", lineHeight:"1.6", marginBottom:"10px" }}>{item.body}</p>
                    <p style={{ fontSize:"12px", color:"var(--muted)" }}>
                      Posted by <strong style={{ color:"var(--text)" }}>{item.postedBy?.name || "Admin"}</strong> · {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default Announcements;
