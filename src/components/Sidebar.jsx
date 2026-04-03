import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

const SIDEBAR = "#1e3a5f";
const GOLD = "#ca992c";

const Icon = ({ d, d2, circle, rect, rects }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
    {circle && <circle cx={circle.cx} cy={circle.cy} r={circle.r} stroke="currentColor" strokeWidth="1.3" />}
    {rects && rects.map((r, i) => <rect key={i} {...r} stroke="currentColor" strokeWidth="1.2" />)}
    {rect && <rect {...rect} stroke="currentColor" strokeWidth="1.2" />}
    {d && <path d={d} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />}
    {d2 && <path d={d2} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const nav = [
  {
    section: "My Fortified",
    items: [
      { label: "My profile", path: "/profile", icon: { circle: { cx: 8, cy: 6, r: 3 }, d: "M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" } },
      { label: "My performance", path: "/my-performance", icon: { d: "M2 12l3-4 3 2 3-5 3 3" } },
      { label: "My goals", path: "/my-goals", icon: { d: "M8 2l1.5 3 3.5.5-2.5 2.4.6 3.6L8 10l-3.1 1.5.6-3.6L3 5.5l3.5-.5L8 2z" } },
      { label: "My compensation", path: "/my-compensation", icon: { rect: { x: 3, y: 2, width: 10, height: 12, rx: 2 }, d: "M6 6h4M6 9h2" } },
      { label: "My time off", path: "/my-timeoff", icon: { circle: { cx: 8, cy: 8, r: 5.5 }, d: "M8 5v3l2 1.5" } },
    ],
  },
  {
    section: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: { rects: [{ x: 2, y: 2, width: 5, height: 5, rx: 1.5 }, { x: 9, y: 2, width: 5, height: 5, rx: 1.5 }, { x: 2, y: 9, width: 5, height: 5, rx: 1.5 }, { x: 9, y: 9, width: 5, height: 5, rx: 1.5 }] } },
      { label: "News & announcements", path: "/news", badge: "2", badgeColor: "red", icon: { d: "M2 4h12M2 8h9M2 12h6" } },
      { label: "Tasks & meetings", path: "/tasks", badge: "5", badgeColor: "gold", icon: { d: "M3 4h10M3 8h7M3 12h5" } },
      { label: "Calendar", path: "/calendar", icon: { rect: { x: 2, y: 3, width: 12, height: 11, rx: 2 }, d: "M5 2v2M11 2v2M2 7h12" } },
    ],
  },
  {
    section: "Business",
    items: [
      { label: "Sales", path: "/sales", icon: { d: "M2 12l3-4 3 2 3-5 3 3" } },
      { label: "Finance", path: "/finance", icon: { circle: { cx: 8, cy: 8, r: 5.5 }, d: "M8 5.5v2.5l2 1" } },
      { label: "Production", path: "/production", icon: { rects: [{ x: 2, y: 7, width: 3, height: 7, rx: 1 }, { x: 6.5, y: 4, width: 3, height: 10, rx: 1 }, { x: 11, y: 2, width: 3, height: 12, rx: 1 }] } },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Team directory", path: "/team", icon: { d: "M2 6a3 3 0 016 0M8 6a3 3 0 016 0M1 13.5c0-2.5 2-4 4-4M8 13.5c0-2.5 2-4 4-4" } },
      { label: "Accountability chart", path: "/accountability", icon: { d: "M8 2v4M8 6H5M8 6h3M5 6v4M11 6v4", rects: [{ x: 3, y: 10, width: 4, height: 3, rx: 1 }, { x: 9, y: 10, width: 4, height: 3, rx: 1 }, { x: 6, y: 1, width: 4, height: 3, rx: 1 }] } },
      { label: "Performance & KPIs", path: "/performance", icon: { d: "M2 12l3-4 3 2 3-5 3 3" } },
      { label: "1:1s & reviews", path: "/reviews", icon: { d: "M2 4h12v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM5 8h6M5 10h3" } },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "AI tools hub", path: "/tools", icon: { d: "M3 8h2l2-5 2 10 2-5h2" } },
      { label: "Ask Fortified AI", path: "/assistant", icon: { circle: { cx: 8, cy: 8, r: 6 }, d: "M5.5 8.5C5.5 7 6.5 6 8 6s2.5 1 2.5 2.5-1 2.5-2.5 2.5M8 11v.5" } },
      { label: "Inventory", path: "/inventory", icon: { d: "M4 13V7l4-5 4 5v6H4z", rect: { x: 6, y: 10, width: 4, height: 3, rx: 0.5 } } },
      { label: "Tickets", path: "/tickets", icon: { circle: { cx: 8, cy: 8, r: 6 }, d: "M8 5v3M8 10v.5" } },
    ],
  },
  {
    section: "Company",
    items: [
      { label: "HR", path: "/hr", icon: { circle: { cx: 8, cy: 6, r: 3 }, d: "M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" } },
      { label: "Training", path: "/training", icon: { rect: { x: 2, y: 3, width: 12, height: 10, rx: 2 }, d: "M5 9h6M5 11h3" } },
      { label: "Knowledge hub", path: "/knowledge", icon: { d: "M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4" } },
      { label: "Strategy", path: "/strategy", icon: { d: "M8 2l1.2 2.5 2.8.4-2 1.9.5 2.8L8 8.3 5.5 9.6l.5-2.8-2-1.9 2.8-.4L8 2zM4 12h8M6 14h4" } },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState({
    "My Fortified": true, Main: true, Business: true,
    People: true, Tools: true, Company: true,
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      getDoc(doc(db, "users", u.uid)).then((snap) => {
        if (snap.exists()) setUser(snap.data());
      });
    }
  }, []);

  const toggle = (section) =>
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }));

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div style={{
      width: "240px", background: SIDEBAR, display: "flex",
      flexDirection: "column", height: "100vh", flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        padding: "16px 14px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <img
            src="/white.png"
          alt="Fortified Roofing & Siding"
          style={{ height: "56px", objectFit: "contain", objectPosition: "center" }}
        />
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0 14px" }}>
        {nav.map(({ section, items }) => (
          <div key={section}>
            <button
              onClick={() => toggle(section)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "14px 14px 3px",
                background: "none", border: "none", cursor: "pointer",
              }}>
              <span style={{
                fontSize: "11px", color: "rgba(255,255,255,0.38)",
                letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600,
              }}>
                {section}
              </span>
              <span style={{
                fontSize: "10px", color: "rgba(255,255,255,0.2)",
                transform: open[section] ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.18s", display: "inline-block",
              }}>▾</span>
            </button>

            {open[section] && items.map((item) => {
              const active = location.pathname === item.path;
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: "9px",
                    padding: "10px 12px", margin: "0 6px",
                    fontSize: "14px", borderRadius: "7px", cursor: "pointer",
                    borderLeft: `2px solid ${active ? GOLD : "transparent"}`,
                    color: active ? "#fff" : "rgba(255,255,255,0.6)",
                    background: active ? "rgba(202,153,44,0.14)" : "transparent",
                    transition: "all 0.1s",
                  }}>
                  <Icon {...item.icon} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      fontSize: "11px", padding: "1px 6px", borderRadius: "99px",
                      fontWeight: 700, lineHeight: 1.5,
                      background: item.badgeColor === "red" ? "#941e1e" : "#ca992c",
                      color: "#fff",
                    }}>{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User + sign out */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(202,153,44,0.22)", border: "1.5px solid rgba(202,153,44,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: GOLD, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.82)" }}>
              {user?.name || "Loading..."}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "capitalize" }}>
              {user?.role || ""}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%", padding: "8px", borderRadius: "6px",
            background: "rgba(255,255,255,0.05)", border: "none",
            color: "rgba(255,255,255,0.3)", fontSize: "13px", cursor: "pointer",
          }}>
          Sign out
        </button>
      </div>
    </div>
  );
}