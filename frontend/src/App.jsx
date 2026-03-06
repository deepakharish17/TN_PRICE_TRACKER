import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { applyTheme } from "./utils/auth";
import { applyColorMode, getColorMode } from "./utils/theme";

import Login           from "./pages/Login";
import Register        from "./pages/Register";
import Dashboard       from "./pages/Dashboard";
import MarketPrices    from "./pages/MarketPrices";
import Compare         from "./pages/Compare";
import Analytics       from "./pages/Analytics";
import AddPrice        from "./pages/AddPrice";
import MySubmissions   from "./pages/MySubmissions";
import Bookmarks       from "./pages/Bookmarks";
import Notifications   from "./pages/Notifications";
import Profile         from "./pages/Profile";
import Leaderboard     from "./pages/Leaderboard";
import Announcements   from "./pages/Announcements";
import PriceHistory    from "./pages/PriceHistory";
import WeatherPrices   from "./pages/WeatherPrices";
import AdminDashboard  from "./pages/AdminDashboard";
import PendingReview   from "./pages/PendingReview";
import AdminManage     from "./pages/AdminManage";
import AdminUsers      from "./pages/AdminUsers";
import Export          from "./pages/Export";
import AuditLog        from "./pages/AuditLog";
import ActivityHeatmap from "./pages/ActivityHeatmap";

function App() {
  useEffect(() => {
    applyTheme();
    applyColorMode(getColorMode());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Shared (user + admin) */}
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/markets"       element={<ProtectedRoute><MarketPrices /></ProtectedRoute>} />
        <Route path="/compare"       element={<ProtectedRoute><Compare /></ProtectedRoute>} />
        <Route path="/analytics"     element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/history"       element={<ProtectedRoute><PriceHistory /></ProtectedRoute>} />
        <Route path="/weather"       element={<ProtectedRoute><WeatherPrices /></ProtectedRoute>} />
        <Route path="/leaderboard"   element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/add"           element={<ProtectedRoute><AddPrice /></ProtectedRoute>} />
        <Route path="/my"            element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
        <Route path="/bookmarks"     element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Admin only */}
        <Route path="/admin"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/pending"   element={<AdminRoute><PendingReview /></AdminRoute>} />
        <Route path="/admin/manage"    element={<AdminRoute><AdminManage /></AdminRoute>} />
        <Route path="/admin/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/export"    element={<AdminRoute><Export /></AdminRoute>} />
        <Route path="/admin/audit"     element={<AdminRoute><AuditLog /></AdminRoute>} />
        <Route path="/admin/heatmap"   element={<AdminRoute><ActivityHeatmap /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
