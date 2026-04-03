import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/news": "Announcements",
  "/tasks": "Tasks & Meetings",
  "/calendar": "Calendar",
  "/sales": "Sales",
  "/finance": "Finance",
  "/production": "Production",
  "/team": "Team directory",
  "/accountability": "Org chart",
  "/performance": "Performance & KPIs",
  "/reviews": "1:1s & reviews",
  "/tools": "AI tools",
  "/assistant": "Ask Fortified",
  "/inventory": "Inventory",
  "/tickets": "Tickets",
  "/hr": "HR",
  "/training": "Training",
  "/knowledge": "Knowledge hub",
  "/strategy": "Strategy",
  "/profile": "My profile",
  "/my-performance": "My performance",
  "/my-goals": "My goals",
  "/my-compensation": "My compensation",
  "/my-timeoff": "My time off",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      getDoc(doc(db, "users", u.uid)).then((snap) => {
        if (snap.exists()) setUser(snap.data());
      });
    }
  }, []);

  const firstName = user?.name?.split(" ")[0] || "";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";
  const pageTitle = pageTitles[location.pathname] || "Fortified";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fafcfe" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Sticky topbar */}
        <div style={{
          height: "60px", background: "#fff",
          borderBottom: "1px solid #e6eef5",
          display: "flex", alignItems: "center",
          padding: "0 28px", gap: "16px",
          flexShrink: 0, position: "sticky", top: 0, zIndex: 100,
        }}>
          {/* Left — page title + greeting */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "19px", fontWeight: 700, color: "#1a2233", lineHeight: 1.2 }}>
              {pageTitle}
            </div>
            <div style={{ fontSize: "12px", color: "#8fa3b1", marginTop: "1px" }}>
              {today} · {getGreeting()}{firstName ? `, ${firstName}` : ""}
            </div>
          </div>

          {/* Right — search, bell, user */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

            {/* Search */}
            <button style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "#f2f6fa", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="#8fa3b1" strokeWidth="1.3" />
                <path d="M10.5 10.5l3 3" stroke="#8fa3b1" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>

            {/* Notification bell */}
            <button style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "#f2f6fa", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
            }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#941e1e", position: "absolute",
                top: "7px", right: "7px", border: "2px solid #fff",
              }} />
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C5.8 2 4 3.8 4 6v3L3 11h10l-1-2V6c0-2.2-1.8-4-4-4z" stroke="#8fa3b1" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M6.5 11.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" stroke="#8fa3b1" strokeWidth="1.2" />
              </svg>
            </button>

            {/* User chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "5px 12px 5px 5px", borderRadius: "99px",
              background: "#f2f6fa", cursor: "pointer",
            }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%",
                background: "#1e3a5f", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff",
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a2233", lineHeight: 1.2 }}>
                  {user?.name || ""}
                </div>
                <span style={{
                  fontSize: "10px", padding: "1px 6px", borderRadius: "99px",
                  background: "#fdf6e3", color: "#7a5c0e", fontWeight: 600,
                  textTransform: "capitalize",
                }}>
                  {user?.role || ""}
                </span>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5l3 3 3-3" stroke="#8fa3b1" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}