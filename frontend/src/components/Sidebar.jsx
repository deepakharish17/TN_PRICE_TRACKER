import { useState, useEffect } from "react";
import { getColorMode, toggleColorMode, applyColorMode } from "../utils/theme";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAdmin, logout, getUserName, getUserEmail } from "../utils/auth";

// ── Nav groups (label is a section header, items are links) ──
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
  { to: "/admin",           label: "Dashboard",       icon: "▦" },
  { to: "/markets",         label: "Market Prices",   icon: "🏪" },
  { to: "/analytics",       label: "Analytics",       icon: "📊" },
  { to: "/admin/heatmap",   label: "Activity Heatmap",icon: "🔥" },
  { section: "MODERATION" },
  { to: "/admin/pending",   label: "Pending Review",  icon: "◷" },
  { to: "/admin/audit",     label: "Audit Log",       icon: "📋" },
  { section: "PLATFORM" },
  { to: "/add",             label: "Add Price",       icon: "＋" },
  { to: "/compare",         label: "Compare",         icon: "⚖️" },
  { to: "/weather",         label: "Weather",         icon: "🌦️" },
  { to: "/leaderboard",     label: "Leaderboard",     icon: "🏆" },
  { to: "/announcements",   label: "Announcements",   icon: "📰" },
  { section: "ADMIN TOOLS" },
  { to: "/admin/manage",    label: "Manage Data",     icon: "⚙" },
  { to: "/admin/users",     label: "Manage Users",    icon: "👥" },
  { to: "/admin/export",    label: "Export CSV",      icon: "📤" },
  { section: "ACCOUNT" },
  { to: "/notifications",   label: "Notifications",   icon: "◎" },
  { to: "/profile",         label: "Profile",         icon: "👤" },
];

function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const admin = isAdmin();
  const [colorMode, setColorModeState] = useState(getColorMode());
  useEffect(() => { applyColorMode(colorMode); }, []);
  const handleToggleTheme = () => {
    const next = toggleColorMode();
    setColorModeState(next);
  };
  const name  = getUserName();
  const email = getUserEmail();
  const initials = name ? name.trim().split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() : (admin ? "AD" : "U");
  const accentColor = admin ? "#e11d48" : "#f59e0b";

  const NavItem = ({ to, label, icon }) => {
    const active = pathname === to;
    return (
      <Link to={to} style={{
        display:"flex", alignItems:"center", gap:"11px",
        padding:"9px 12px", borderRadius:"10px", textDecoration:"none",
        fontSize:"13.5px", fontWeight: active ? "600" : "400",
        color: active ? (admin ? "#fff" : "#0a0e1a") : "var(--muted)",
        background: active ? accentColor : "transparent",
        transition:"all 0.15s",
        boxShadow: active ? `0 2px 12px ${accentColor}40` : "none",
      }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background="var(--surface2)"; e.currentTarget.style.color="var(--text)"; }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--muted)"; }}}
      >
        <span style={{ fontSize:"15px", minWidth:"20px", textAlign:"center" }}>{icon}</span>
        <span style={{ flex:1 }}>{label}</span>
        {active && <span style={{ width:"6px", height:"6px", borderRadius:"50%", background: admin?"#fff":"#0a0e1a" }} />}
      </Link>
    );
  };

  return (
    <div style={{
      width:"var(--sidebar-w)", height:"100vh",
      background:"var(--sidebar-bg,var(--surface))",
      borderRight:"1px solid var(--border)",
      padding:"20px 14px", position:"fixed", top:0, left:0,
      display:"flex", flexDirection:"column", zIndex:100,
      boxShadow:"2px 0 20px rgba(0,0,0,0.3)", overflowY:"auto",
    }}>
      {/* Brand */}
      <div style={{ marginBottom:"20px", paddingLeft:"6px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"2px" }}>
          <div style={{ width:"32px", height:"32px", background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`, borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", fontWeight:"bold", color:"#fff", boxShadow:`0 3px 10px ${accentColor}50`, flexShrink:0 }}>₹</div>
          <div>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"14px", color:"var(--text)", lineHeight:1.2 }}>TN Price Monitor</p>
            <p style={{ fontSize:"10px", color:"var(--muted)" }}>Tamil Nadu · Live Rates</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"12px", marginBottom:"18px", background:"var(--surface2)", border:`1px solid ${accentColor}30` }}>
        <div style={{ width:"38px", height:"38px", borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${accentColor},${accentColor}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"700", color:"#fff", boxShadow:`0 3px 10px ${accentColor}50` }}>{initials}</div>
        <div style={{ flex:1, overflow:"hidden" }}>
          <p style={{ fontSize:"13px", fontWeight:"600", color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", lineHeight:1.3 }}>
            {name || email || (admin ? "Administrator" : "User")}
          </p>
          {email && name && <p style={{ fontSize:"11px", color:"var(--muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{email}</p>}
          <span style={{ display:"inline-flex", alignItems:"center", gap:"3px", fontSize:"10px", fontWeight:"700", marginTop:"2px", padding:"1px 7px", borderRadius:"99px", background:`${accentColor}20`, color:accentColor, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            {admin ? "🛡 Admin" : "👤 User"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:"2px" }}>
        <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"0.1em", color:"var(--muted)", textTransform:"uppercase", padding:"0 10px", marginBottom:"5px" }}>
          {admin ? "Admin Menu" : "Menu"}
        </p>
        {(admin ? adminNav : userNav).map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* Footer */}
      <div style={{ borderTop:"1px solid var(--border)", paddingTop:"12px", marginTop:"10px", display:"flex", flexDirection:"column", gap:"7px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingLeft:"8px" }}>
          <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#10b981", boxShadow:"0 0 6px #10b981", animation:"pulse-dot 2s ease infinite", display:"inline-block" }} />
          <span style={{ fontSize:"11px", color:"var(--muted)" }}>Live feed active</span>
        </div>
        {/* Dark/Light toggle */}
        <button onClick={handleToggleTheme} style={{
          display:"flex", alignItems:"center", gap:"9px", width:"100%",
          padding:"9px 12px", background:"var(--surface2)", border:"1px solid var(--border)",
          borderRadius:"10px", color:"var(--muted)", fontSize:"13px", cursor:"pointer",
          transition:"all 0.15s", fontFamily:"'DM Sans',sans-serif", justifyContent:"space-between",
        }}>
          <span style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span>{colorMode === "dark" ? "🌙" : "☀️"}</span>
            <span>{colorMode === "dark" ? "Dark mode" : "Light mode"}</span>
          </span>
          <span style={{
            width:"36px", height:"20px", borderRadius:"99px",
            background: colorMode === "dark" ? "var(--border)" : accentColor,
            position:"relative", transition:"background 0.2s", flexShrink:0,
          }}>
            <span style={{
              position:"absolute", top:"3px",
              left: colorMode === "dark" ? "3px" : "19px",
              width:"14px", height:"14px", borderRadius:"50%",
              background:"#fff", transition:"left 0.2s",
            }} />
          </span>
        </button>
        <button onClick={() => logout(navigate)} style={{
          display:"flex", alignItems:"center", gap:"9px", width:"100%",
          padding:"9px 12px", background:"transparent", border:"1px solid var(--border)",
          borderRadius:"10px", color:"var(--muted)", fontSize:"13px", cursor:"pointer",
          transition:"all 0.15s", fontFamily:"'DM Sans',sans-serif",
        }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.08)"; e.currentTarget.style.color="#ef4444"; e.currentTarget.style.borderColor="rgba(239,68,68,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--muted)"; e.currentTarget.style.borderColor="var(--border)"; }}
        ><span>⎋</span> Sign out</button>
      </div>
    </div>
  );
}

export default Sidebar;
