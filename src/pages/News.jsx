import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query,
  serverTimestamp, updateDoc, doc, deleteDoc, getDoc, setDoc
} from "firebase/firestore";

const card = {
  background: "#fff", border: "1px solid #e6eef5",
  borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const DEFAULT_TEMPLATES = [
  {
    id: "weekly-team",
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
    id: "one-on-one",
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
    id: "safety-briefing",
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
    id: "production-kickoff",
    name: "Production Kickoff",
    icon: "🏗️",
    duration: 30,
    agenda: [
      { item: "Jobs scheduled this week", owner: "", duration: 5 },
      { item: "Crew assignments", owner: "", duration: 5 },
      { item: "Material and supply needs", owner: "", duration: 5 },
      { item: "Weather and scheduling concerns", owner: "", duration: 5 },
      { item: "Open issues", owner: "", duration: 10 },
    ],
  },
  {
    id: "sales-huddle",
    name: "Sales Huddle",
    icon: "📈",
    duration: 30,
    agenda: [
      { item: "Pipeline review", owner: "", duration: 10 },
      { item: "Estimates sent this week", owner: "", duration: 5 },
      { item: "Follow-ups needed", owner: "", duration: 5 },
      { item: "Won / lost deals", owner: "", duration: 5 },
      { item: "Goals and targets", owner: "", duration: 5 },
    ],
  },
  {
    id: "custom",
    name: "Custom meeting",
    icon: "📋",
    duration: 60,
    agenda: [],
  },
];

const ICONS = ["📋","👥","🤝","⛑️","🏗️","📈","🎯","📊","💡","🔧","📝","🚀"];

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

const SectionLabel = ({ text }) => (
  <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #e6eef5" }}>{text}</div>
);

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    title: "", date: "", time: "", attendees: "",
    otterLink: "", duration: 60, agenda: [], notes: "",
  });
  const [newTemplate, setNewTemplate] = useState({
    name: "", icon: "📋", duration: 60, agenda: [],
  });

  const canManageTemplates = ["owner", "admin", "manager"].includes(currentUser?.role);

  const fetchMeetings = async () => {
    const q = query(collection(db, "meetings"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setMeetings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchTemplates = async () => {
    const snap = await getDocs(collection(db, "meetingTemplates"));
    if (snap.empty) {
      // Seed defaults on first load
      for (const t of DEFAULT_TEMPLATES) {
        await setDoc(doc(db, "meetingTemplates", t.id), t);
      }
      setTemplates(DEFAULT_TEMPLATES);
    } else {
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchTemplates();
    const u = auth.currentUser;
    if (u) {
      getDoc(doc(db, "users", u.uid)).then((snap) => {
        if (snap.exists()) setCurrentUser(snap.data());
      });
    }
  }, []);

  // Template management
  const startEditTemplate = (t) => {
    setEditingTemplate({ ...t, agenda: t.agenda.map((a) => ({ ...a })) });
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    setSavingTemplate(true);
    await setDoc(doc(db, "meetingTemplates", editingTemplate.id), editingTemplate);
    setSavingTemplate(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    await deleteDoc(doc(db, "meetingTemplates", id));
    fetchTemplates();
  };

  const saveNewTemplate = async () => {
    if (!newTemplate.name.trim()) return;
    setSavingTemplate(true);
    const id = `custom_${Date.now()}`;
    await setDoc(doc(db, "meetingTemplates", id), { ...newTemplate, id });
    setNewTemplate({ name: "", icon: "📋", duration: 60, agenda: [] });
    setShowNewTemplate(false);
    setSavingTemplate(false);
    fetchTemplates();
  };

  const updateTemplateAgenda = (agenda) => {
    setEditingTemplate((t) => ({ ...t, agenda }));
  };

  const addTemplateAgendaItem = () => {
    setEditingTemplate((t) => ({ ...t, agenda: [...(t.agenda || []), { item: "", owner: "", duration: 5 }] }));
  };

  const updateNewTemplateAgenda = (agenda) => {
    setNewTemplate((t) => ({ ...t, agenda }));
  };

  // Meeting form
  const applyTemplate = (template) => {
    setForm((f) => ({
      ...f,
      title: template.name,
      duration: template.duration,
      agenda: (template.agenda || []).map((a) => ({ ...a })),
    }));
    setShowTemplates(false);
    setShowForm(true);
  };

  const addAgendaItem = () => {
    setForm((f) => ({ ...f, agenda: [...f.agenda, { item: "", owner: "", duration: 5 }] }));
  };

  const updateAgendaItem = (i, key, val) => {
    setForm((f) => {
      const agenda = [...f.agenda];
      agenda[i] = { ...agenda[i], [key]: val };
      return { ...f, agenda };
    });
  };

  const removeAgendaItem = (i) => {
    setForm((f) => ({ ...f, agenda: f.agenda.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "meetings"), {
      ...form,
      createdBy: auth.currentUser?.displayName || "",
      createdAt: serverTimestamp(),
    });
    setForm({ title: "", date: "", time: "", attendees: "", otterLink: "", duration: 60, agenda: [], notes: "" });
    setShowForm(false); setSaving(false);
    fetchMeetings();
  };

  const updateMeetingField = async (id, field, value) => {
    await updateDoc(doc(db, "meetings", id), { [field]: value });
  };

  const updateAgendaInMeeting = async (meetingId, agenda) => {
    await updateDoc(doc(db, "meetings", meetingId), { agenda });
    fetchMeetings();
  };

  const pushToTasks = async (meeting) => {
    const items = meeting.agenda?.filter((a) => a.actionItem?.trim()) || [];
    if (items.length === 0) { alert("No action items found. Add action items to agenda points first."); return; }
    for (const item of items) {
      await addDoc(collection(db, "tasks"), {
        text: item.actionItem, priority: 2, dueDate: "",
        assignee: item.owner || "", done: false,
        createdBy: `Meeting: ${meeting.title}`,
        createdAt: serverTimestamp(),
      });
    }
    alert(`${items.length} action item${items.length !== 1 ? "s" : ""} pushed to Tasks`);
  };

  const AgendaEditor = ({ agenda, onChange }) => (
    <div>
      {agenda.map((item, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 130px 55px 28px", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <input value={item.item} onChange={(e) => { const a = [...agenda]; a[i] = { ...a[i], item: e.target.value }; onChange(a); }} placeholder="Agenda item" style={inputStyle} />
          <input value={item.owner} onChange={(e) => { const a = [...agenda]; a[i] = { ...a[i], owner: e.target.value }; onChange(a); }} placeholder="Owner" style={inputStyle} />
          <input type="number" value={item.duration} onChange={(e) => { const a = [...agenda]; a[i] = { ...a[i], duration: e.target.value }; onChange(a); }} placeholder="Min" style={inputStyle} />
          <button onClick={() => onChange(agenda.filter((_, idx) => idx !== i))} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", background: "#feecec", color: "#941e1e", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      ))}
      <button onClick={() => onChange([...agenda, { item: "", owner: "", duration: 5 }])} {...btnHover("#f2f6fa", "#e6eef5")} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px dashed #e6eef5", background: "#f2f6fa", fontSize: "12px", color: "#8fa3b1", cursor: "pointer", transition: "all 0.15s" }}>
        + Add agenda item
      </button>
    </div>
  );

  return (
    <div style={{ padding: "24px", background: "#fafcfe", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", color: "#8fa3b1" }}>{meetings.length} meeting{meetings.length !== 1 ? "s" : ""}</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { setShowTemplates(!showTemplates); setShowForm(false); }}
            {...btnHover("#f2f6fa", "#e6eef5")}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", background: "#f2f6fa", border: "1px solid #e6eef5", color: "#4a5568", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h4M5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Templates
          </button>
          <button
            onClick={() => { setForm({ title: "", date: "", time: "", attendees: "", otterLink: "", duration: 60, agenda: [], notes: "" }); setShowForm(true); setShowTemplates(false); }}
            {...btnHover("#ca992c", "#b8881f")}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", background: "#ca992c", border: "none", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            New meeting
          </button>
        </div>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div style={{ ...card, padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233" }}>Meeting templates</div>
            {canManageTemplates && (
              <button onClick={() => setShowNewTemplate(!showNewTemplate)} {...btnHover("#ca992c", "#b8881f")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: "#ca992c", border: "none", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                New template
              </button>
            )}
          </div>

          {/* New template form */}
          {showNewTemplate && canManageTemplates && (
            <div style={{ background: "#fafcfe", border: "1px solid #e6eef5", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2233", marginBottom: "12px" }}>Create new template</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 80px", gap: "10px", marginBottom: "10px", alignItems: "end" }}>
                <div>
                  <label style={labelStyle}>Icon</label>
                  <select value={newTemplate.icon} onChange={(e) => setNewTemplate((t) => ({ ...t, icon: e.target.value }))} style={{ ...inputStyle, width: "70px", fontSize: "20px" }}>
                    {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Template name *</label>
                  <input value={newTemplate.name} onChange={(e) => setNewTemplate((t) => ({ ...t, name: e.target.value }))} placeholder="e.g. Monthly Review" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Duration (min)</label>
                  <input type="number" value={newTemplate.duration} onChange={(e) => setNewTemplate((t) => ({ ...t, duration: Number(e.target.value) }))} style={inputStyle} />
                </div>
              </div>
              <SectionLabel text="Agenda items" />
              <AgendaEditor agenda={newTemplate.agenda} onChange={updateNewTemplateAgenda} />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "14px" }}>
                <button onClick={() => setShowNewTemplate(false)} {...btnHover("#fff", "#f2f6fa")} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid #e6eef5", background: "#fff", fontSize: "12px", color: "#8fa3b1", cursor: "pointer", transition: "all 0.15s" }}>Cancel</button>
                <button onClick={saveNewTemplate} disabled={savingTemplate || !newTemplate.name.trim()} {...btnHover("#ca992c", "#b8881f")} style={{ padding: "7px 14px", borderRadius: "7px", border: "none", background: "#ca992c", fontSize: "12px", fontWeight: 600, color: "#fff", cursor: "pointer", opacity: !newTemplate.name.trim() ? 0.6 : 1, transition: "all 0.15s" }}>
                  {savingTemplate ? "Saving..." : "Save template"}
                </button>
              </div>
            </div>
          )}

          {/* Template grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "10px" }}>
            {templates.map((t) => (
              <div key={t.id}>
                {editingTemplate?.id === t.id ? (
                  /* Edit mode */
                  <div style={{ border: "2px solid #ca992c", borderRadius: "10px", padding: "16px", background: "#fffbf0" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 70px", gap: "8px", marginBottom: "10px", alignItems: "end" }}>
                      <div>
                        <label style={labelStyle}>Icon</label>
                        <select value={editingTemplate.icon} onChange={(e) => setEditingTemplate((t) => ({ ...t, icon: e.target.value }))} style={{ ...inputStyle, width: "60px", fontSize: "18px" }}>
                          {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Name</label>
                        <input value={editingTemplate.name} onChange={(e) => setEditingTemplate((t) => ({ ...t, name: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Min</label>
                        <input type="number" value={editingTemplate.duration} onChange={(e) => setEditingTemplate((t) => ({ ...t, duration: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                    <SectionLabel text="Agenda" />
                    <AgendaEditor agenda={editingTemplate.agenda || []} onChange={updateTemplateAgenda} />
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "12px" }}>
                      <button onClick={() => setEditingTemplate(null)} {...btnHover("#fff", "#f2f6fa")} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e6eef5", background: "#fff", fontSize: "11px", color: "#8fa3b1", cursor: "pointer", transition: "all 0.15s" }}>Cancel</button>
                      <button onClick={saveTemplate} {...btnHover("#ca992c", "#b8881f")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#ca992c", fontSize: "11px", fontWeight: 600, color: "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                        {savingTemplate ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div style={{ border: "1.5px solid #e6eef5", borderRadius: "10px", padding: "14px", background: "#fafcfe", position: "relative" }}>
                    <div style={{ fontSize: "20px", marginBottom: "6px" }}>{t.icon}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2233", marginBottom: "3px" }}>{t.name}</div>
                    <div style={{ fontSize: "11px", color: "#8fa3b1", marginBottom: "10px" }}>{t.duration} min · {(t.agenda || []).length} agenda items</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => applyTemplate(t)} {...btnHover("#1e3a5f", "#0d153d")} style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "none", background: "#1e3a5f", fontSize: "11px", fontWeight: 600, color: "#fff", cursor: "pointer", transition: "all 0.15s" }}>Use</button>
                      {canManageTemplates && (
                        <>
                          <button onClick={() => startEditTemplate(t)} {...btnHover("#eef6ff", "#dbeeff")} style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "1px solid #e6eef5", background: "#eef6ff", fontSize: "11px", color: "#1d4ed8", cursor: "pointer", transition: "all 0.15s" }}>Edit</button>
                          {t.id.startsWith("custom_") && (
                            <button onClick={() => deleteTemplate(t.id)} {...btnHover("#feecec", "#fdd8d8")} style={{ padding: "6px 8px", borderRadius: "6px", border: "none", background: "#feecec", fontSize: "11px", color: "#941e1e", cursor: "pointer", transition: "all 0.15s" }}>×</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting form */}
      {showForm && (
        <div style={{ ...card, padding: "24px", marginBottom: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a2233", marginBottom: "16px" }}>Schedule meeting</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={labelStyle}>Meeting title *</label><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Weekly Team Meeting" style={inputStyle} /></div>
            <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Time</label><input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} style={inputStyle} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div><label style={labelStyle}>Duration (min)</label><input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Attendees</label><input value={form.attendees} onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))} placeholder="Megan, Larry..." style={inputStyle} /></div>
            <div><label style={labelStyle}>Otter.ai link</label><input value={form.otterLink} onChange={(e) => setForm((f) => ({ ...f, otterLink: e.target.value }))} placeholder="https://otter.ai/..." style={inputStyle} /></div>
          </div>
          <SectionLabel text="Agenda" />
          {form.agenda.length === 0 && <div style={{ fontSize: "13px", color: "#8fa3b1", marginBottom: "10px" }}>No agenda items yet</div>}
          {form.agenda.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 130px 55px 28px", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <input value={item.item} onChange={(e) => updateAgendaItem(i, "item", e.target.value)} placeholder="Agenda item" style={inputStyle} />
              <input value={item.owner} onChange={(e) => updateAgendaItem(i, "owner", e.target.value)} placeholder="Owner" style={inputStyle} />
              <input type="number" value={item.duration} onChange={(e) => updateAgendaItem(i, "duration", e.target.value)} placeholder="Min" style={inputStyle} />
              <button onClick={() => removeAgendaItem(i)} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", background: "#feecec", color: "#941e1e", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
          <button onClick={addAgendaItem} {...btnHover("#f2f6fa", "#e6eef5")} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px dashed #e6eef5", background: "#f2f6fa", fontSize: "12px", color: "#8fa3b1", cursor: "pointer", marginBottom: "16px", transition: "all 0.15s" }}>
            + Add agenda item
          </button>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowForm(false)} {...btnHover("#fff", "#f2f6fa")} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e6eef5", background: "#fff", fontSize: "13px", color: "#8fa3b1", cursor: "pointer", transition: "all 0.15s" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} {...btnHover("#ca992c", "#b8881f")} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "#ca992c", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving || !form.title.trim() ? 0.6 : 1, transition: "all 0.15s" }}>
              {saving ? "Saving..." : "Schedule meeting"}
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
          const expanded = expandedId === m.id;
          return (
            <div key={m.id} style={card}>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : m.id)}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e8f4fb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="#3a7ca5" strokeWidth="1.2"/><path d="M5 2v2M11 2v2M2 7h12" stroke="#3a7ca5" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233" }}>{m.title}</div>
                  <div style={{ fontSize: "12px", color: "#8fa3b1", marginTop: "2px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                  <button onClick={(e) => { e.stopPropagation(); pushToTasks(m); }} {...btnHover("#edf7ed", "#d4f0d4")} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: "#edf7ed", color: "#1e5e1e", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s" }}>
                    Push to tasks
                  </button>
                  <span style={{ fontSize: "11px", color: "#8fa3b1" }}>{expanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {expanded && (
                <div style={{ borderTop: "1px solid #e6eef5", padding: "16px 20px" }}>
                  {m.agenda?.length > 0 && (
                    <>
                      <SectionLabel text="Agenda" />
                      {m.agenda.map((item, i) => (
                        <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #eef2f6" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#f2f6fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#8fa3b1", flexShrink: 0 }}>{i + 1}</div>
                            <div style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#1a2233" }}>{item.item}</div>
                            {item.owner && <div style={{ fontSize: "11px", color: "#8fa3b1" }}>→ {item.owner}</div>}
                            <div style={{ fontSize: "11px", color: "#8fa3b1", flexShrink: 0 }}>{item.duration}m</div>
                          </div>
                          <input
                            placeholder="Action item from this point..."
                            defaultValue={item.actionItem || ""}
                            onBlur={(e) => {
                              const updated = [...m.agenda];
                              updated[i] = { ...updated[i], actionItem: e.target.value };
                              updateAgendaInMeeting(m.id, updated);
                            }}
                            style={{ ...inputStyle, fontSize: "12px", background: "#fffbf0", borderColor: "#fdf6e3", marginLeft: "32px", width: "calc(100% - 32px)" }}
                          />
                        </div>
                      ))}
                    </>
                  )}
                  <div style={{ marginTop: "14px" }}>
                    <SectionLabel text="Meeting notes" />
                    <textarea
                      defaultValue={m.notes || ""}
                      onBlur={(e) => updateMeetingField(m.id, "notes", e.target.value)}
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
    </div>
  );
}