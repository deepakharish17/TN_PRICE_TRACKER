import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { getUserName, getUserEmail, isAdmin } from "../utils/auth";

const COMMODITY_ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = c => COMMODITY_ICONS[c] || "🌿";

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span>{type==="success"?"✅":"❌"}</span>
      <span style={{ flex:1, fontSize:"14px", color:"var(--text)" }}>{msg}</span>
      <span onClick={onClose} style={{ cursor:"pointer", color:"var(--muted)" }}>×</span>
    </div>
  );
}

function Profile() {
  const admin = isAdmin();
  const storedName  = getUserName();
  const storedEmail = getUserEmail();
  const [prices, setPrices]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [toast,   setToast]     = useState(null);
  const [tab, setTab]           = useState("overview"); // overview | security
  const [form, setForm]         = useState({ name: storedName || "", email: storedEmail || "" });
  const [pwForm, setPwForm]     = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError]   = useState("");

  const showToast = (msg, type="success") => setToast({ msg, type });

  useEffect(() => {
    api.get("/price/my").then(r => setPrices(r.data)).catch(()=>{}).finally(() => setLoading(false));
  }, []);

  const initials = storedName
    ? storedName.trim().split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()
    : "U";

  const accentColor = admin ? "#e11d48" : "#f59e0b";

  const approved = prices.filter(p=>p.status==="approved").length;
  const pending  = prices.filter(p=>p.status==="pending").length;
  const rejected = prices.filter(p=>p.status==="rejected").length;

  // Most submitted commodity
  const topCommodity = (() => {
    const counts = {};
    prices.forEach(p => counts[p.commodity] = (counts[p.commodity]||0)+1);
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    return top ? top[0] : null;
  })();

  const handleProfileSave = async () => {
    if (!form.name.trim()) return showToast("Name cannot be empty", "error");
    setSaving(true);
    try {
      await api.put("/auth/profile", { name: form.name });
      localStorage.setItem("userName", form.name);
      showToast("Profile updated successfully!");
    } catch { showToast("Failed to update profile", "error"); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwError("");
    if (!pwForm.current || !pwForm.newPw) return setPwError("All fields are required");
    if (pwForm.newPw.length < 6) return setPwError("New password must be at least 6 characters");
    if (pwForm.newPw !== pwForm.confirm) return setPwError("Passwords do not match");
    setSaving(true);
    try {
      await api.put("/auth/password", { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current:"", newPw:"", confirm:"" });
      showToast("Password changed successfully!");
    } catch (e) {
      setPwError(e.response?.data || "Failed to change password");
    } finally { setSaving(false); }
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding:"8px 20px", borderRadius:"8px", border:"none", cursor:"pointer",
      fontFamily:"'DM Sans',sans-serif", fontSize:"14px", fontWeight: tab===id ? "600" : "400",
      background: tab===id ? "var(--surface2)" : "transparent",
      color: tab===id ? "var(--text)" : "var(--muted)",
      transition:"all 0.15s",
    }}>{label}</button>
  );

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      <div style={{ marginBottom:"32px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"8px" }}>Account</p>
        <h1 style={{ fontSize:"36px", color:"var(--text)", marginBottom:"6px" }}>My Profile</h1>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>Manage your account and view your activity</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:"24px", alignItems:"start" }}>

        {/* Left: Avatar card */}
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div className="card fade-up fade-up-1" style={{ textAlign:"center", padding:"32px 24px" }}>
            <div style={{
              width:"80px", height:"80px", borderRadius:"50%", margin:"0 auto 16px",
              background:`linear-gradient(135deg,${accentColor},${accentColor}99)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"28px", fontWeight:"700", color:"#fff",
              boxShadow:`0 6px 20px ${accentColor}50`,
              fontFamily:"'DM Sans',sans-serif",
            }}>{initials}</div>
            <h2 style={{ fontSize:"22px", color:"var(--text)", marginBottom:"4px" }}>{storedName || "User"}</h2>
            <p style={{ fontSize:"13px", color:"var(--muted)", marginBottom:"12px" }}>{storedEmail}</p>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:"4px",
              fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"99px",
              background:`${accentColor}18`, color:accentColor,
              textTransform:"uppercase", letterSpacing:"0.06em",
            }}>
              {admin ? "🛡 Admin" : "👤 Contributor"}
            </span>
          </div>

          {/* Stats */}
          <div className="card fade-up fade-up-2" style={{ padding:"20px" }}>
            <p style={{ fontSize:"11px", fontWeight:"700", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"14px" }}>My Stats</p>
            {[
              { label:"Total Submissions", value: prices.length, color:"#6366f1" },
              { label:"Approved",          value: approved,      color:"#10b981" },
              { label:"Pending",           value: pending,       color:"#f59e0b" },
              { label:"Rejected",          value: rejected,      color:"#ef4444" },
            ].map(({label,value,color}) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:"13px", color:"var(--muted)" }}>{label}</span>
                <span style={{ fontSize:"16px", fontWeight:"700", color }}>{value}</span>
              </div>
            ))}
            {topCommodity && (
              <div style={{ marginTop:"12px", padding:"10px", background:"var(--surface2)", borderRadius:"10px", textAlign:"center" }}>
                <p style={{ fontSize:"11px", color:"var(--muted)", marginBottom:"4px" }}>Top Commodity</p>
                <p style={{ fontSize:"20px" }}>{getIcon(topCommodity)}</p>
                <p style={{ fontSize:"13px", color:"var(--text)", fontWeight:"600" }}>{topCommodity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="fade-up fade-up-2">
          <div style={{ display:"flex", gap:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }}>
            <TabBtn id="overview" label="Overview" />
            <TabBtn id="edit"     label="Edit Profile" />
            <TabBtn id="security" label="Security" />
          </div>

          {tab === "overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <div className="card">
                <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"16px" }}>Recent Submissions</h3>
                {loading ? <p style={{ color:"var(--muted)" }}>Loading…</p>
                : prices.length === 0 ? <p style={{ color:"var(--muted)", fontSize:"14px" }}>No submissions yet</p>
                : prices.slice(0,6).map(p => (
                  <div key={p._id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:"22px" }}>{getIcon(p.commodity)}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:"14px", fontWeight:"500", color:"var(--text)" }}>{p.commodity}</p>
                      <p style={{ fontSize:"12px", color:"var(--muted)" }}>{p.marketName} · {p.district}</p>
                    </div>
                    <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"18px", color:"var(--accent)" }}>₹{p.price}</p>
                    <span className={`status-badge status-${p.status}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "edit" && (
            <div className="card">
              <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"20px" }}>Edit Profile</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"16px", maxWidth:"420px" }}>
                <div>
                  <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Full Name</label>
                  <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name" />
                </div>
                <div>
                  <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Email address</label>
                  <input className="input" value={form.email} disabled style={{ opacity:0.5, cursor:"not-allowed" }} />
                  <p style={{ fontSize:"11px", color:"var(--muted)", marginTop:"4px" }}>Email cannot be changed</p>
                </div>
                <div>
                  <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Role</label>
                  <input className="input" value={admin ? "Administrator" : "Contributor"} disabled style={{ opacity:0.5, cursor:"not-allowed" }} />
                </div>
                <button className="btn" onClick={handleProfileSave} disabled={saving} style={{ width:"fit-content", padding:"12px 24px" }}>
                  {saving ? "Saving…" : "💾 Save Changes"}
                </button>
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="card">
              <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"4px" }}>Change Password</h3>
              <p style={{ fontSize:"13px", color:"var(--muted)", marginBottom:"20px" }}>Use a strong password with at least 6 characters</p>
              {pwError && (
                <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"10px", padding:"10px 14px", color:"#ef4444", fontSize:"13px", marginBottom:"16px" }}>{pwError}</div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:"14px", maxWidth:"420px" }}>
                <div>
                  <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Current Password</label>
                  <input type="password" className="input" value={pwForm.current} onChange={e=>setPwForm({...pwForm,current:e.target.value})} placeholder="••••••••" />
                </div>
                <div>
                  <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>New Password</label>
                  <input type="password" className="input" value={pwForm.newPw} onChange={e=>setPwForm({...pwForm,newPw:e.target.value})} placeholder="••••••••" />
                </div>
                <div>
                  <label style={{ fontSize:"13px", color:"var(--muted)", fontWeight:"500" }}>Confirm New Password</label>
                  <input type="password" className="input" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} placeholder="••••••••" />
                </div>
                <button className="btn" onClick={handlePasswordChange} disabled={saving} style={{ width:"fit-content", padding:"12px 24px" }}>
                  {saving ? "Updating…" : "🔒 Update Password"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
