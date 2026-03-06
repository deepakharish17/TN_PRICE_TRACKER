import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { saveSession } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const login = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/login", form);
      saveSession({
        token: res.data.token,
        role:  res.data.role,
        name:  res.data.name,
        email: form.email,
      });
      navigate(res.data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card fade-up">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "56px", height: "56px", background: "var(--accent)",
            borderRadius: "16px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "26px", fontWeight: "bold", color: "#fff",
            margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(245,158,11,0.3)",
          }}>₹</div>
          <h1 style={{ fontSize: "28px", color: "var(--text)", marginBottom: "8px" }}>Welcome back</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>Sign in to TN Price Monitor</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", color: "#ef4444", fontSize: "14px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={login}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>Email address</label>
            <input type="email" placeholder="you@example.com" className="input" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ marginBottom: "28px" }}>
            <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>Password</label>
            <input type="password" placeholder="••••••••" className="input" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn" disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "15px" }}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: "500" }}>Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
