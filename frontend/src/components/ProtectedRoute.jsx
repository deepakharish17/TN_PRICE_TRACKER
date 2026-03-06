import { Navigate } from "react-router-dom";
import { isLoggedIn, isAdmin } from "../utils/auth";

export function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  return children;
}

export function AdminRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}
