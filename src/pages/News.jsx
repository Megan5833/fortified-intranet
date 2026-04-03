import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query, serverTimestamp
} from "firebase/firestore";

const TAGS = ["Urgent", "Update", "General"];
const TAG_STYLES = {
  Urgent: { bg: "#feecec", text: "#941e1e" },
  Update: { bg: "#eef6ff", text: "#1d4ed8" },
  General: { bg: "#f2f6fa", text: "#8fa3b1" },
};

const card = {
  background: "#fff", border: "1px solid #e6eef5",
  borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const btnHover = (bg, hoverBg) => ({
  onMouseEnter: (e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = "translateY(-1px)"; },
  onMouseLeave: (e) => { e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(0)"; },
});

export default function News() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("General");
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handlePost = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "announcements"), {
      title, body, tag,
      author: auth.currentUser?.displayName || "Unknown",
      createdAt: serverTimestamp(),
    });
    setTitle(""); setBody(""); setTag("General");
    setShowForm(false); setSaving(false);
    fetchAnnouncements();
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const now = new Date();
    const then = ts.toDate();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ padding: "24px", background: "#fafcfe", minHeight: "100%" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", color: "#8fa3b1" }}>
          {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          {...btnHover("#ca992c", "#b8881f")}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 18px", borderRadius: "10px",
            background: "#ca992c", border: "none", color: "#fff",
            fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New announcement
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, padding: "20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233", marginBottom: "16px" }}>
            New announcement
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                {...btnHover(
                  tag === t ? TAG_STYLES[t].bg : "#f2f6fa",
                  tag === t ? TAG_STYLES[t].bg : "#e6eef5"
                )}
                style={{
                  padding: "5px 14px", borderRadius: "99px", fontSize: "12px",
                  fontWeight: 600, cursor: "pointer", border: "none",
                  background: tag === t ? TAG_STYLES[t].bg : "#f2f6fa",
                  color: tag === t ? TAG_STYLES[t].text : "#8fa3b1",
                  outline: tag === t ? `2px solid ${TAG_STYLES[t].text}` : "none",
                  transition: "all 0.15s",
                }}>
                {t}
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: "8px",
              border: "1px solid #e6eef5", fontSize: "14px", color: "#1a2233",
              marginBottom: "10px", outline: "none", background: "#fafcfe",
            }}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add more detail (optional)"
            rows={3}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: "8px",
              border: "1px solid #e6eef5", fontSize: "14px", color: "#1a2233",
              marginBottom: "14px", outline: "none", background: "#fafcfe",
              resize: "vertical", fontFamily: "inherit",
            }}
          />

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowForm(false)}
              {...btnHover("#fff", "#f2f6fa")}
              style={{
                padding: "9px 18px", borderRadius: "8px", border: "1px solid #e6eef5",
                background: "#fff", fontSize: "13px", color: "#8fa3b1",
                cursor: "pointer", transition: "all 0.15s",
              }}>
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={saving || !title.trim()}
              {...btnHover("#941e1e", "#7a1818")}
              style={{
                padding: "9px 18px", borderRadius: "8px", border: "none",
                background: "#941e1e", fontSize: "13px", fontWeight: 600,
                color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving || !title.trim() ? 0.6 : 1, transition: "all 0.15s",
              }}>
              {saving ? "Posting..." : "Post announcement"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {announcements.length === 0 && (
          <div style={{ ...card, padding: "40px", textAlign: "center", color: "#8fa3b1" }}>
            <div style={{ fontSize: "15px", marginBottom: "6px" }}>No announcements yet</div>
            <div style={{ fontSize: "13px" }}>Post the first one using the button above</div>
          </div>
        )}
        {announcements.map((a) => (
          <div key={a.id} style={{ ...card, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{
                fontSize: "10px", padding: "2px 8px", borderRadius: "99px",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px",
                background: TAG_STYLES[a.tag]?.bg || "#f2f6fa",
                color: TAG_STYLES[a.tag]?.text || "#8fa3b1",
              }}>{a.tag}</span>
              <span style={{ fontSize: "12px", color: "#cdd8e3" }}>{timeAgo(a.createdAt)}</span>
              <span style={{ fontSize: "12px", color: "#8fa3b1", marginLeft: "auto" }}>{a.author}</span>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#1a2233", marginBottom: "6px" }}>
              {a.title}
            </div>
            {a.body && (
              <div style={{ fontSize: "14px", color: "#4a5568", lineHeight: 1.6 }}>{a.body}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}