import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAdmin, logout, getUserName, getUserEmail } from "../utils/auth";
import { getColorMode, toggleColorMode, applyColorMode } from "../utils/theme";
import { useLang } from "../hooks/useLang";

const userNav = [
  { section: "EXPLORE" },
  { to: "/dashboard",     labelKey: "dashboard",      icon: "▦" },
  { to: "/markets",       labelKey: "marketPrices",   icon: "🏪" },
  { to: "/analytics",     labelKey: "analytics",      icon: "📊" },
  { to: "/history",       labelKey: "priceHistory",   icon: "📦" },
  { to: "/compare",       labelKey: "compare",        icon: "⚖️" },
  { to: "/weather",       labelKey: "weather",        icon: "🌦️" },
  { section: "COMMUNITY" },
  { to: "/leaderboard",   labelKey: "leaderboard",    icon: "🏆" },
  { to: "/announcements", labelKey: "announcements",  icon: "📰" },
  { section: "MY ACCOUNT" },
  { to: "/add",           labelKey: "addPrice",       icon: "＋" },
  { to: "/my",            labelKey: "mySubmissions",  icon: "◈" },
  { to: "/bookmarks",     labelKey: "bookmarks",      icon: "⭐" },
  { to: "/notifications", labelKey: "notifications",  icon: "◎" },
  { to: "/profile",       labelKey: "profile",        icon: "👤" },
];

const adminNav = [
  { section: "OVERVIEW" },
  { to: "/admin",           labelKey: "adminDashboard",  icon: "▦" },
  { to: "/markets",         labelKey: "marketPrices",    icon: "🏪" },
  { to: "/analytics",       labelKey: "analytics",       icon: "📊" },
  { to: "/admin/heatmap",   labelKey: "activityHeatmap", icon: "🔥" },
  { section: "MODERATION" },
  { to: "/admin/pending",   labelKey: "pendingReview",   icon: "◷" },
  { to: "/admin/audit",     labelKey: "auditLog",        icon: "📋" },
  { section: "PLATFORM" },
  { to: "/add",             labelKey: "addPrice",        icon: "＋" },
  { to: "/compare",         labelKey: "compare",         icon: "⚖️" },
  { to: "/weather",         labelKey: "weather",         icon: "🌦️" },
  { to: "/leaderboard",     labelKey: "leaderboard",     icon: "🏆" },
  { to: "/announcements",   labelKey: "announcements",   icon: "📰" },
  { section: "ADMIN TOOLS" },
  { to: "/admin/manage",    labelKey: "settings",        icon: "⚙" },
  { to: "/admin/users",     labelKey: "manageUsers",     icon: "👥" },
  { to: "/admin/export",    labelKey: "export",          icon: "📤" },
  { section: "ACCOUNT" },
  { to: "/notifications",   labelKey: "notifications",   icon: "◎" },
  { to: "/profile",         labelKey: "profile",         icon: "👤" },
];

const userBottomNav = [
  { to: "/dashboard",     icon: "▦",  labelKey: "dashboard" },
  { to: "/markets",       icon: "🏪", labelKey: "marketPrices" },
  { to: "/add",           icon: "＋", labelKey: "addPrice" },
  { to: "/notifications", icon: "◎",  labelKey: "notifications" },
  { to: "/profile",       icon: "👤", labelKey: "profile" },
];
const adminBottomNav = [
  { to: "/admin",         icon: "▦",  labelKey: "adminDashboard" },
  { to: "/admin/pending", icon: "◷",  labelKey: "pendingReview" },
  { to: "/markets",       icon: "🏪", labelKey: "marketPrices" },
  { to: "/admin/users",   icon: "👥", labelKey: "manageUsers" },
  { to: "/profile",       icon: "👤", labelKey: "profile" },
];

function NavItem({ to, labelKey, icon, section, onClose }) {
  const loc = useLocation();
  const { t } = useLang();
  if (section) {
    return (
      <p style={{ fontSize:"9px", fontWeight:"700", letterSpacing:"0.12em", color:"var(--muted)", padding:"14px 12px 4px", textTransform:"uppercase", opacity:0.6 }}>
        {section}
      </p>
    );
  }
  const active = loc.pathname === to;
  return (
    <Link to={to} onClick={onClose} style={{
      display:"flex", alignItems:"center", gap:"10px",
      padding:"8px 12px", borderRadius:"9px", textDecoration:"none",
      background: active ? "var(--sidebar-accent)" : "transparent",
      color: active ? "#fff" : "var(--muted)",
      fontSize:"13px", fontWeight: active ? "600" : "400",
      transition:"all 0.15s",
    }}
      onMouseEnter={e=>{ if(!active){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="var(--text)";} }}
      onMouseLeave={e=>{ if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";} }}
    >
      <span style={{ fontSize:"13px", width:"18px", textAlign:"center" }}>{icon}</span>
      <span style={{ flex:1 }}>{t(labelKey)}</span>
      {active && <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#fff" }} />}
    </Link>
  );
}

function Sidebar({ isOpen, onClose }) {
  const admin = isAdmin();
  const name  = getUserName();
  const email = getUserEmail();
  const navigate = useNavigate();
  const loc = useLocation();
  const { lang, toggleLang, t } = useLang();

  const [colorMode, setColorModeState] = useState(getColorMode());
  useEffect(() => { applyColorMode(colorMode); }, []);

  const handleToggleTheme = () => {
    const next = toggleColorMode();
    setColorModeState(next);
  };

  const initials = name ? name.trim().split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() : (admin ? "AD" : "U");
  const accentColor = admin ? "#e11d48" : "#f59e0b";
  const nav = admin ? adminNav : userNav;
  const bottomNav = admin ? adminBottomNav : userBottomNav;

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:`linear-gradient(135deg,${accentColor},${accentColor}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>₹</div>
            <div>
              <p style={{ fontWeight:"700", color:"var(--text)", fontSize:"14px" }}>{t("appName") || "TN Price Monitor"}</p>
              <p style={{ fontSize:"11px", color:"var(--muted)" }}>Tamil Nadu · Live Rates</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div style={{ padding:"12px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 8px", borderRadius:"12px", background:"var(--surface2)", border:"1px solid var(--border)" }}>
            <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:`linear-gradient(135deg,${accentColor},${accentColor}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"700", color:"#fff", flexShrink:0 }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:"600", color:"var(--text)", fontSize:"13px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name || "User"}</p>
              <p style={{ fontSize:"11px", color:"var(--muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{email}</p>
            </div>
            <span style={{ fontSize:"9px", fontWeight:"700", padding:"2px 7px", borderRadius:"99px", background:`${accentColor}18`, color:accentColor, textTransform:"uppercase", flexShrink:0, letterSpacing:"0.06em" }}>
              {admin ? "Admin" : "User"}
            </span>
          </div>
        </div>

        {/* Nav + Footer */}
        <div style={{ flex:1, padding:"8px", overflowY:"auto", paddingBottom:"80px" }}>
          <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"0.1em", color:"var(--muted)", padding:"8px 12px 4px", textTransform:"uppercase", opacity:0.5 }}>
            {admin ? t("adminMenu") : t("menu")}
          </p>
          {nav.map((item, i) => (
            <NavItem key={i} {...item} onClose={onClose} />
          ))}

          {/* Footer */}
          <div style={{ padding:"12px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"8px", marginTop:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingLeft:"8px" }}>
              <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#10b981", boxShadow:"0 0 6px #10b981", animation:"pulse-dot 2s ease infinite", display:"inline-block" }} />
              <span style={{ fontSize:"11px", color:"var(--muted)" }}>{t("liveActive")}</span>
            </div>

            {/* Language toggle */}
            <button onClick={toggleLang} style={{
              display:"flex", alignItems:"center", gap:"9px", width:"100%",
              padding:"9px 12px", background:"var(--surface2)", border:"1px solid var(--border)",
              borderRadius:"10px", color:"var(--muted)", fontSize:"13px", cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", justifyContent:"space-between",
            }}>
              <span style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <span>🌐</span>
                <span>{lang === "en" ? "தமிழ்" : "English"}</span>
              </span>
              <span style={{ fontSize:"10px", fontWeight:"700", padding:"2px 8px", borderRadius:"99px", background:"var(--border)", color:"var(--muted)" }}>
                {lang === "en" ? "EN" : "TA"}
              </span>
            </button>

            {/* Dark/Light toggle */}
            <button onClick={handleToggleTheme} style={{
              display:"flex", alignItems:"center", gap:"9px", width:"100%",
              padding:"9px 12px", background:"var(--surface2)", border:"1px solid var(--border)",
              borderRadius:"10px", color:"var(--muted)", fontSize:"13px", cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", justifyContent:"space-between",
            }}>
              <span style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <span>{colorMode==="dark"?"🌙":"☀️"}</span>
                <span>{colorMode==="dark" ? t("darkMode") : t("lightMode")}</span>
              </span>
              <span style={{ width:"36px", height:"20px", borderRadius:"99px", background:colorMode==="dark"?"var(--border)":accentColor, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                <span style={{ position:"absolute", top:"3px", left:colorMode==="dark"?"3px":"19px", width:"14px", height:"14px", borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
              </span>
            </button>

            {/* Logout */}
            <button onClick={() => { logout(navigate); onClose && onClose(); }} style={{
              display:"flex", alignItems:"center", gap:"9px", width:"100%",
              padding:"9px 12px", background:"transparent", border:"1px solid var(--border)",
              borderRadius:"10px", color:"var(--muted)", fontSize:"13px", cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",
            }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.08)";e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="rgba(239,68,68,0.3)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="var(--border)";}}
            ><span>⎋</span> {t("logout")}</button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {bottomNav.map(item => {
          const active = loc.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:"2px",
              textDecoration:"none", flex:1, padding:"8px 4px",
              color: active ? "var(--accent)" : "var(--muted)",
              transition:"color 0.15s",
            }}>
              <span style={{ fontSize:"18px", lineHeight:1 }}>{item.icon}</span>
              <span style={{ fontSize:"9px", fontWeight: active?"700":"400", letterSpacing:"0.02em" }}>{t(item.labelKey)}</span>
              {active && <span style={{ width:"4px", height:"4px", borderRadius:"50%", background:"var(--accent)", marginTop:"1px" }} />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Sidebar;
