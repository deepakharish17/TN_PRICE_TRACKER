import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { getUserName, getUserEmail, isAdmin } from "../utils/auth";

const COMMODITY_ICONS = {
  "Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚",
  "Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘",
  "Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚",
  "Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"
};

const getIcon = c => COMMODITY_ICONS[c] || "🌿";

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{type==="success"?"✅":"❌"}</span>
      <span style={{flex:1,fontSize:"14px",color:"var(--text)"}}>{msg}</span>
      <span onClick={onClose} style={{cursor:"pointer",color:"var(--muted)"}}>×</span>
    </div>
  );
}

function Profile() {

  const admin = isAdmin();
  const storedName  = getUserName();
  const storedEmail = getUserEmail();

  const [prices,setPrices] = useState([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [toast,setToast] = useState(null);
  const [tab,setTab] = useState("overview");

  const [form,setForm] = useState({
    name:storedName || "",
    email:storedEmail || ""
  });

  const [pwForm,setPwForm] = useState({
    current:"",
    newPw:"",
    confirm:""
  });

  const [pwError,setPwError] = useState("");

  const showToast = (msg,type="success") => setToast({msg,type});

  useEffect(()=>{
    api.get("/price/my")
      .then(r=>setPrices(r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const initials = storedName
    ? storedName.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()
    : "U";

  const accentColor = admin ? "#e11d48" : "#f59e0b";

  const approved = prices.filter(p=>p.status==="approved").length;
  const pending  = prices.filter(p=>p.status==="pending").length;
  const rejected = prices.filter(p=>p.status==="rejected").length;

  const topCommodity = (() => {
    const counts={};
    prices.forEach(p=>counts[p.commodity]=(counts[p.commodity]||0)+1);
    const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    return top?top[0]:null;
  })();

  const handleProfileSave = async () => {

    if(!form.name.trim())
      return showToast("Name cannot be empty","error");

    setSaving(true);

    try{
      await api.put("/auth/profile",{name:form.name});
      localStorage.setItem("userName",form.name);
      showToast("Profile updated successfully!");
    }
    catch{
      showToast("Failed to update profile","error");
    }
    finally{
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {

    setPwError("");

    if(!pwForm.current || !pwForm.newPw)
      return setPwError("All fields are required");

    if(pwForm.newPw.length < 6)
      return setPwError("Password must be at least 6 characters");

    if(pwForm.newPw !== pwForm.confirm)
      return setPwError("Passwords do not match");

    setSaving(true);

    try{
      await api.put("/auth/password",{
        currentPassword:pwForm.current,
        newPassword:pwForm.newPw
      });

      setPwForm({current:"",newPw:"",confirm:""});
      showToast("Password updated successfully");
    }
    catch(e){
      setPwError(e.response?.data || "Failed to change password");
    }
    finally{
      setSaving(false);
    }
  };

  const TabBtn = ({id,label}) => (
    <button
      onClick={()=>setTab(id)}
      style={{
        padding:"8px 18px",
        borderRadius:"8px",
        border:"none",
        cursor:"pointer",
        background:tab===id?"var(--surface2)":"transparent",
        color:tab===id?"var(--text)":"var(--muted)",
        fontWeight:tab===id?"600":"400"
      }}
    >
      {label}
    </button>
  );

  return (

    <Layout>

      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}

      {/* Header */}

      <div style={{marginBottom:"32px"}}>
        <p style={{color:"var(--accent)",fontSize:"12px",fontWeight:"600"}}>Account</p>
        <h1 style={{fontSize:"32px"}}>My Profile</h1>
        <p style={{color:"var(--muted)"}}>Manage your account</p>
      </div>

      {/* Responsive grid */}

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",
          gap:"24px"
        }}
      >

        {/* LEFT CARD */}

        <div className="card" style={{textAlign:"center"}}>

          <div
            style={{
              width:"80px",
              height:"80px",
              borderRadius:"50%",
              margin:"0 auto 16px",
              background:`linear-gradient(135deg,${accentColor},${accentColor}99)`,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              fontSize:"28px",
              color:"#fff",
              fontWeight:"700"
            }}
          >
            {initials}
          </div>

          <h2>{storedName}</h2>
          <p style={{color:"var(--muted)"}}>{storedEmail}</p>

          <span
            style={{
              marginTop:"10px",
              display:"inline-block",
              padding:"4px 12px",
              borderRadius:"20px",
              background:`${accentColor}20`,
              color:accentColor,
              fontSize:"12px",
              fontWeight:"600"
            }}
          >
            {admin?"Admin":"Contributor"}
          </span>

        </div>

        {/* RIGHT PANEL */}

        <div>

          {/* Tabs */}

          <div
            style={{
              display:"flex",
              gap:"6px",
              marginBottom:"20px",
              flexWrap:"wrap"
            }}
          >
            <TabBtn id="overview" label="Overview"/>
            <TabBtn id="edit" label="Edit Profile"/>
            <TabBtn id="security" label="Security"/>
          </div>

          {tab==="overview" && (

            <div className="card">

              <h3 style={{marginBottom:"16px"}}>Recent Submissions</h3>

              {loading
                ? <p style={{color:"var(--muted)"}}>Loading...</p>
                : prices.length===0
                  ? <p style={{color:"var(--muted)"}}>No submissions</p>
                  : prices.slice(0,6).map(p=>(
                    <div
                      key={p._id}
                      style={{
                        display:"flex",
                        alignItems:"center",
                        gap:"12px",
                        padding:"10px 0",
                        borderBottom:"1px solid var(--border)"
                      }}
                    >
                      <span style={{fontSize:"22px"}}>{getIcon(p.commodity)}</span>

                      <div style={{flex:1}}>
                        <p>{p.commodity}</p>
                        <p style={{fontSize:"12px",color:"var(--muted)"}}>
                          {p.marketName} • {p.district}
                        </p>
                      </div>

                      <b style={{color:"var(--accent)"}}>₹{p.price}</b>

                    </div>
                  ))
              }

            </div>
          )}

          {tab==="edit" && (

            <div className="card">

              <h3 style={{marginBottom:"16px"}}>Edit Profile</h3>

              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

                <input
                  className="input"
                  value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})}
                />

                <input
                  className="input"
                  value={form.email}
                  disabled
                />

                <button
                  className="btn"
                  onClick={handleProfileSave}
                  disabled={saving}
                >
                  {saving?"Saving...":"Save"}
                </button>

              </div>

            </div>
          )}

          {tab==="security" && (

            <div className="card">

              <h3>Change Password</h3>

              {pwError && (
                <p style={{color:"red",fontSize:"13px"}}>{pwError}</p>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

                <input
                  type="password"
                  className="input"
                  placeholder="Current password"
                  value={pwForm.current}
                  onChange={e=>setPwForm({...pwForm,current:e.target.value})}
                />

                <input
                  type="password"
                  className="input"
                  placeholder="New password"
                  value={pwForm.newPw}
                  onChange={e=>setPwForm({...pwForm,newPw:e.target.value})}
                />

                <input
                  type="password"
                  className="input"
                  placeholder="Confirm password"
                  value={pwForm.confirm}
                  onChange={e=>setPwForm({...pwForm,confirm:e.target.value})}
                />

                <button
                  className="btn"
                  onClick={handlePasswordChange}
                  disabled={saving}
                >
                  {saving?"Updating...":"Update Password"}
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