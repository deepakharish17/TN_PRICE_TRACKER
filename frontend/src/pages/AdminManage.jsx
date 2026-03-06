import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useSettings } from "../hooks/useSettings";

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast toast-${type}`}>
      <span style={{ fontSize: "18px" }}>{type === "success" ? "✅" : "❌"}</span>
      <span style={{ fontSize: "14px", color: "var(--text)", flex: 1 }}>{msg}</span>
      <span onClick={onClose} style={{ cursor: "pointer", color: "var(--muted)", fontSize: "18px" }}>×</span>
    </div>
  );
}

function TagInput({ label, items, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (v && !items.includes(v)) { onAdd(v); setVal(""); }
  };
  return (
    <div>
      <label style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "12px" }}>
        {label} <span style={{ color: "var(--accent)", fontWeight: "700" }}>{items.length}</span>
      </label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <input
          className="input" placeholder={placeholder} value={val}
          style={{ marginTop: 0, flex: 1 }}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button className="btn" onClick={add} style={{ marginTop: 0, flexShrink: 0 }}>+ Add</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
        {items.map(item => (
          <span key={item} className="tag">
            {item}
            <span className="tag-remove" onClick={() => onRemove(item)}>×</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function AdminManage() {
  const { invalidate } = useSettings();
  const [districts,   setDistricts]   = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving,  setSaving]          = useState(false);
  const [toast,   setToast]           = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      setDistricts(res.data.districts);
      setCommodities(res.data.commodities);
    } catch { showToast("Failed to load settings", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Save pushes to localStorage as a temporary custom list
  // (In production these would persist to a Settings collection in MongoDB)
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/admin/settings", { districts, commodities });
      invalidate(); // clears cache AND immediately re-fetches fresh data
      showToast("Saved! Districts & commodities updated for all users.");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: "32px" }} className="fade-up">
        <p style={{ color: "var(--accent)", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          Admin · Configuration
        </p>
        <h1 style={{ fontSize: "36px", color: "var(--text)", marginBottom: "6px" }}>Manage Data</h1>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Add or remove districts and commodities used across the platform</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--muted)" }}>Loading settings…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            {/* Districts */}
            <div className="card fade-up fade-up-1">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span style={{ fontSize: "22px", width: "44px", height: "44px", background: "rgba(245,158,11,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>🗺️</span>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--text)" }}>Districts</h3>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>Tamil Nadu districts available for price submission</p>
                </div>
              </div>
              <TagInput
                label="Districts"
                items={districts}
                placeholder="e.g. Ariyalur"
                onAdd={v => setDistricts(d => [...d, v].sort())}
                onRemove={v => setDistricts(d => d.filter(x => x !== v))}
              />
            </div>

            {/* Commodities */}
            <div className="card fade-up fade-up-2">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span style={{ fontSize: "22px", width: "44px", height: "44px", background: "rgba(99,102,241,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>🛒</span>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--text)" }}>Commodities</h3>
                  <p style={{ fontSize: "12px", color: "var(--muted)" }}>Commodities users can report prices for</p>
                </div>
              </div>
              <TagInput
                label="Commodities"
                items={commodities}
                placeholder="e.g. Cauliflower"
                onAdd={v => setCommodities(c => [...c, v].sort())}
                onRemove={v => setCommodities(c => c.filter(x => x !== v))}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }} className="fade-up fade-up-3">
            <button className="btn-ghost" onClick={load}>↺ Reset to defaults</button>
            <button className="btn" onClick={handleSave} disabled={saving} style={{ padding: "12px 28px" }}>
              {saving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </>
      )}
    </Layout>
  );
}

export default AdminManage;
