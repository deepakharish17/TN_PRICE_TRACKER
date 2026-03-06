import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { applyTheme, isAdmin } from "../utils/auth";

function Layout({ children }) {
  useEffect(() => { applyTheme(); }, []);

  const admin = isAdmin();

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{
        marginLeft: "var(--sidebar-w)",
        padding: "48px 40px",
        width: "100%",
        minHeight: "100vh",
        background: "var(--bg)",
        backgroundImage: admin
          ? "radial-gradient(ellipse 50% 40% at 80% 10%, rgba(225,29,72,0.04) 0%, transparent 60%)"
          : "radial-gradient(ellipse 50% 40% at 80% 10%, rgba(245,158,11,0.04) 0%, transparent 60%)",
      }}>
        {children}
      </div>
    </div>
  );
}

export default Layout;
