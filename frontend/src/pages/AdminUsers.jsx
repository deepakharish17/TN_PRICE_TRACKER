import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

/* ---------------- TOAST ---------------- */

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span style={{ flex: 1, fontSize: "14px", color: "var(--text)" }}>
        {msg}
      </span>
      <span
        onClick={onClose}
        style={{ cursor: "pointer", color: "var(--muted)" }}
      >
        ×
      </span>
    </div>
  );
}

/* ---------------- CONFIRM MODAL ---------------- */

function ConfirmModal({ message, onConfirm, onClose, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text)",
            marginBottom: "20px",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              background: danger ? "#ef4444" : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SUSPEND MODAL ---------------- */

function SuspendModal({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3
          style={{
            fontSize: "18px",
            color: "var(--text)",
            marginBottom: "8px",
          }}
        >
          🛑 Suspend {user.name}
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            marginBottom: "16px",
          }}
        >
          The user will be notified and blocked from logging in.
        </p>

        <textarea
          className="input"
          rows={3}
          placeholder="Reason for suspension..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ resize: "vertical", marginBottom: "16px" }}
        />

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            onClick={() => onConfirm(reason)}
            style={{
              padding: "10px 20px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Suspend User
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [actioning, setAction] = useState(null);

  const myId = localStorage.getItem("userId");

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ---------------- LOAD USERS ---------------- */

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/users");
      setUsers(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- USER ACTIONS ---------------- */

  const doAction = async (action, userId, extra = {}) => {
    setAction(userId + "_" + action);

    try {
      let r;

      if (action === "promote")
        r = await api.put(`/admin/users/${userId}/promote`);

      if (action === "demote")
        r = await api.put(`/admin/users/${userId}/demote`);

      if (action === "suspend")
        r = await api.put(`/admin/users/${userId}/suspend`, {
          reason: extra.reason,
        });

      if (action === "unsuspend")
        r = await api.put(`/admin/users/${userId}/unsuspend`);

      if (action === "delete") {
        await api.delete(`/admin/users/${userId}`);
        setUsers((u) => u.filter((x) => x._id !== userId));
        showToast("User deleted");
        return;
      }

      setUsers((u) => u.map((x) => (x._id === userId ? r.data : x)));

      showToast(
        action === "promote"
          ? "Promoted to admin"
          : action === "demote"
          ? "Demoted to user"
          : action === "suspend"
          ? "User suspended"
          : "User unsuspended"
      );
    } catch (e) {
      showToast(e.response?.data || "Action failed", "error");
    } finally {
      setAction(null);
      setModal(null);
    }
  };

  /* ---------------- FILTER USERS ---------------- */

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchRole =
      filterRole === "all" ||
      (filterRole === "suspended" ? u.suspended : u.role === filterRole);

    return matchSearch && matchRole;
  });

  const admins = users.filter((u) => u.role === "admin").length;
  const suspended = users.filter((u) => u.suspended).length;
  const regular = users.filter((u) => u.role === "user" && !u.suspended).length;

  const initials = (name) =>
    name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  /* ---------------- UI ---------------- */

  return (
    <Layout>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmModal
          message={`Delete ${modal.user.name}? This is permanent.`}
          onConfirm={() => doAction("delete", modal.user._id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "demote" && (
        <ConfirmModal
          message={`Demote ${modal.user.name} from admin to user?`}
          onConfirm={() => doAction("demote", modal.user._id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "unsuspend" && (
        <ConfirmModal
          message={`Lift suspension for ${modal.user.name}?`}
          danger={false}
          onConfirm={() => doAction("unsuspend", modal.user._id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "suspend" && (
        <SuspendModal
          user={modal.user}
          onConfirm={(r) =>
            doAction("suspend", modal.user._id, { reason: r })
          }
          onClose={() => setModal(null)}
        />
      )}

      {/* HEADER */}

      <div style={{ marginBottom: "32px" }}>
        <p style={{ color: "var(--accent)", fontSize: "12px", fontWeight: "600" }}>
          Admin · Users
        </p>

        <h1 style={{ fontSize: "32px", color: "var(--text)" }}>
          Manage Users
        </h1>

        <p style={{ color: "var(--muted)" }}>
          Promote, suspend, and manage platform users
        </p>
      </div>

      {/* STATS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total", value: users.length, color: "#6366f1" },
          { label: "Admins", value: admins, color: "#e11d48" },
          { label: "Active", value: regular, color: "#10b981" },
          { label: "Suspended", value: suspended, color: "#ef4444" },
        ].map((s) => (
          <div
            key={s.label}
            className="card"
            style={{ borderLeft: `3px solid ${s.color}` }}
          >
            <p>{s.label}</p>
            <h2 style={{ color: s.color }}>{s.value}</h2>
          </div>
        ))}
      </div>

      {/* USERS TABLE */}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            Loading...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const isMe = u._id === myId;
                  const color =
                    u.role === "admin" ? "#e11d48" : "#6366f1";

                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: color,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                            }}
                          >
                            {initials(u.name)}
                          </div>

                          <div>
                            <p>
                              {u.name}{" "}
                              {isMe && (
                                <span style={{ color: "var(--accent)" }}>
                                  YOU
                                </span>
                              )}
                            </p>
                            <p style={{ fontSize: "12px" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td>{u.role}</td>

                      <td>
                        {u.suspended ? "Suspended" : "Active"}
                      </td>

                      <td>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        {!isMe && (
                          <button
                            onClick={() =>
                              setModal({ type: "delete", user: u })
                            }
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </Layout>
  );
}

export default AdminUsers;