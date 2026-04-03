export default function Dashboard() {
  const metrics = [
    { label: "Active jobs", value: "7", trend: "↑ +2 this week", trendUp: true, accent: "#3a7ca5", iconBg: "#e8f4fb" },
    { label: "Open estimates", value: "12", trend: "$148K pipeline", trendUp: null, accent: "#ca992c", iconBg: "#fdf6e3" },
    { label: "MTD revenue", value: "$48K", trend: "↑ 68% of goal", trendUp: true, accent: "#2d7e4e", iconBg: "#edf7ed" },
    { label: "Missed calls", value: "3", trend: "↓ needs follow-up", trendUp: false, accent: "#941e1e", iconBg: "#feecec" },
  ];

  const pipeline = [
    { label: "New lead", count: 6, pct: 60, color: "#2d7e4e" },
    { label: "Estimate sent", count: 8, pct: 80, color: "#ca992c" },
    { label: "Sold", count: 4, pct: 45, color: "#1e3a5f" },
    { label: "In production", count: 7, pct: 70, color: "#e8820c" },
    { label: "Invoiced", count: 3, pct: 30, color: "#941e1e" },
  ];

  const calls = [
    { name: "Smith, R.", number: "(573) 555-0142", time: "Today 9:14am", type: "missed" },
    { name: "Johnson, M.", number: "(573) 555-0198", time: "Today 8:52am", type: "missed" },
    { name: "Williams, T.", number: "(573) 555-0167", time: "Yesterday 4:31pm", type: "text" },
    { name: "Davis, K.", number: "(573) 555-0112", time: "Yesterday 2:17pm", type: "missed" },
  ];

  const tasks = [
    { text: "Send estimate — Morrison", priority: "P4", done: true },
    { text: "Follow up — Williams lead", priority: "P1", done: false },
    { text: "Order shingles — Alvarez", priority: "P2", done: false },
    { text: "Review sub invoices", priority: "P3", done: false },
  ];

  const goals = [
    { name: "Revenue $180K", pct: 68, color: "#2d7e4e" },
    { name: "Jobs closed 35", pct: 54, color: "#ca992c" },
    { name: "Reviews 25", pct: 72, color: "#3a7ca5" },
    { name: "Avg job value $6K", pct: 41, color: "#941e1e" },
  ];

  const announcements = [
    { tag: "Urgent", tagColor: "#feecec", tagText: "#941e1e", title: "Safety briefing — Friday 7am", author: "Jake D.", time: "Today" },
    { tag: "Update", tagColor: "#eef6ff", tagText: "#1d4ed8", title: "New supplement process effective Monday", author: "Megan H.", time: "Yesterday" },
    { tag: "General", tagColor: "#f2f6fa", tagText: "#8fa3b1", title: "Q2 kickoff — goals and targets shared", author: "Jake D.", time: "Monday" },
  ];

  const priorityColors = {
    P1: { bg: "#feecec", text: "#941e1e" },
    P2: { bg: "#fff4e5", text: "#e8820c" },
    P3: { bg: "#eef6ff", text: "#3a7ca5" },
    P4: { bg: "#edf7ed", text: "#2d7e4e" },
  };

  const card = {
    background: "#fff", border: "1px solid #e6eef5",
    borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    overflow: "hidden",
  };

  const cardHead = {
    padding: "14px 20px", borderBottom: "1px solid #e6eef5",
    display: "flex", alignItems: "center", gap: "10px",
  };

  const cardBody = { padding: "14px 20px" };

  return (
    <div style={{ padding: "24px", background: "#fafcfe", minHeight: "100%" }}>

      {/* METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "14px", marginBottom: "20px" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            ...card, padding: "20px", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "3px",
              background: m.accent, borderRadius: "12px 12px 0 0",
            }} />
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: m.iconBg, marginBottom: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "3px", background: m.accent, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: "11px", color: "#8fa3b1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
              {m.label}
            </div>
            <div style={{ fontSize: "30px", fontWeight: 700, color: "#1a2233", lineHeight: 1, marginBottom: "6px" }}>
              {m.value}
            </div>
            <div style={{
              fontSize: "12px", fontWeight: 500,
              color: m.trendUp === true ? "#2d7e4e" : m.trendUp === false ? "#941e1e" : "#8fa3b1",
            }}>
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* PIPELINE + CALLS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>

        {/* Leap pipeline */}
        <div style={card}>
          <div style={cardHead}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#edf7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "12px", height: "8px", background: "#2d7e4e", borderRadius: "2px", opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2233", flex: 1 }}>Leap pipeline</div>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: "#edf7ed", color: "#1e5e1e", fontWeight: 600 }}>● Live</span>
          </div>
          <div style={cardBody}>
            {pipeline.map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #eef2f6" }}>
                <div style={{ fontSize: "13px", color: "#4a5568", minWidth: "100px" }}>{p.label}</div>
                <div style={{ flex: 1, height: "5px", background: "#f2f6fa", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${p.pct}%`, height: "5px", background: p.color, borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: p.color, minWidth: "16px", textAlign: "right" }}>{p.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quo calls */}
        <div style={card}>
          <div style={cardHead}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#feecec", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#941e1e", opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2233", flex: 1 }}>Quo — calls & texts</div>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: "#edf7ed", color: "#1e5e1e", fontWeight: 600 }}>● Live</span>
          </div>
          <div style={cardBody}>
            {calls.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: i < calls.length - 1 ? "1px solid #eef2f6" : "none" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: c.type === "missed" ? "#941e1e" : "#ca992c", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a2233" }}>{c.name} — {c.number}</div>
                  <div style={{ fontSize: "11px", color: "#8fa3b1", marginTop: "1px" }}>{c.time}</div>
                </div>
                <span style={{
                  fontSize: "11px", padding: "2px 8px", borderRadius: "99px", fontWeight: 600,
                  background: c.type === "missed" ? "#feecec" : "#fdf6e3",
                  color: c.type === "missed" ? "#941e1e" : "#7a5c0e",
                }}>{c.type === "missed" ? "Missed" : "Text"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TASKS + GOALS + ANNOUNCEMENTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "14px" }}>

        {/* Tasks */}
        <div style={card}>
          <div style={cardHead}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#eef6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "12px", height: "8px", background: "#3a7ca5", borderRadius: "2px", opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2233", flex: 1 }}>Tasks due today</div>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: "#fdf6e3", color: "#7a5c0e", fontWeight: 600 }}>5 open</span>
          </div>
          <div style={cardBody}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "9px", padding: "9px 0", borderBottom: i < tasks.length - 1 ? "1px solid #eef2f6" : "none" }}>
                <div style={{
                  width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                  border: t.done ? "none" : "1.5px solid #e6eef5",
                  background: t.done ? "#2d7e4e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {t.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div style={{ flex: 1, fontSize: "13px", color: t.done ? "#8fa3b1" : "#1a2233", textDecoration: t.done ? "line-through" : "none" }}>
                  {t.text}
                </div>
                <span style={{
                  fontSize: "10px", padding: "2px 6px", borderRadius: "99px", fontWeight: 700, flexShrink: 0,
                  background: priorityColors[t.priority].bg,
                  color: priorityColors[t.priority].text,
                }}>{t.priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div style={card}>
          <div style={cardHead}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#fdf6e3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "12px", height: "12px", background: "#ca992c", borderRadius: "50%", opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2233" }}>Q2 goals</div>
          </div>
          <div style={cardBody}>
            {goals.map((g) => (
              <div key={g.name} style={{ marginBottom: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                  <div style={{ fontSize: "13px", color: "#1a2233" }}>{g.name}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: g.color }}>{g.pct}%</div>
                </div>
                <div style={{ height: "5px", background: "#f2f6fa", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${g.pct}%`, height: "5px", background: g.color, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div style={card}>
          <div style={cardHead}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "#eef6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "12px", height: "8px", background: "#1d4ed8", borderRadius: "2px", opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a2233" }}>Announcements</div>
          </div>
          <div style={cardBody}>
            {announcements.map((a, i) => (
              <div key={i} style={{ padding: "9px 0", borderBottom: i < announcements.length - 1 ? "1px solid #eef2f6" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <span style={{
                    fontSize: "10px", padding: "1px 6px", borderRadius: "99px",
                    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px",
                    background: a.tagColor, color: a.tagText,
                  }}>{a.tag}</span>
                  <span style={{ fontSize: "11px", color: "#cdd8e3" }}>{a.time}</span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2233" }}>{a.title}</div>
                <div style={{ fontSize: "11px", color: "#8fa3b1", marginTop: "2px" }}>{a.author}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}