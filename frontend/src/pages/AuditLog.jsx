import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

const ACTION_CONFIG = {
  approve:    { icon:"✅", color:"#10b981", label:"Approved" },
  reject:     { icon:"❌", color:"#ef4444", label:"Rejected" },
  edit:       { icon:"✏️", color:"#6366f1", label:"Edited" },
  promote:    { icon:"⬆️", color:"#f59e0b", label:"Promoted" },
  demote:     { icon:"⬇️", color:"#f97316", label:"Demoted" },
  suspend:    { icon:"🛑", color:"#ef4444", label:"Suspended" },
  unsuspend:  { icon:"✔️", color:"#10b981", label:"Unsuspended" },
  delete:     { icon:"🗑️", color:"#ef4444", label:"Deleted" },
  announce:   { icon:"📣", color:"#6366f1", label:"Announced" },
  login:      { icon:"🔑", color:"#f59e0b", label:"Logged in" },
};

function AuditLog() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterAction, setFilter] = useState("");
  const [page, setPage]         = useState(1);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/audit");
      setLogs(r.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const timeAgo = (d) => {
    const s = (Date.now()-new Date(d))/1000;
    if (s<60) return "Just now";
    if (s<3600) return `${Math.floor(s/60)}m ago`;
    if (s<86400) return `${Math.floor(s/3600)}h ago`;
    return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  };

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.adminName?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <Layout>
      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Admin · Accountability</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>📋 Audit Log</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Full record of all admin actions on the platform</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }} className="fade-up">
        <input placeholder="Search admin or details…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
          style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"8px 14px", color:"var(--text)", fontSize:"13px", outline:"none", flex:1, minWidth:"200px" }} />
        <select value={filterAction} onChange={e=>{setFilter(e.target.value);setPage(1);}}
          style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"8px", padding:"8px 12px", color:"var(--text)", fontSize:"13px", cursor:"pointer", outline:"none" }}>
          <option value="">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <span style={{ fontSize:"13px", color:"var(--muted)", display:"flex", alignItems:"center" }}>{filtered.length} entries</span>
      </div>

      <div className="card fade-up fade-up-1" style={{ padding:0, overflow:"hidden" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>Loading audit log…</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)" }}>No entries found</div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr><th>Action</th><th>Admin</th><th>Details</th><th>Target</th><th>Time</th></tr>
              </thead>
              <tbody>
                {paginated.map(log => {
                  const cfg = ACTION_CONFIG[log.action] || { icon:"•", color:"var(--muted)", label:log.action };
                  return (
                    <tr key={log._id}>
                      <td>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"3px 10px", borderRadius:"99px", fontSize:"12px", fontWeight:"600", background:`${cfg.color}15`, color:cfg.color, border:`1px solid ${cfg.color}30` }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td>
                        <p style={{ fontSize:"13px", fontWeight:"500", color:"var(--text)" }}>{log.adminName || "Admin"}</p>
                        <p style={{ fontSize:"11px", color:"var(--muted)" }}>{log.adminEmail}</p>
                      </td>
                      <td style={{ color:"var(--muted)", fontSize:"13px", maxWidth:"280px" }}>
                        <p style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{log.details}</p>
                      </td>
                      <td style={{ fontSize:"12px", color:"var(--muted)" }}>{log.targetName || "—"}</td>
                      <td style={{ fontSize:"12px", color:"var(--muted)", whiteSpace:"nowrap" }}>{timeAgo(log.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ padding:"14px 20px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"8px", justifyContent:"center" }}>
                <button className="btn-ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:"6px 14px", fontSize:"13px" }}>← Prev</button>
                <span style={{ fontSize:"13px", color:"var(--muted)" }}>Page {page} of {totalPages}</span>
                <button className="btn-ghost" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:"6px 14px", fontSize:"13px" }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default AuditLog;
