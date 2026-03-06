import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card fade-up">
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "var(--accent2)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", color: "#0a0e1a",
            margin: "0 auto 20px",
            boxShadow: "0 8px 24px rgba(16,185,129,0.25)",
          }}>⊕</div>
          <h1 style={{ fontSize: "28px", color: "var(--text)", marginBottom: "8px" }}>
            Create account
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Join the TN Price Monitor network
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", padding: "12px 16px",
            color: "#ef4444", fontSize: "14px", marginBottom: "20px",
          }}>{error}</div>
        )}

        <form onSubmit={register}>
          {[
            { key: "name",     label: "Full name",       type: "text",     placeholder: "Arjun Kumar" },
            { key: "email",    label: "Email address",   type: "email",    placeholder: "you@example.com" },
            { key: "password", label: "Password",        type: "password", placeholder: "Min. 8 characters" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500" }}>
                {label}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                className="input"
                required
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          <div style={{ marginBottom: "28px" }} />

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{
              width: "100%", justifyContent: "center", padding: "14px", fontSize: "15px",
              background: "var(--accent2)", boxShadow: "0 4px 20px rgba(16,185,129,0.2)",
            }}
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: "500" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
