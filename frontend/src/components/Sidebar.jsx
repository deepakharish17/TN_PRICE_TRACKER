import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAdmin, logout, getUserName, getUserEmail } from "../utils/auth";
import { getColorMode, toggleColorMode, applyColorMode } from "../utils/theme";

const userNav = [
  { section: "EXPLORE" },
  { to: "/dashboard",     label: "Dashboard",        icon: "▦" },
  { to: "/markets",       label: "Market Prices",    icon: "🏪" },
  { to: "/analytics",     label: "Analytics",        icon: "📊" },
  { to: "/history",       label: "Price History",    icon: "📦" },
  { to: "/compare",       label: "Compare Districts",icon: "⚖️" },
  { to: "/weather",       label: "Weather & Prices", icon: "🌦️" },
  { section: "COMMUNITY" },
  { to: "/leaderboard",   label: "Leaderboard",      icon: "🏆" },
  { to: "/announcements", label: "Announcements",    icon: "📰" },
  { section: "MY ACCOUNT" },
  { to: "/add",           label: "Add Price",        icon: "＋" },
  { to: "/my",            label: "My Submissions",   icon: "◈" },
  { to: "/bookmarks",     label: "Bookmarks",        icon: "⭐" },
  { to: "/notifications", label: "Notifications",    icon: "◎" },
  { to: "/profile",       label: "Profile",          icon: "👤" },
];

const adminNav = [
  { section: "OVERVIEW" },
  { to: "/admin",           label: "Dashboard",        icon: "▦" },
  { to: "/markets",         label: "Market Prices",    icon: "🏪" },
  { to: "/analytics",       label: "Analytics",        icon: "📊" },
  { to: "/admin/heatmap",   label: "Activity Heatmap", icon: "🔥" },
  { section: "MODERATION" },
  { to: "/admin/pending",   label: "Pending Review",   icon: "◷" },
  { to: "/admin/audit",     label: "Audit Log",        icon: "📋" },
  { section: "PLATFORM" },
  { to: "/add",             label: "Add Price",        icon: "＋" },
  { to: "/compare",         label: "Compare",          icon: "⚖️" },
  { to: "/weather",         label: "Weather",          icon: "🌦️" },
  { to: "/leaderboard",     label: "Leaderboard",      icon: "🏆" },
  { to: "/announcements",   label: "Announcements",    icon: "📰" },
  { section: "ADMIN TOOLS" },
  { to: "/admin/manage",    label: "Manage Data",      icon: "⚙" },
  { to: "/admin/users",     label: "Manage Users",     icon: "👥" },
  { to: "/admin/export",    label: "Export CSV",       icon: "📤" },
  { section: "ACCOUNT" },
  { to: "/notifications",   label: "Notifications",    icon: "◎" },
  { to: "/profile",         label: "Profile",          icon: "👤" },
];

// Bottom nav shows 5 key items only
const userBottomNav = [
  { to: "/dashboard",     icon: "▦",  label: "Home" },
  { to: "/markets",       icon: "🏪", label: "Prices" },
  { to: "/add",           icon: "＋", label: "Add" },
  { to: "/notifications", icon: "◎",  label: "Alerts" },
  { to: "/profile",       icon: "👤", label: "Me" },
];
const adminBottomNav = [
  { to: "/admin",         icon: "▦",  label: "Home" },
  { to: "/admin/pending", icon: "◷",  label: "Review" },
  { to: "/markets",       icon: "🏪", label: "Prices" },
  { to: "/admin/users",   icon: "👥", label: "Users" },
  { to: "/profile",       icon: "👤", label: "Me" },
];

function NavItem({ to, label, icon, section, onClose }) {
  const loc = useLocation();
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
      <span style={{ flex:1 }}>{label}</span>
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
      {/* ── Desktop + Mobile Drawer Sidebar ── */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:`linear-gradient(135deg,${accentColor},${accentColor}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>₹</div>
            <div>
              <p style={{ fontWeight:"700", color:"var(--text)", fontSize:"14px" }}>TN Price Monitor</p>
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
              {admin?"Admin":"User"}
            </span>
          </div>
        </div>

        {/* Nav items + footer — all in one scrollable area */}
        <div style={{ flex:1, padding:"8px", overflowY:"auto", paddingBottom:"80px" }}>
          <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"0.1em", color:"var(--muted)", padding:"8px 12px 4px", textTransform:"uppercase", opacity:0.5 }}>
            {admin ? "ADMIN MENU" : "MENU"}
          </p>
          {nav.map((item, i) => (
            <NavItem key={i} {...item} onClose={onClose} />
          ))}
        {/* Footer — inside scroll so it's always reachable */}
        <div style={{ padding:"12px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"8px", marginTop:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingLeft:"8px" }}>
            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#10b981", boxShadow:"0 0 6px #10b981", animation:"pulse-dot 2s ease infinite", display:"inline-block" }} />
            <span style={{ fontSize:"11px", color:"var(--muted)" }}>Live feed active</span>
          </div>

          {/* Dark/Light toggle */}
          <button onClick={handleToggleTheme} style={{
            display:"flex", alignItems:"center", gap:"9px", width:"100%",
            padding:"9px 12px", background:"var(--surface2)", border:"1px solid var(--border)",
            borderRadius:"10px", color:"var(--muted)", fontSize:"13px", cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", justifyContent:"space-between",
          }}>
            <span style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span>{colorMode==="dark"?"🌙":"☀️"}</span>
              <span>{colorMode==="dark"?"Dark mode":"Light mode"}</span>
            </span>
            <span style={{ width:"36px", height:"20px", borderRadius:"99px", background:colorMode==="dark"?"var(--border)":accentColor, position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <span style={{ position:"absolute", top:"3px", left:colorMode==="dark"?"3px":"19px", width:"14px", height:"14px", borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
            </span>
          </button>

          <button onClick={() => { logout(navigate); onClose && onClose(); }} style={{
            display:"flex", alignItems:"center", gap:"9px", width:"100%",
            padding:"9px 12px", background:"transparent", border:"1px solid var(--border)",
            borderRadius:"10px", color:"var(--muted)", fontSize:"13px", cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",
          }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.08)";e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="rgba(239,68,68,0.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="var(--border)";}}
          ><span>⎋</span> Sign out</button>
        </div>
        </div>
      </div>

      {/* ── Bottom Navigation Bar (mobile only) ── */}
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
              <span style={{ fontSize:"9px", fontWeight: active?"700":"400", letterSpacing:"0.02em" }}>{item.label}</span>
              {active && <span style={{ width:"4px", height:"4px", borderRadius:"50%", background:"var(--accent)", marginTop:"1px" }} />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Sidebar;
