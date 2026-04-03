import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

const card = {
  background: "#fff", border: "1px solid #e6eef5",
  borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const ROLES = ["owner", "admin", "manager", "employee"];
const ROLE_STYLES = {
  owner: { bg: "#0d153d", text: "#fff" },
  admin: { bg: "#1e3a5f", text: "#fff" },
  manager: { bg: "#fdf6e3", text: "#7a5c0e" },
  employee: { bg: "#f2f6fa", text: "#4a5568" },
};
const STATUS_STYLES = {
  active: { bg: "#edf7ed", text: "#1e5e1e", dot: "#2d7e4e" },
  away: { bg: "#fdf6e3", text: "#7a5c0e", dot: "#ca992c" },
  offline: { bg: "#f2f6fa", text: "#4a5568", dot: "#8fa3b1" },
};

const initials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";

const formatPhone = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const EMPTY_FORM = {
  name: "", role: "employee", email: "", workCell: "", personalCell: "",
  department: "", title: "", status: "active", birthday: "",
  shirtSize: "", favoriteCandy: "", favoriteSnack: "", favoriteColor: "",
  favoriteRestaurant: "", allergies: "",
};

const btnHover = (bg, hoverBg) => ({
  onMouseEnter: (e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.transform = "translateY(-1px)"; },
  onMouseLeave: (e) => { e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(0)"; },
});

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  border: "1px solid #e6eef5", fontSize: "13px", color: "#1a2233",
  background: "#fafcfe", outline: "none",
};

const labelStyle = {
  fontSize: "11px", color: "#8fa3b1", fontWeight: 600, marginBottom: "5px",
  textTransform: "uppercase", letterSpacing: "0.5px", display: "block",
};

const SectionLabel = ({ text }) => (
  <div style={{
    fontSize: "12px", fontWeight: 700, color: "#1e3a5f",
    textTransform: "uppercase", letterSpacing: "0.8px",
    marginBottom: "10px", marginTop: "16px",
    paddingBottom: "6px", borderBottom: "1px solid #e6eef5",
  }}>{text}</div>
);

const Row = ({ label, value }) => value ? (
  <div style={{ fontSize: "12px", display: "flex", gap: "8px" }}>
    <span style={{ color: "#8fa3b1", minWidth: "90px", flexShrink: 0 }}>{label}</span>
    <span style={{ color: "#1a2233" }}>{value}</span>
  </div>
) : null;

function GearMenu({ onEdit, onDelete, showDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "28px", height: "28px", borderRadius: "6px",
          background: open ? "#e6eef5" : "#f2f6fa",
          border: "1px solid #e6eef5", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM13.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM2.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#8fa3b1"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "32px", zIndex: 50,
          background: "#fff", border: "1px solid #e6eef5",
          borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          minWidth: "120px", overflow: "hidden",
        }}>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            style={{
              width: "100%", padding: "9px 14px", border: "none",
              background: "#fff", fontSize: "13px", color: "#1a2233",
              cursor: "pointer", textAlign: "left", display: "flex",
              alignItems: "center", gap: "8px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f2f6fa"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="#4a5568" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Edit
          </button>
          {showDelete && (
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              style={{
                width: "100%", padding: "9px 14px", border: "none",
                background: "#fff", fontSize: "13px", color: "#941e1e",
                cursor: "pointer", textAlign: "left", display: "flex",
                alignItems: "center", gap: "8px",
                borderTop: "1px solid #e6eef5",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#feecec"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M4 4V3h6v1M3 4l1 8h6l1-8" stroke="#941e1e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUid, setCurrentUid] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    all.sort((a, b) => {
      const order = { owner: 0, admin: 1, manager: 2, employee: 3 };
      return (order[a.role] ?? 4) - (order[b.role] ?? 4);
    });
    setMembers(all);
  };

  useEffect(() => {
    fetchMembers();
    const u = auth.currentUser;
    if (u) {
      setCurrentUid(u.uid);
      getDoc(doc(db, "users", u.uid)).then((snap) => {
        if (snap.exists()) setCurrentUser(snap.data());
      });
    }
  }, []);

  const isOwner = currentUser?.role === "owner";

  const canEdit = (m) => {
    // Owner can edit anyone
    // Profile owner can edit their own (only if it's their Firebase auth uid)
    return isOwner || m.id === currentUid;
  };

  const openAdd = () => {
    setEditId(null); setForm(EMPTY_FORM);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (m) => {
    setEditId(m.id);
    setForm({
      name: m.name || "", role: m.role || "employee",
      email: m.email || "", workCell: m.workCell || "",
      personalCell: m.personalCell || "", department: m.department || "",
      title: m.title || "", status: m.status || "active",
      birthday: m.birthday || "", shirtSize: m.shirtSize || "",
      favoriteCandy: m.favoriteCandy || "", favoriteSnack: m.favoriteSnack || "",
      favoriteColor: m.favoriteColor || "", favoriteRestaurant: m.favoriteRestaurant || "",
      allergies: m.allergies || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) {
      await updateDoc(doc(db, "users", editId), { ...form });
    } else {
      const id = `manual_${Date.now()}`;
      await setDoc(doc(db, "users", id), { ...form, manual: true, createdAt: new Date() });
    }
    setForm(EMPTY_FORM); setShowForm(false);
    setEditId(null); setSaving(false);
    fetchMembers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this team member?")) return;
    await deleteDoc(doc(db, "users", id));
    fetchMembers();
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = members.filter((m) =>
    [m.name, m.role, m.department, m.title].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div style={{ padding: "24px", background: "#fafcfe", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team..."
            style={{ ...inputStyle, width: "240px" }}
          />
          <div style={{ fontSize: "13px", color: "#8fa3b1" }}>
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
        {isOwner && (
          <button onClick={openAdd} {...btnHover("#ca992c", "#b8881f")} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
            borderRadius: "10px", background: "#ca992c", border: "none", color: "#fff",
            fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add team member
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ ...card, padding: "24px", marginBottom: "24px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a2233", marginBottom: "4px" }}>
            {editId ? "Edit team member" : "Add team member"}
          </div>
          <div style={{ fontSize: "13px", color: "#8fa3b1", marginBottom: "4px" }}>
            Fill in what you know — everything can be updated later
          </div>

          <SectionLabel text="Basic info" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={labelStyle}>Full name *</label><input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Jonathan Cooper" style={inputStyle} /></div>
            <div><label style={labelStyle}>Job title</label><input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Crew Lead, Sales Rep..." style={inputStyle} /></div>
            <div><label style={labelStyle}>Department</label><input value={form.department} onChange={(e) => setField("department", e.target.value)} placeholder="Production, Sales..." style={inputStyle} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={(e) => setField("role", e.target.value)} style={inputStyle} disabled={!isOwner}>
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={inputStyle}>
                <option value="active">Active</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div><label style={labelStyle}>Birthday</label><input type="date" value={form.birthday} onChange={(e) => setField("birthday", e.target.value)} style={inputStyle} /></div>
          </div>

          <SectionLabel text="Contact" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={labelStyle}>Email</label><input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="jonathan@fortifiedroofs.com" style={inputStyle} /></div>
            <div><label style={labelStyle}>Work cell</label><input value={form.workCell} onChange={(e) => setField("workCell", formatPhone(e.target.value))} placeholder="(573) 555-0100" style={inputStyle} /></div>
            <div><label style={labelStyle}>Personal cell</label><input value={form.personalCell} onChange={(e) => setField("personalCell", formatPhone(e.target.value))} placeholder="(573) 555-0101" style={inputStyle} /></div>
          </div>

          <SectionLabel text="Getting to know you" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={labelStyle}>Shirt size</label>
              <select value={form.shirtSize} onChange={(e) => setField("shirtSize", e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                {["XS","S","M","L","XL","2XL","3XL"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Favorite candy</label><input value={form.favoriteCandy} onChange={(e) => setField("favoriteCandy", e.target.value)} placeholder="Reese's..." style={inputStyle} /></div>
            <div><label style={labelStyle}>Favorite snack</label><input value={form.favoriteSnack} onChange={(e) => setField("favoriteSnack", e.target.value)} placeholder="Chips, fruit..." style={inputStyle} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={labelStyle}>Favorite color</label><input value={form.favoriteColor} onChange={(e) => setField("favoriteColor", e.target.value)} placeholder="Black, blue..." style={inputStyle} /></div>
            <div><label style={labelStyle}>Favorite restaurant</label><input value={form.favoriteRestaurant} onChange={(e) => setField("favoriteRestaurant", e.target.value)} placeholder="Texas Roadhouse..." style={inputStyle} /></div>
            <div><label style={labelStyle}>Allergies</label><input value={form.allergies} onChange={(e) => setField("allergies", e.target.value)} placeholder="None, peanuts..." style={inputStyle} /></div>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
            <button onClick={() => { setShowForm(false); setEditId(null); }} {...btnHover("#fff", "#f2f6fa")} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e6eef5", background: "#fff", fontSize: "13px", color: "#8fa3b1", cursor: "pointer", transition: "all 0.15s" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} {...btnHover("#ca992c", "#b8881f")} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "#ca992c", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving || !form.name.trim() ? 0.6 : 1, transition: "all 0.15s" }}>
              {saving ? "Saving..." : editId ? "Save changes" : "Add member"}
            </button>
          </div>
        </div>
      )}

      {/* Team grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "12px" }}>
        {filtered.map((m) => {
          const roleStyle = ROLE_STYLES[m.role] || ROLE_STYLES.employee;
          const statusStyle = STATUS_STYLES[m.status || "active"];
          const expanded = expandedId === m.id;
          const canEditThis = canEdit(m);

          return (
            <div key={m.id} style={{ ...card, padding: "20px" }}>

              {/* Avatar + name + gear */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
                  background: m.role === "owner" ? "#0d153d" : m.role === "admin" ? "#1e3a5f" : "#e8f4fb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", fontWeight: 700,
                  color: m.role === "owner" || m.role === "admin" ? "#ca992c" : "#3a7ca5",
                  overflow: "hidden",
                }}>
                  {m.photo
                    ? <img src={m.photo} alt={m.name} style={{ width: "48px", height: "48px", objectFit: "cover" }} />
                    : initials(m.name)
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233", marginBottom: "3px" }}>{m.name || "Unknown"}</div>
                  {m.title && <div style={{ fontSize: "12px", color: "#8fa3b1", marginBottom: "4px" }}>{m.title}</div>}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: 700, background: roleStyle.bg, color: roleStyle.text, textTransform: "capitalize" }}>{m.role}</span>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: 600, background: statusStyle.bg, color: statusStyle.text, display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusStyle.dot, display: "inline-block" }} />
                      {m.status || "active"}
                    </span>
                  </div>
                </div>
                {/* Gear menu — only visible if can edit */}
                {canEditThis && (
                  <GearMenu
                    onEdit={() => openEdit(m)}
                    onDelete={() => handleDelete(m.id)}
                    showDelete={isOwner && m.manual}
                  />
                )}
              </div>

              {/* Contact details */}
              <div style={{ borderTop: "1px solid #e6eef5", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <Row label="Email" value={m.email} />
                <Row label="Work cell" value={m.workCell} />
                {isOwner && <Row label="Personal" value={m.personalCell} />}
                <Row label="Department" value={m.department} />

                {expanded && (
                  <>
                    <Row label="Birthday" value={m.birthday} />
                    <Row label="Shirt size" value={m.shirtSize} />
                    {isOwner && (
                      <>
                        <Row label="Fav candy" value={m.favoriteCandy} />
                        <Row label="Fav snack" value={m.favoriteSnack} />
                        <Row label="Fav color" value={m.favoriteColor} />
                        <Row label="Fav restaurant" value={m.favoriteRestaurant} />
                        <Row label="Allergies" value={m.allergies} />
                      </>
                    )}
                  </>
                )}
              </div>

              {/* More info toggle */}
              <div style={{ borderTop: "1px solid #e6eef5", paddingTop: "10px", marginTop: "10px" }}>
                <button
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                  {...btnHover("#f2f6fa", "#e6eef5")}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e6eef5", background: "#f2f6fa", fontSize: "11px", color: "#4a5568", cursor: "pointer", transition: "all 0.15s" }}>
                  {expanded ? "Show less" : "Show more"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}