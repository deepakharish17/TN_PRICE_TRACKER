import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

const COMMODITY_ICONS = { "Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕" };
const getIcon = n => COMMODITY_ICONS[n] || "🌿";

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span>{type==="success"?"✅":"❌"}</span>
      <span style={{ flex:1, fontSize:"14px", color:"var(--text)" }}>{msg}</span>
      <span onClick={onClose} style={{ cursor:"pointer", color:"var(--muted)", fontSize:"18px" }}>×</span>
    </div>
  );
}

function RejectModal({ item, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize:"20px", color:"var(--text)", marginBottom:"8px" }}>Reject Submission</h3>
        <p style={{ fontSize:"13px", color:"var(--muted)", marginBottom:"16px" }}>
          {getIcon(item.commodity)} {item.commodity} · ₹{item.price} · {item.district}
        </p>
        <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Reason for rejection</label>
        <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. Price seems too high for this region" style={{ marginTop:"6px", resize:"vertical" }} />
        <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"20px" }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" style={{ padding:"10px 20px", border:"none", borderRadius:"10px", background:"#ef4444", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontWeight:"600", cursor:"pointer" }}
            onClick={() => onConfirm(reason || "No reason provided")}>Reject</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ item, onSave, onCancel }) {
  const [form, setForm] = useState({ price: item.price, marketName: item.marketName, district: item.district });
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize:"20px", color:"var(--text)", marginBottom:"16px" }}>Edit Submission</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Commodity</label>
            <input className="input" value={item.commodity} disabled style={{ opacity:0.5 }} />
          </div>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Market Name</label>
            <input className="input" value={form.marketName} onChange={e => setForm(f=>({...f,marketName:e.target.value}))} />
          </div>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>District</label>
            <input className="input" value={form.district} onChange={e => setForm(f=>({...f,district:e.target.value}))} />
          </div>
          <div>
            <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Price (₹/kg)</label>
            <input type="number" className="input" value={form.price} onChange={e => setForm(f=>({...f,price:Number(e.target.value)}))} />
          </div>
        </div>
        <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"20px" }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={() => onSave(form)}>Save & Approve</button>
        </div>
      </div>
    </div>
  );
}

function PendingReview() {
  const [data,          setData]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);
  const [rejectModal,   setRejectModal]   = useState(null);
  const [editModal,     setEditModal]     = useState(null);
  const [selected,      setSelected]      = useState(new Set());
  const [actionLoading, setActionLoading] = useState(null);
  const [search,        setSearch]        = useState("");
  const [filterDistrict,setFilterDistrict]= useState("");
  const [bulkLoading,   setBulkLoading]   = useState(false);

  const showToast = (msg, type="success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get("/admin/pending"); setData(r.data); }
    catch { showToast("Failed to load", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtered data
  const filtered = data.filter(item => {
    const matchSearch = !search ||
      item.commodity.toLowerCase().includes(search.toLowerCase()) ||
      item.marketName.toLowerCase().includes(search.toLowerCase()) ||
      item.userId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchDistrict = !filterDistrict || item.district === filterDistrict;
    return matchSearch && matchDistrict;
  });

  const allDistrictsInData = [...new Set(data.map(d => d.district))].sort();

  // Single approve
  const handleApprove = async (id) => {
    setActionLoading(id+"_approve");
    try { await api.put(`/admin/approve/${id}`); setData(p => p.filter(x => x._id !== id)); showToast("Approved ✅"); }
    catch { showToast("Failed", "error"); }
    finally { setActionLoading(null); }
  };

  // Single reject
  const handleReject = async (reason) => {
    if (!rejectModal) return;
    setActionLoading(rejectModal._id+"_reject");
    try {
      await api.put(`/admin/reject/${rejectModal._id}`, { reason });
      setData(p => p.filter(x => x._id !== rejectModal._id));
      setRejectModal(null);
      showToast("Rejected");
    } catch { showToast("Failed", "error"); }
    finally { setActionLoading(null); }
  };

  // Edit & approve
  const handleEditSave = async (form) => {
    setActionLoading(editModal._id+"_edit");
    try {
      await api.put(`/admin/edit/${editModal._id}`, form);
      await api.put(`/admin/approve/${editModal._id}`);
      setData(p => p.filter(x => x._id !== editModal._id));
      setEditModal(null);
      showToast("Edited & approved ✅");
    } catch { showToast("Failed", "error"); }
    finally { setActionLoading(null); }
  };

  // Bulk approve
  const bulkApprove = async () => {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map(id => api.put(`/admin/approve/${id}`)));
      setData(p => p.filter(x => !selected.has(x._id)));
      setSelected(new Set());
      showToast(`✅ Approved ${selected.size} submissions`);
    } catch { showToast("Bulk approve failed", "error"); }
    finally { setBulkLoading(false); }
  };

  // Bulk reject
  const bulkReject = async () => {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map(id => api.put(`/admin/reject/${id}`, { reason: "Bulk rejected by admin" })));
      setData(p => p.filter(x => !selected.has(x._id)));
      setSelected(new Set());
      showToast(`Rejected ${selected.size} submissions`);
    } catch { showToast("Bulk reject failed", "error"); }
    finally { setBulkLoading(false); }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Commodity","Market","District","Price","Submitted By","Date"];
    const rows = data.map(d => [
      d.commodity, d.marketName, d.district, d.price,
      d.userId?.name || d.userId?.email || "—",
      new Date(d.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `pending-review-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(filtered.map(d => d._id)));
  const clearSelect = () => setSelected(new Set());

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {rejectModal && <RejectModal item={rejectModal} onConfirm={handleReject} onCancel={() => setRejectModal(null)} />}
      {editModal   && <EditModal   item={editModal}   onSave={handleEditSave} onCancel={() => setEditModal(null)} />}

      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Admin · Moderation</p>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>Pending Review</h1>
            <p style={{ color:"var(--muted)", fontSize:"15px" }}>{data.length} submission{data.length!==1?"s":""} awaiting review</p>
          </div>
          <button className="btn-ghost" onClick={exportCSV}>📥 Export CSV</button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{ display:"flex", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }} className="fade-up">
        <input placeholder="Search commodity, market, user…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 14px", color:"var(--text)", fontSize:"13px", outline:"none", flex:1, minWidth:"200px" }} />
        <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
          style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 14px", color:"var(--text)", fontSize:"13px", outline:"none", cursor:"pointer" }}>
          <option value="">All Districts</option>
          {allDistrictsInData.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {filtered.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px", padding:"10px 16px", background:"var(--surface)", borderRadius:"10px", border:"1px solid var(--border)" }} className="fade-up">
          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
            onChange={e => e.target.checked ? selectAll() : clearSelect()}
            style={{ width:"16px", height:"16px", cursor:"pointer", accentColor:"var(--accent)" }} />
          <span style={{ fontSize:"13px", color:"var(--muted)" }}>
            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
          </span>
          {selected.size > 0 && (
            <>
              <div style={{ height:"16px", width:"1px", background:"var(--border)" }} />
              <button className="btn-success" disabled={bulkLoading} onClick={bulkApprove}>
                {bulkLoading ? "…" : `✅ Approve (${selected.size})`}
              </button>
              <button className="btn-danger" disabled={bulkLoading} onClick={bulkReject}>
                {bulkLoading ? "…" : `❌ Reject (${selected.size})`}
              </button>
              <button onClick={clearSelect} style={{ fontSize:"12px", color:"var(--muted)", background:"none", border:"none", cursor:"pointer" }}>Clear</button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"80px", color:"var(--muted)" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card fade-up" style={{ textAlign:"center", padding:"60px" }}>
          <p style={{ fontSize:"32px", marginBottom:"12px" }}>✅</p>
          <h3 style={{ color:"var(--text)", marginBottom:"8px" }}>
            {data.length === 0 ? "Queue is empty" : "No results for this filter"}
          </h3>
          <p style={{ color:"var(--muted)", fontSize:"14px" }}>All submissions have been reviewed</p>
        </div>
      ) : (
        <div className="card fade-up" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width:"40px" }}></th>
                <th>Commodity</th>
                <th>Market · District</th>
                <th>Price</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th style={{ textAlign:"right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} style={{ background: selected.has(item._id) ? "rgba(245,158,11,0.04)" : "transparent" }}>
                  <td>
                    <input type="checkbox" checked={selected.has(item._id)} onChange={() => toggleSelect(item._id)}
                      style={{ width:"15px", height:"15px", cursor:"pointer", accentColor:"var(--accent)" }} />
                  </td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ width:"34px", height:"34px", background:"var(--surface2)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>{getIcon(item.commodity)}</span>
                      <span style={{ fontWeight:"500", color:"var(--text)" }}>{item.commodity}</span>
                    </div>
                  </td>
                  <td style={{ color:"var(--muted)", fontSize:"13px" }}>
                    <span>{item.marketName}</span><br/>
                    <span style={{ fontSize:"11px" }}>{item.district}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:"20px", color:"#f59e0b" }}>₹{item.price}</span>
                    <span style={{ fontSize:"11px", color:"var(--muted)", marginLeft:"2px" }}>/kg</span>
                  </td>
                  <td style={{ fontSize:"13px", color:"var(--muted)" }}>
                    <span style={{ color:"var(--text)", fontWeight:"500" }}>{item.userId?.name || "—"}</span><br/>
                    <span style={{ fontSize:"11px" }}>{item.userId?.email}</span>
                  </td>
                  <td style={{ fontSize:"12px", color:"var(--muted)" }}>
                    {new Date(item.createdAt).toLocaleDateString("en-IN",{ day:"numeric", month:"short" })}
                  </td>
                  <td style={{ textAlign:"right" }}>
                    <div style={{ display:"flex", gap:"6px", justifyContent:"flex-end" }}>
                      <button className="btn-ghost" style={{ padding:"5px 10px", fontSize:"12px" }}
                        onClick={() => setEditModal(item)} title="Edit & approve">✏️</button>
                      <button className="btn-success" disabled={actionLoading===item._id+"_approve"}
                        onClick={() => handleApprove(item._id)}>
                        {actionLoading===item._id+"_approve" ? "…" : "✅"}
                      </button>
                      <button className="btn-danger" disabled={actionLoading===item._id+"_reject"}
                        onClick={() => setRejectModal(item)}>
                        {actionLoading===item._id+"_reject" ? "…" : "❌"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export default PendingReview;
