import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

function Toast({ msg, type, onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t);},[onClose]);
  return <div className={`toast toast-${type}`}><span>{type==="success"?"✅":"❌"}</span><span style={{flex:1,fontSize:"14px",color:"var(--text)"}}>{msg}</span><span onClick={onClose} style={{cursor:"pointer",color:"var(--muted)"}}>×</span></div>;
}

function ConfirmModal({ message, onConfirm, onClose, danger=true }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <p style={{ fontSize:"16px", color:"var(--text)", marginBottom:"20px", lineHeight:"1.5" }}>{message}</p>
        <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"10px 20px", background:danger?"#ef4444":"var(--accent)", color:"#fff", border:"none", borderRadius:"10px", fontFamily:"'DM Sans',sans-serif", fontWeight:"600", cursor:"pointer" }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function SuspendModal({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontSize:"18px", color:"var(--text)", marginBottom:"8px" }}>🛑 Suspend {user.name}</h3>
        <p style={{ fontSize:"13px", color:"var(--muted)", marginBottom:"16px" }}>The user will be notified and blocked from logging in.</p>
        <textarea className="input" rows={3} placeholder="Reason for suspension…" value={reason} onChange={e=>setReason(e.target.value)} style={{ resize:"vertical", marginBottom:"16px" }} />
        <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button onClick={()=>onConfirm(reason)} style={{ padding:"10px 20px", background:"#ef4444", color:"#fff", border:"none", borderRadius:"10px", fontFamily:"'DM Sans',sans-serif", fontWeight:"600", cursor:"pointer" }}>Suspend User</button>
        </div>
      </div>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterRole, setFilter] = useState("all");
  const [toast, setToast]       = useState(null);
  const [modal, setModal]       = useState(null);   // { type, user }
  const [actioning, setAction]  = useState(null);

  const myId = localStorage.getItem("userId");
  const showToast = (msg, type="success") => setToast({msg,type});

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get("/admin/users"); setUsers(r.data); }
    catch {} finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const doAction = async (action, userId, extra={}) => {
    setAction(userId+"_"+action);
    try {
      let r;
      if (action === "promote")   r = await api.put(`/admin/users/${userId}/promote`);
      if (action === "demote")    r = await api.put(`/admin/users/${userId}/demote`);
      if (action === "suspend")   r = await api.put(`/admin/users/${userId}/suspend`, { reason: extra.reason });
      if (action === "unsuspend") r = await api.put(`/admin/users/${userId}/unsuspend`);
      if (action === "delete")  { await api.delete(`/admin/users/${userId}`); setUsers(u=>u.filter(x=>x._id!==userId)); showToast("User deleted"); return; }
      setUsers(u => u.map(x => x._id===userId ? r.data : x));
      showToast(action === "promote"?"Promoted to admin": action === "demote"?"Demoted to user": action === "suspend"?"User suspended": "User unsuspended");
    } catch(e) { showToast(e.response?.data || "Action failed","error"); }
    finally { setAction(null); setModal(null); }
  };

  const filtered = users.filter(u => {
    const matchS = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchR = filterRole==="all" || (filterRole==="suspended" ? u.suspended : u.role===filterRole);
    return matchS && matchR;
  });

  const admins     = users.filter(u=>u.role==="admin").length;
  const suspended  = users.filter(u=>u.suspended).length;
  const regular    = users.filter(u=>u.role==="user"&&!u.suspended).length;

  const initials = (name) => name?.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()||"?";

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      {modal?.type==="delete"   && <ConfirmModal message={`Delete ${modal.user.name}? This is permanent.`} onConfirm={()=>doAction("delete",modal.user._id)} onClose={()=>setModal(null)} />}
      {modal?.type==="demote"   && <ConfirmModal message={`Demote ${modal.user.name} from admin to user?`} onConfirm={()=>doAction("demote",modal.user._id)} onClose={()=>setModal(null)} />}
      {modal?.type==="unsuspend"&& <ConfirmModal message={`Lift suspension for ${modal.user.name}?`} onConfirm={()=>doAction("unsuspend",modal.user._id)} onClose={()=>setModal(null)} danger={false} />}
      {modal?.type==="suspend"  && <SuspendModal user={modal.user} onConfirm={(r)=>doAction("suspend",modal.user._id,{reason:r})} onClose={()=>setModal(null)} />}

      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Admin · Users</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>Manage Users</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Promote, suspend, and manage platform users</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }} className="fade-up fade-up-1">
        {[
          { label:"Total",     value:users.length, color:"#6366f1", icon:"👥" },
          { label:"Admins",    value:admins,       color:"#e11d48", icon:"🛡" },
          { label:"Active",    value:regular,      color:"#10b981", icon:"✅" },
          { label:"Suspended", value:suspended,    color:"#ef4444", icon:"🛑" },
        ].map(({label,value,color,icon})=>(
          <div key={label} className="card" style={{ borderLeft:`3px solid ${color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <p style={{ color:"var(--muted)", fontSize:"12px", marginBottom:"4px" }}>{label}</p>
                <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"36px", color, lineHeight:1 }}>{value}</p>
              </div>
              <span style={{ fontSize:"22px", opacity:0.7 }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px" }} className="fade-up">
        <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"8px 14px", color:"var(--text)", fontSize:"13px", outline:"none" }} />
        {["all","admin","user","suspended"].map(r=>(
          <button key={r} onClick={()=>setFilter(r)} style={{
            padding:"8px 14px", borderRadius:"8px", border:`1px solid ${filterRole===r?"var(--accent)":"var(--border)"}`,
            background:filterRole===r?"rgba(245,158,11,0.1)":"transparent",
            color:filterRole===r?"var(--accent)":"var(--muted)",
            fontFamily:"'DM Sans',sans-serif", fontSize:"13px", cursor:"pointer", textTransform:"capitalize",
          }}>{r}</button>
        ))}
      </div>

      <div className="card fade-up fade-up-2" style={{ padding:0, overflow:"hidden" }}>
        {loading ? <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading…</div>
        : (
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th style={{ textAlign:"right" }}>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isMe = u._id === myId;
                const color = u.role==="admin" ? "#e11d48" : "#6366f1";
                return (
                  <tr key={u._id} style={{ opacity: u.suspended ? 0.6 : 1 }}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:"700", color:"#fff", flexShrink:0 }}>{initials(u.name)}</div>
                        <div>
                          <p style={{ fontWeight:"500", color:"var(--text)", fontSize:"14px" }}>{u.name}{isMe&&<span style={{ marginLeft:"6px", fontSize:"10px", color:"var(--accent)" }}>YOU</span>}</p>
                          <p style={{ fontSize:"11px", color:"var(--muted)" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"99px", background:`${color}15`, color, textTransform:"uppercase" }}>
                        {u.role==="admin"?"🛡 Admin":"👤 User"}
                      </span>
                    </td>
                    <td>
                      {u.suspended
                        ? <span title={u.suspendReason} style={{ fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"99px", background:"rgba(239,68,68,0.1)", color:"#ef4444" }}>🛑 Suspended</span>
                        : <span style={{ fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"99px", background:"rgba(16,185,129,0.1)", color:"#10b981" }}>✅ Active</span>
                      }
                    </td>
                    <td style={{ fontSize:"12px", color:"var(--muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
                    <td style={{ textAlign:"right" }}>
                      {!isMe && (
                        <div style={{ display:"flex", gap:"6px", justifyContent:"flex-end", flexWrap:"wrap" }}>
                          {u.role==="user" && !u.suspended && (
                            <button className="btn-ghost" style={{ padding:"5px 10px", fontSize:"12px", color:"#f59e0b", borderColor:"rgba(245,158,11,0.3)" }}
                              disabled={!!actioning} onClick={()=>doAction("promote",u._id)}>⬆ Promote</button>
                          )}
                          {u.role==="admin" && (
                            <button className="btn-ghost" style={{ padding:"5px 10px", fontSize:"12px" }}
                              disabled={!!actioning} onClick={()=>setModal({type:"demote",user:u})}>⬇ Demote</button>
                          )}
                          {!u.suspended ? (
                            <button style={{ padding:"5px 10px", fontSize:"12px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#ef4444", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                              disabled={!!actioning} onClick={()=>setModal({type:"suspend",user:u})}>🛑 Suspend</button>
                          ) : (
                            <button className="btn-ghost" style={{ padding:"5px 10px", fontSize:"12px", color:"#10b981", borderColor:"rgba(16,185,129,0.3)" }}
                              disabled={!!actioning} onClick={()=>setModal({type:"unsuspend",user:u})}>✔ Unsuspend</button>
                          )}
                          <button style={{ padding:"5px 8px", fontSize:"13px", borderRadius:"8px", border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", cursor:"pointer" }}
                            disabled={!!actioning} onClick={()=>setModal({type:"delete",user:u})}
                            onMouseEnter={e=>{e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="rgba(239,68,68,0.3)";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="var(--border)";}}>🗑</button>
                        </div>
                      )}
                    </td>
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

export default AdminUsers;
