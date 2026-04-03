import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query,
  serverTimestamp, updateDoc, doc, getDoc
} from "firebase/firestore";

const card = {
  background: "#fff", border: "1px solid #e6eef5",
  borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const PRIORITIES = [
  { label: "P1 — Critical", value: 1, bg: "#feecec", text: "#941e1e" },
  { label: "P2 — High", value: 2, bg: "#fff4e5", text: "#e8820c" },
  { label: "P3 — Medium", value: 3, bg: "#eef6ff", text: "#3a7ca5" },
  { label: "P4 — Low", value: 4, bg: "#edf7ed", text: "#2d7e4e" },
  { label: "P5 — Someday", value: 5, bg: "#f2f6fa", text: "#8fa3b1" },
];

const MEETING_TEMPLATES = [
  {
    name: "Weekly Team Meeting",
    icon: "👥",
    duration: 60,
    agenda: [
      { item: "Check-in — how is everyone?", owner: "", duration: 5 },
      { item: "Review last week's action items", owner: "", duration: 10 },
      { item: "Scorecard / KPI review", owner: "", duration: 10 },
      { item: "Rock updates", owner: "", duration: 10 },
      { item: "Headlines / announcements", owner: "", duration: 5 },
      { item: "Issues list — IDS", owner: "", duration: 15 },
      { item: "Wrap up — action items review", owner: "", duration: 5 },
    ],
  },
  {
    name: "1:1 Meeting",
    icon: "🤝",
    duration: 30,
    agenda: [
      { item: "Personal check-in", owner: "", duration: 5 },
      { item: "Review last meeting action items", owner: "", duration: 5 },
      { item: "Current priorities and blockers", owner: "", duration: 10 },
      { item: "Feedback — manager to employee", owner: "", duration: 5 },
      { item: "Feedback — employee to manager", owner: "", duration: 5 },
    ],
  },
  {
    name: "Safety Briefing",
    icon: "⛑️",
    duration: 30,
    agenda: [
      { item: "Review any recent incidents or near misses", owner: "", duration: 5 },
      { item: "PPE check and requirements", owner: "", duration: 5 },
      { item: "Job site hazards for this week", owner: "", duration: 10 },
      { item: "Emergency procedures review", owner: "", duration: 5 },
      { item: "Questions and open discussion", owner: "", duration: 5 },
    ],
  },
  {
    name: "Custom meeting",
    icon: "📋",
    duration: 60,
    agenda: [],
  },
];

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  border: "1px solid #e6eef5", fontSize: "13px", color: "#1a2233",
  background: "#fafcfe", outline: "none",
};

const labelStyle = {
  fontSize: "11px", color: "#8fa3b1", fontWeight: 600, marginBottom: "5px",
  textTransform: "uppercase", letterSpacing: "0.5px", display: "block",
};

const btnHover = (bg, hoverBg) => ({
  onMouseEnter: (e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = "translateY(-1px)"; },
  onMouseLeave: (e) => { e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(0)"; },
});

const getPriority = (val) => PRIORITIES.find((p) => p.value === val) || PRIORITIES[2];

export default function Tasks() {
  const [tab, setTab] = useState("tasks");

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [taskPriority, setTaskPriority] = useState(3);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState("open");

  // Meetings state
  const [meetings, setMeetings] = useState([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [expandedMeeting, setExpandedMeeting] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    title: "", date: "", time: "", attendees: "", otterLink: "",
    duration: 60, agenda: [], notes: "", status: "upcoming",
  });

  const today = new Date().toISOString().split("T")[0];

  const fetchTasks = async () => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchMeetings = async () => {
    const q = query(collection(db, "meetings"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setMeetings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchTasks(); fetchMeetings(); }, []);

  // Task handlers
  const handleAddTask = async () => {
    if (!taskText.trim()) return;
    setSavingTask(true);
    await addDoc(collection(db, "tasks"), {
      text: taskText, priority: taskPriority, dueDate: taskDueDate,
      assignee: taskAssignee || auth.currentUser?.displayName || "",
      done: false,
      createdBy: auth.currentUser?.displayName || "",
      createdAt: serverTimestamp(),
    });
    setTaskText(""); setTaskPriority(3); setTaskDueDate(""); setTaskAssignee("");
    setShowTaskForm(false); setSavingTask(false);
    fetchTasks();
  };

  const toggleDone = async (task) => {
    await updateDoc(doc(db, "tasks", task.id), { done: !task.done });
    fetchTasks();
  };

  const filteredTasks = tasks.filter((t) =>
    taskFilter === "all" ? true : taskFilter === "open" ? !t.done : t.done
  );

  // Meeting handlers
  const applyTemplate = (template) => {
    setMeetingForm((f) => ({
      ...f,
      title: template.name,
      duration: template.duration,
      agenda: template.agenda.map((a) => ({ ...a })),
    }));
    setShowTemplates(false);
    setShowMeetingForm(true);
  };

  const addAgendaItem = () => {
    setMeetingForm((f) => ({
      ...f,
      agenda: [...f.agenda, { item: "", owner: "", duration: 5 }],
    }));
  };

  const updateAgendaItem = (index, key, value) => {
    setMeetingForm((f) => {
      const agenda = [...f.agenda];
      agenda[index] = { ...agenda[index], [key]: value };
      return { ...f, agenda };
    });
  };

  const removeAgendaItem = (index) => {
    setMeetingForm((f) => ({
      ...f,
      agenda: f.agenda.filter((_, i) => i !== index),
    }));
  };

  const handleSaveMeeting = async () => {
    if (!meetingForm.title.trim()) return;
    setSavingMeeting(true);
    await addDoc(collection(db, "meetings"), {
      ...meetingForm,
      createdBy: auth.currentUser?.displayName || "",
      createdAt: serverTimestamp(),
    });
    setMeetingForm({ title: "", date: "", time: "", attendees: "", otterLink: "", duration: 60, agenda: [], notes: "", status: "upcoming" });
    setShowMeetingForm(false); setSavingMeeting(false);
    fetchMeetings();
  };

  const pushActionItemsToTasks = async (meeting) => {
    const items = meeting.agenda.filter((a) => a.actionItem?.trim());
    for (const item of items) {
      await addDoc(collection(db, "tasks"), {
        text: item.actionItem,
        priority: 2,
        dueDate: "",
        assignee: item.owner || "",
        done: false,
        createdBy: `Meeting: ${meeting.title}`,
        createdAt: serverTimestamp(),
      });
    }
    alert(`${items.length} action item${items.length !== 1 ? "s" : ""} pushed to Tasks`);
    fetchTasks();
  };

  const updateMeetingAgendaItem = async (meetingId, agenda) => {
    await updateDoc(doc(db, "meetings", meetingId), { agenda });
    fetchMeetings();
  };

  const updateMeetingNotes = async (meetingId, notes) => {
    await updateDoc(doc(db, "meetings", meetingId), { notes });
  };

  return (
    <div style={{ padding: "24px", background: "#fafcfe", minHeight: "100%" }}>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "#f2f6fa", borderRadius: "10px", padding: "4px", marginBottom: "20px", width: "fit-content" }}>
        {["tasks", "meetings"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: "7px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.15s",
            background: tab === t ? "#fff" : "transparent",
            color: tab === t ? "#1a2233" : "#8fa3b1",
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── TASKS TAB ── */}
      {tab === "tasks" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["open", "done", "all"].map((f) => (
                <button key={f} onClick={() => setTaskFilter(f)}
                  {...btnHover(taskFilter === f ? "#941e1e" : "#f2f6fa", taskFilter === f ? "#7a1818" : "#e6eef5")}
                  style={{ padding: "6px 14px", borderRadius: "99px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: "none", background: taskFilter === f ? "#941e1e" : "#f2f6fa", color: taskFilter === f ? "#fff" : "#8fa3b1", transition: "all 0.15s" }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={() => setShowTaskForm(!showTaskForm)} {...btnHover("#ca992c", "#b8881f")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", background: "#ca992c", border: "none", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              New task
            </button>
          </div>

          {showTaskForm && (
            <div style={{ ...card, padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233", marginBottom: "16px" }}>New task</div>
              <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="What needs to get done?" style={{ ...inputStyle, marginBottom: "12px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(Number(e.target.value))} style={inputStyle}>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Due date</label>
                  <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Assign to</label>
                  <input value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} placeholder="Name (optional)" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowTaskForm(false)} {...btnHover("#fff", "#f2f6fa")} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e6eef5", background: "#fff", fontSize: "13px", color: "#8fa3b1", cursor: "pointer", transition: "all 0.15s" }}>Cancel</button>
                <button onClick={handleAddTask} disabled={savingTask || !taskText.trim()} {...btnHover("#ca992c", "#b8881f")} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "#ca992c", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: savingTask ? "not-allowed" : "pointer", opacity: savingTask || !taskText.trim() ? 0.6 : 1, transition: "all 0.15s" }}>
                  {savingTask ? "Saving..." : "Add task"}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredTasks.length === 0 && (
              <div style={{ ...card, padding: "40px", textAlign: "center", color: "#8fa3b1" }}>
                <div style={{ fontSize: "15px", marginBottom: "6px" }}>{taskFilter === "open" ? "No open tasks" : taskFilter === "done" ? "No completed tasks" : "No tasks yet"}</div>
                <div style={{ fontSize: "13px" }}>Click New task to add one</div>
              </div>
            )}
            {filteredTasks.map((t) => {
              const p = getPriority(t.priority);
              const overdue = t.dueDate && t.dueDate < today && !t.done;
              return (
                <div key={t.id} style={{ ...card, padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", opacity: t.done ? 0.6 : 1 }}>
                  <div onClick={() => toggleDone(t)} style={{ width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0, border: t.done ? "none" : "1.5px solid #e6eef5", background: t.done ? "#2d7e4e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    {t.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a2233", textDecoration: t.done ? "line-through" : "none", marginBottom: "3px" }}>{t.text}</div>
                    <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "#8fa3b1" }}>
                      {t.assignee && <span>→ {t.assignee}</span>}
                      {t.dueDate && <span style={{ color: overdue ? "#941e1e" : "#8fa3b1" }}>{overdue ? "⚠ Overdue · " : ""}{t.dueDate}</span>}
                      {t.createdBy && <span>by {t.createdBy}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", fontWeight: 700, background: p.bg, color: p.text, flexShrink: 0 }}>P{t.priority}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── MEETINGS TAB ── */}
      {tab === "meetings" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", color: "#8fa3b1" }}>{meetings.length} meeting{meetings.length !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowTemplates(!showTemplates)} {...btnHover("#f2f6fa", "#e6eef5")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", background: "#f2f6fa", border: "1px solid #e6eef5", color: "#4a5568", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h4M5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Use template
              </button>
              <button onClick={() => { setMeetingForm({ title: "", date: "", time: "", attendees: "", otterLink: "", duration: 60, agenda: [], notes: "", status: "upcoming" }); setShowMeetingForm(true); }} {...btnHover("#ca992c", "#b8881f")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", background: "#ca992c", border: "none", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                New meeting
              </button>
            </div>
          </div>

          {/* Template picker */}
          {showTemplates && (
            <div style={{ ...card, padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233", marginBottom: "14px" }}>Choose a template</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "10px" }}>
                {MEETING_TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => applyTemplate(t)}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ca992c"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e6eef5"}
                    style={{ padding: "16px", borderRadius: "10px", border: "1.5px solid #e6eef5", background: "#fafcfe", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <div style={{ fontSize: "22px", marginBottom: "8px" }}>{t.icon}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2233", marginBottom: "4px" }}>{t.name}</div>
                    <div style={{ fontSize: "11px", color: "#8fa3b1" }}>{t.duration} min · {t.agenda.length} agenda items</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meeting form */}
          {showMeetingForm && (
            <div style={{ ...card, padding: "24px", marginBottom: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a2233", marginBottom: "16px" }}>Schedule meeting</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div><label style={labelStyle}>Meeting title *</label><input value={meetingForm.title} onChange={(e) => setMeetingForm((f) => ({ ...f, title: e.target.value }))} placeholder="Weekly Team Meeting" style={inputStyle} /></div>
                <div><label style={labelStyle}>Date</label><input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Time</label><input type="time" value={meetingForm.time} onChange={(e) => setMeetingForm((f) => ({ ...f, time: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>Duration (minutes)</label><input type="number" value={meetingForm.duration} onChange={(e) => setMeetingForm((f) => ({ ...f, duration: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Attendees</label><input value={meetingForm.attendees} onChange={(e) => setMeetingForm((f) => ({ ...f, attendees: e.target.value }))} placeholder="Megan, Larry, Jonathan..." style={inputStyle} /></div>
                <div><label style={labelStyle}>Otter.ai link</label><input value={meetingForm.otterLink} onChange={(e) => setMeetingForm((f) => ({ ...f, otterLink: e.target.value }))} placeholder="https://otter.ai/..." style={inputStyle} /></div>
              </div>

              {/* Agenda builder */}
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #e6eef5" }}>Agenda</div>
              {meetingForm.agenda.length === 0 && (
                <div style={{ fontSize: "13px", color: "#8fa3b1", marginBottom: "10px" }}>No agenda items yet — add one below</div>
              )}
              {meetingForm.agenda.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                  <input value={item.item} onChange={(e) => updateAgendaItem(i, "item", e.target.value)} placeholder="Agenda item" style={inputStyle} />
                  <input value={item.owner} onChange={(e) => updateAgendaItem(i, "owner", e.target.value)} placeholder="Owner" style={{ ...inputStyle, width: "120px" }} />
                  <input type="number" value={item.duration} onChange={(e) => updateAgendaItem(i, "duration", e.target.value)} placeholder="Min" style={{ ...inputStyle, width: "60px" }} />
                  <button onClick={() => removeAgendaItem(i)} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", background: "#feecec", color: "#941e1e", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
              <button onClick={addAgendaItem} {...btnHover("#f2f6fa", "#e6eef5")} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px dashed #e6eef5", background: "#f2f6fa", fontSize: "12px", color: "#8fa3b1", cursor: "pointer", marginBottom: "16px", transition: "all 0.15s" }}>
                + Add agenda item
              </button>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowMeetingForm(false)} {...btnHover("#fff", "#f2f6fa")} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e6eef5", background: "#fff", fontSize: "13px", color: "#8fa3b1", cursor: "pointer", transition: "all 0.15s" }}>Cancel</button>
                <button onClick={handleSaveMeeting} disabled={savingMeeting || !meetingForm.title.trim()} {...btnHover("#ca992c", "#b8881f")} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "#ca992c", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: savingMeeting ? "not-allowed" : "pointer", opacity: savingMeeting || !meetingForm.title.trim() ? 0.6 : 1, transition: "all 0.15s" }}>
                  {savingMeeting ? "Saving..." : "Schedule meeting"}
                </button>
              </div>
            </div>
          )}

          {/* Meetings list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {meetings.length === 0 && (
              <div style={{ ...card, padding: "40px", textAlign: "center", color: "#8fa3b1" }}>
                <div style={{ fontSize: "15px", marginBottom: "6px" }}>No meetings scheduled</div>
                <div style={{ fontSize: "13px" }}>Use a template or create a custom meeting above</div>
              </div>
            )}
            {meetings.map((m) => {
              const expanded = expandedMeeting === m.id;
              return (
                <div key={m.id} style={card}>
                  {/* Meeting header */}
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }} onClick={() => setExpandedMeeting(expanded ? null : m.id)}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e8f4fb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="#3a7ca5" strokeWidth="1.2"/><path d="M5 2v2M11 2v2M2 7h12" stroke="#3a7ca5" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233" }}>{m.title}</div>
                      <div style={{ fontSize: "12px", color: "#8fa3b1", marginTop: "2px", display: "flex", gap: "10px" }}>
                        {m.date && <span>{m.date}</span>}
                        {m.time && <span>{m.time}</span>}
                        {m.duration && <span>{m.duration} min</span>}
                        {m.attendees && <span>{m.attendees}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {m.otterLink && (
                        <a href={m.otterLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", background: "#eef6ff", color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
                          Otter.ai →
                        </a>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); pushActionItemsToTasks(m); }}
                        {...btnHover("#edf7ed", "#d4f0d4")}
                        style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", background: "#edf7ed", color: "#1e5e1e", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s" }}>
                        Push to tasks
                      </button>
                      <span style={{ fontSize: "11px", color: "#8fa3b1" }}>{expanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded agenda */}
                  {expanded && (
                    <div style={{ borderTop: "1px solid #e6eef5", padding: "16px 20px" }}>
                      {m.agenda?.length > 0 && (
                        <>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Agenda</div>
                          {m.agenda.map((item, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #eef2f6" }}>
                              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#f2f6fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#8fa3b1", flexShrink: 0 }}>{i + 1}</div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a2233" }}>{item.item}</div>
                                {item.owner && <div style={{ fontSize: "11px", color: "#8fa3b1", marginTop: "2px" }}>→ {item.owner}</div>}
                                <input
                                  placeholder="Action item from this agenda point..."
                                  defaultValue={item.actionItem || ""}
                                  onBlur={(e) => {
                                    const updated = [...m.agenda];
                                    updated[i] = { ...updated[i], actionItem: e.target.value };
                                    updateMeetingAgendaItem(m.id, updated);
                                  }}
                                  style={{ ...inputStyle, marginTop: "6px", fontSize: "12px", background: "#fffbf0", borderColor: "#fdf6e3" }}
                                />
                              </div>
                              <div style={{ fontSize: "11px", color: "#8fa3b1", flexShrink: 0, marginTop: "4px" }}>{item.duration}m</div>
                            </div>
                          ))}
                        </>
                      )}

                      <div style={{ marginTop: "14px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>Meeting notes</div>
                        <textarea
                          defaultValue={m.notes || ""}
                          onBlur={(e) => updateMeetingNotes(m.id, e.target.value)}
                          placeholder="Add notes from this meeting..."
                          rows={4}
                          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}