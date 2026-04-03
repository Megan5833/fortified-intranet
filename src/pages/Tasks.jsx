import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, doc
} from "firebase/firestore";

const PRIORITIES = [
  { label: "P1 — Critical", value: 1, bg: "#feecec", text: "#941e1e" },
  { label: "P2 — High", value: 2, bg: "#fff4e5", text: "#e8820c" },
  { label: "P3 — Medium", value: 3, bg: "#eef6ff", text: "#3a7ca5" },
  { label: "P4 — Low", value: 4, bg: "#edf7ed", text: "#2d7e4e" },
  { label: "P5 — Someday", value: 5, bg: "#f2f6fa", text: "#8fa3b1" },
];

const card = {
  background: "#fff", border: "1px solid #e6eef5",
  borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState(3);
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("open");

  const fetchTasks = async () => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "tasks"), {
      text,
      priority,
      dueDate,
      assignee: assignee || auth.currentUser?.displayName || "",
      done: false,
      createdBy: auth.currentUser?.displayName || "",
      createdAt: serverTimestamp(),
    });
    setText("");
    setPriority(3);
    setDueDate("");
    setAssignee("");
    setShowForm(false);
    setSaving(false);
    fetchTasks();
  };

  const toggleDone = async (task) => {
    await updateDoc(doc(db, "tasks", task.id), { done: !task.done });
    fetchTasks();
  };

  const getPriority = (val) => PRIORITIES.find((p) => p.value === val) || PRIORITIES[2];

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "open" ? !t.done : t.done
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ padding: "24px", background: "#fafcfe", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["open", "done", "all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: "99px", fontSize: "13px",
              fontWeight: 500, cursor: "pointer", border: "none",
              background: filter === f ? "#1e3a5f" : "#f2f6fa",
              color: filter === f ? "#fff" : "#8fa3b1",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 18px", borderRadius: "10px",
            background: "#ca992c", border: "none",
            color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New task
        </button>
      </div>

      {/* Add task form */}
      {showForm && (
        <div style={{ ...card, padding: "20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233", marginBottom: "16px" }}>New task</div>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to get done?"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: "8px",
              border: "1px solid #e6eef5", fontSize: "14px", color: "#1a2233",
              marginBottom: "12px", outline: "none", background: "#fafcfe",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {/* Priority */}
            <div>
              <div style={{ fontSize: "11px", color: "#8fa3b1", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</div>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "8px",
                  border: "1px solid #e6eef5", fontSize: "13px", color: "#1a2233",
                  background: "#fafcfe", outline: "none",
                }}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <div style={{ fontSize: "11px", color: "#8fa3b1", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due date</div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "8px",
                  border: "1px solid #e6eef5", fontSize: "13px", color: "#1a2233",
                  background: "#fafcfe", outline: "none",
                }}
              />
            </div>

            {/* Assignee */}
            <div>
              <div style={{ fontSize: "11px", color: "#8fa3b1", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Assign to</div>
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Name (optional)"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "8px",
                  border: "1px solid #e6eef5", fontSize: "13px", color: "#1a2233",
                  background: "#fafcfe", outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} style={{
              padding: "9px 18px", borderRadius: "8px", border: "1px solid #e6eef5",
              background: "#fff", fontSize: "13px", color: "#8fa3b1", cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleAdd} disabled={saving || !text.trim()} style={{
              padding: "9px 18px", borderRadius: "8px", border: "none",
              background: "#1e3a5f", fontSize: "13px", fontWeight: 600,
              color: "#fff", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving || !text.trim() ? 0.6 : 1,
            }}>{saving ? "Saving..." : "Add task"}</button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 && (
          <div style={{ ...card, padding: "40px", textAlign: "center", color: "#8fa3b1" }}>
            <div style={{ fontSize: "15px", marginBottom: "6px" }}>
              {filter === "open" ? "No open tasks" : filter === "done" ? "No completed tasks" : "No tasks yet"}
            </div>
            <div style={{ fontSize: "13px" }}>Click New task to add one</div>
          </div>
        )}
        {filtered.map((t) => {
          const p = getPriority(t.priority);
          const overdue = t.dueDate && t.dueDate < today && !t.done;
          return (
            <div key={t.id} style={{
              ...card, padding: "16px 20px",
              display: "flex", alignItems: "center", gap: "14px",
              opacity: t.done ? 0.6 : 1,
            }}>
              {/* Checkbox */}
              <div
                onClick={() => toggleDone(t)}
                style={{
                  width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0,
                  border: t.done ? "none" : "1.5px solid #e6eef5",
                  background: t.done ? "#2d7e4e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                {t.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Task text */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "14px", fontWeight: 500, color: "#1a2233",
                  textDecoration: t.done ? "line-through" : "none",
                  marginBottom: "3px",
                }}>{t.text}</div>
                <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "#8fa3b1" }}>
                  {t.assignee && <span>→ {t.assignee}</span>}
                  {t.dueDate && (
                    <span style={{ color: overdue ? "#941e1e" : "#8fa3b1" }}>
                      {overdue ? "⚠ Overdue · " : ""}{t.dueDate}
                    </span>
                  )}
                  {t.createdBy && <span>by {t.createdBy}</span>}
                </div>
              </div>

              {/* Priority */}
              <span style={{
                fontSize: "11px", padding: "3px 8px", borderRadius: "99px",
                fontWeight: 700, background: p.bg, color: p.text, flexShrink: 0,
              }}>P{t.priority}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}