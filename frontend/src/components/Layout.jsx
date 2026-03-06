  // Close sidebar on route change (click a link)
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { applyTheme, isAdmin } from "../utils/auth";
import { applyColorMode, getColorMode } from "../utils/theme";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const admin = isAdmin();

  useEffect(() => {
    applyTheme();
    applyColorMode(getColorMode());
  }, []);

  // Close sidebar on route change (click a link)
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div>
      {/* Hamburger button — mobile only */}
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Menu"
      >
        <span style={{ transform: sidebarOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
        <span style={{ opacity: sidebarOpen ? 0 : 1 }} />
        <span style={{ transform: sidebarOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
      </button>

      {/* Overlay behind drawer on mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main content */}
      <div
        className="page-content"
        style={{
          backgroundImage: admin
            ? "radial-gradient(ellipse 50% 40% at 80% 10%, rgba(225,29,72,0.04) 0%, transparent 60%)"
            : "radial-gradient(ellipse 50% 40% at 80% 10%, rgba(245,158,11,0.04) 0%, transparent 60%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Layout;
