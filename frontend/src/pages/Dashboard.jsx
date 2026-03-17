import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import { getUserName } from "../utils/auth";
import { useLang } from "../hooks/useLang";
import { COMMODITY_TAMIL, DISTRICT_TAMIL } from "../utils/lang";

const ICONS = {"Tomato":"🍅","Onion":"🧅","Potato":"🥔","Rice (Raw)":"🍚","Rice (Boiled)":"🍚","Wheat":"🌾","Tur Dal":"🫘","Chana Dal":"🫘","Moong Dal":"🫘","Groundnut Oil":"🫒","Coconut Oil":"🥥","Milk":"🥛","Eggs (dozen)":"🥚","Banana":"🍌","Brinjal":"🍆","Carrot":"🥕"};
const getIcon = n => ICONS[n] || "🌿";

function Dashboard() {
  const name = getUserName();
  const { t, lang } = useLang();
  const [myPrices, setMyPrices] = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/price/my").catch(()=>({data:[]})),
      api.get("/notifications").catch(()=>({data:[]})),
    ]).then(([p,n]) => {
      setMyPrices(p.data.slice(0,3));
      setUnread(n.data.filter(x=>!x.read).length);
    }).finally(()=>setLoading(false));
  },[]);

  const approved = myPrices.filter(p=>p.status==="approved").length;

  const cn = (c) => lang === "ta" ? (COMMODITY_TAMIL[c] || c) : c;
  const dn = (d) => lang === "ta" ? (DISTRICT_TAMIL[d]  || d) : d;
  const sn = (s) => s === "approved" ? t("approved") : s === "rejected" ? t("rejected") : t("pending");

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom:"24px" }} className="fade-up">
        <p style={{ color:"var(--accent)", fontSize:"12px", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>{t("overview")}</p>
        <h1 style={{ fontSize:"clamp(22px,6vw,36px)", color:"var(--text)", marginBottom:"4px" }}>
          {name ? `${lang==="ta"?"வணக்கம்":"Hello"}, ${name.split(" ")[0]} 👋` : t("dashboard")}
        </h1>
        <p style={{ color:"var(--muted)", fontSize:"14px" }}>{t("liveRates")}</p>
      </div>

      {/* My Stats */}
      {!loading && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"20px" }}>
          {[
            { labelKey:"submitted", value:myPrices.length, color:"#6366f1", icon:"📋", link:"/my" },
            { labelKey:"approved",  value:approved,        color:"#10b981", icon:"✓",  link:"/my" },
            { labelKey:"unread",    value:unread,          color:"#f59e0b", icon:"🔔", link:"/notifications" },
          ].map(({labelKey,value,color,icon,link},i) => (
            <Link key={labelKey} to={link} style={{ textDecoration:"none" }}>
              <div className={`card fade-up fade-up-${i+1}`} style={{ borderTop:`2px solid ${color}`, cursor:"pointer", padding:"12px 10px", textAlign:"center" }}>
                <div style={{ fontSize:"20px", width:"36px", height:"36px", background:`${color}18`, borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>{icon}</div>
                <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(24px,6vw,38px)", color:"var(--text)", lineHeight:1 }}>{value}</p>
                <p style={{ color:"var(--muted)", fontSize:"11px", marginTop:"4px" }}>{t(labelKey)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Platform stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"10px", marginBottom:"20px" }}>
        {[
          { labelKey:"commoditiesLabel", value:"12", delta:"+2 this week",  color:"#f59e0b", icon:"🌾" },
          { labelKey:"marketsLabel",     value:"25", delta:"+3 this month", color:"#10b981", icon:"🏪" },
          { labelKey:"updatesLabel",     value:"48", delta:"Today",         color:"#6366f1", icon:"📊" },
        ].map(({labelKey,value,delta,color,icon},i) => (
          <div key={labelKey} className={`card fade-up fade-up-${i+4}`} style={{ padding:"14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
              <span style={{ fontSize:"18px", width:"36px", height:"36px", background:`${color}18`, borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</span>
              <span style={{ fontSize:"10px", fontWeight:"600", color, background:`${color}18`, padding:"2px 7px", borderRadius:"99px", border:`1px solid ${color}30` }}>{delta}</span>
            </div>
            <p style={{ color:"var(--muted)", fontSize:"11px", marginBottom:"2px" }}>{t(labelKey)}</p>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(24px,5vw,36px)", color:"var(--text)", lineHeight:1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent submissions */}
      <div className="card fade-up" style={{ marginBottom:"16px", padding:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <h3 style={{ fontSize:"16px", color:"var(--text)" }}>{t("recentSubmissions")}</h3>
          <Link to="/my" style={{ fontSize:"12px", color:"var(--accent)", textDecoration:"none", fontWeight:"500" }}>{t("viewAll")}</Link>
        </div>
        {loading ? (
          <p style={{ color:"var(--muted)", fontSize:"14px", padding:"16px 0" }}>{t("loading")}</p>
        ) : myPrices.length===0 ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <p style={{ color:"var(--muted)", fontSize:"14px", marginBottom:"12px" }}>{t("noSubmissions")}</p>
            <Link to="/add"><button className="btn">{t("addFirst")}</button></Link>
          </div>
        ) : myPrices.map(item => {
          const sc = item.status==="approved"?"#10b981":item.status==="rejected"?"#ef4444":"#f59e0b";
          return (
            <div key={item._id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>{getIcon(item.commodity)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:"13px", fontWeight:"500", color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cn(item.commodity)}</p>
                <p style={{ fontSize:"11px", color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.marketName} · {dn(item.district)}</p>
              </div>
              <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--accent)", flexShrink:0 }}>₹{item.price}</p>
              <span style={{ fontSize:"10px", fontWeight:"600", padding:"2px 7px", borderRadius:"99px", background:`${sc}18`, color:sc, border:`1px solid ${sc}30`, textTransform:"capitalize", flexShrink:0 }}>{sn(item.status)}</span>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="card fade-up" style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.08),rgba(99,102,241,0.08))", border:"1px solid rgba(245,158,11,0.2)", padding:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
          <div>
            <h3 style={{ fontSize:"16px", color:"var(--text)", marginBottom:"3px" }}>{t("contributeToday")}</h3>
            <p style={{ fontSize:"12px", color:"var(--muted)" }}>{t("helpFarmers")}</p>
          </div>
          <Link to="/add"><button className="btn">{t("addPriceBtn")}</button></Link>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
