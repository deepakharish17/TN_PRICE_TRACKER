import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

const ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = n => ICONS[n] || "🌿";

function Toast({msg,type,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t);},[onClose]);
  return <div className={`toast toast-${type}`}><span>{type==="success"?"✅":"❌"}</span><span style={{flex:1,fontSize:"13px",color:"var(--text)"}}>{msg}</span><span onClick={onClose} style={{cursor:"pointer",color:"var(--muted)",fontSize:"18px"}}>×</span></div>;
}

function RejectModal({item,onConfirm,onCancel}) {
  const [reason,setReason]=useState("");
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <h3 style={{fontSize:"18px",color:"var(--text)",marginBottom:"6px"}}>Reject Submission</h3>
        <p style={{fontSize:"12px",color:"var(--muted)",marginBottom:"14px"}}>{getIcon(item.commodity)} {item.commodity} · ₹{item.price} · {item.district}</p>
        <label style={{fontSize:"13px",color:"var(--muted)",fontWeight:"500"}}>Reason</label>
        <textarea className="input" rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why is this being rejected?" style={{marginTop:"6px",resize:"vertical"}} />
        <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",marginTop:"16px",flexWrap:"wrap"}}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button style={{padding:"10px 20px",background:"#ef4444",color:"#fff",border:"none",borderRadius:"10px",fontFamily:"'DM Sans',sans-serif",fontWeight:"600",cursor:"pointer"}} onClick={()=>onConfirm(reason||"No reason given")}>Reject</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({item,onSave,onCancel}) {
  const [form,setForm]=useState({price:item.price,marketName:item.marketName,district:item.district});
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <h3 style={{fontSize:"18px",color:"var(--text)",marginBottom:"14px"}}>Edit Submission</h3>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <div><label style={{fontSize:"12px",color:"var(--muted)",fontWeight:"500"}}>Commodity</label><input className="input" value={item.commodity} disabled style={{opacity:0.5}} /></div>
          <div><label style={{fontSize:"12px",color:"var(--muted)",fontWeight:"500"}}>Market Name</label><input className="input" value={form.marketName} onChange={e=>setForm(f=>({...f,marketName:e.target.value}))} /></div>
          <div><label style={{fontSize:"12px",color:"var(--muted)",fontWeight:"500"}}>District</label><input className="input" value={form.district} onChange={e=>setForm(f=>({...f,district:e.target.value}))} /></div>
          <div><label style={{fontSize:"12px",color:"var(--muted)",fontWeight:"500"}}>Price (₹/kg)</label><input type="number" className="input" value={form.price} onChange={e=>setForm(f=>({...f,price:Number(e.target.value)}))} /></div>
        </div>
        <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",marginTop:"16px",flexWrap:"wrap"}}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={()=>onSave(form)}>Save & Approve</button>
        </div>
      </div>
    </div>
  );
}

function PendingReview() {
  const [data,setData]           = useState([]);
  const [loading,setLoading]     = useState(true);
  const [toast,setToast]         = useState(null);
  const [rejectModal,setRejectM] = useState(null);
  const [editModal,setEditM]     = useState(null);
  const [selected,setSelected]   = useState(new Set());
  const [actioning,setActioning] = useState(null);
  const [search,setSearch]       = useState("");
  const showToast = (msg,type="success") => setToast({msg,type});

  const load = useCallback(async()=>{
    setLoading(true);
    try { const r=await api.get("/admin/pending"); setData(r.data); }
    catch {} finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  const approve = async(id) => {
    setActioning(id);
    try { await api.put(`/admin/approve/${id}`); setData(d=>d.filter(x=>x._id!==id)); showToast("Approved ✅"); }
    catch { showToast("Failed","error"); } finally { setActioning(null); }
  };

  const reject = async(id,reason) => {
    setActioning(id);
    try { await api.put(`/admin/reject/${id}`,{reason}); setData(d=>d.filter(x=>x._id!==id)); setRejectM(null); showToast("Rejected"); }
    catch { showToast("Failed","error"); } finally { setActioning(null); }
  };

  const editAndApprove = async(id,form) => {
    setActioning(id);
    try {
      await api.put(`/admin/edit/${id}`,form);
      await api.put(`/admin/approve/${id}`);
      setData(d=>d.filter(x=>x._id!==id)); setEditM(null); showToast("Edited & Approved ✅");
    } catch { showToast("Failed","error"); } finally { setActioning(null); }
  };

  const bulkApprove = async() => {
    setActioning("bulk");
    try {
      await Promise.all([...selected].map(id=>api.put(`/admin/approve/${id}`)));
      setData(d=>d.filter(x=>!selected.has(x._id))); setSelected(new Set()); showToast(`Approved ${selected.size} ✅`);
    } catch { showToast("Bulk failed","error"); } finally { setActioning(null); }
  };

  const toggleSel = id => setSelected(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const filtered = data.filter(p => !search || p.commodity.toLowerCase().includes(search.toLowerCase()) || p.marketName?.toLowerCase().includes(search.toLowerCase()) || p.userId?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      {rejectModal && <RejectModal item={rejectModal} onConfirm={(r)=>reject(rejectModal._id,r)} onCancel={()=>setRejectM(null)} />}
      {editModal   && <EditModal   item={editModal}   onSave={(f)=>editAndApprove(editModal._id,f)} onCancel={()=>setEditM(null)} />}

      <div style={{ marginBottom:"20px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Admin · Moderation</p>
        <h1 style={{ fontSize:"clamp(22px,5vw,34px)", color:"var(--text)", marginBottom:"4px" }}>Pending Review</h1>
        <p style={{ color:"var(--muted)", fontSize:"14px" }}>{data.length} submission{data.length!==1?"s":""} awaiting review</p>
      </div>

      {/* Search + bulk */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"16px", flexWrap:"wrap" }} className="fade-up">
        <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:"1 1 160px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 12px", color:"var(--text)", fontSize:"13px", outline:"none", minWidth:0 }} />
        {selected.size>0 && (
          <button className="btn" style={{ padding:"9px 14px", fontSize:"13px" }} disabled={actioning==="bulk"} onClick={bulkApprove}>
            ✅ Approve {selected.size}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading…</div>
      ) : filtered.length===0 ? (
        <div className="card" style={{ textAlign:"center", padding:"48px" }}>
          <p style={{ fontSize:"36px", marginBottom:"12px" }}>🎉</p>
          <p style={{ fontWeight:"600", color:"var(--text)" }}>All caught up!</p>
          <p style={{ color:"var(--muted)", fontSize:"13px", marginTop:"4px" }}>No pending submissions</p>
        </div>
      ) : (
        /* Mobile: card list. Desktop: table */
        <>
          {/* Card layout — always shown, works great on mobile */}
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {filtered.map(item=>(
              <div key={item._id} className="card fade-up" style={{ padding:"14px", borderLeft:`3px solid ${selected.has(item._id)?"var(--accent)":"var(--border)"}` }}>
                {/* Row 1: checkbox + icon + name + price */}
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                  <input type="checkbox" checked={selected.has(item._id)} onChange={()=>toggleSel(item._id)}
                    style={{ width:"16px", height:"16px", accentColor:"var(--accent)", flexShrink:0, cursor:"pointer" }} />
                  <span style={{ fontSize:"24px" }}>{getIcon(item.commodity)}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:"600", color:"var(--text)", fontSize:"14px" }}>{item.commodity}</p>
                    <p style={{ fontSize:"11px", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.marketName} · {item.district}</p>
                  </div>
                  <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"22px", color:"var(--accent)", flexShrink:0 }}>₹{item.price}</p>
                </div>
                {/* Row 2: submitter info */}
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px", paddingLeft:"26px" }}>
                  <span style={{ fontSize:"10px", color:"var(--muted)" }}>by</span>
                  <p style={{ fontSize:"12px", color:"var(--text)" }}>{item.userId?.name||"User"}</p>
                  <span style={{ fontSize:"10px", color:"var(--muted)" }}>·</span>
                  <p style={{ fontSize:"11px", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis" }}>{new Date(item.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                </div>
                {/* Row 3: action buttons */}
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", paddingLeft:"26px" }}>
                  <button className="btn-success" disabled={!!actioning} onClick={()=>approve(item._id)} style={{ fontSize:"12px", padding:"6px 12px" }}>
                    {actioning===item._id?"…":"✅ Approve"}
                  </button>
                  <button className="btn-ghost" disabled={!!actioning} onClick={()=>setEditM(item)} style={{ fontSize:"12px", padding:"6px 12px" }}>✏️ Edit</button>
                  <button className="btn-danger" disabled={!!actioning} onClick={()=>setRejectM(item)} style={{ fontSize:"12px", padding:"6px 12px" }}>❌ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}

export default PendingReview;
