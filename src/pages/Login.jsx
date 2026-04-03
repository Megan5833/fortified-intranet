import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          role: "employee",
          createdAt: new Date(),
        });
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: "#0d153d",
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "40px 36px",
        width: "100%", maxWidth: "380px", display: "flex",
        flexDirection: "column", alignItems: "center", gap: "24px",
      }}>
        <img src="/logo.png" alt="Fortified Roofing & Siding"
          style={{ width: "200px", objectFit: "contain" }} />

        <div style={{ width: "100%", height: "1px", background: "#e6eef5" }} />

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#1a2233", margin: 0 }}>
            Employee Portal
          </p>
          <p style={{ fontSize: "13px", color: "#8fa3b1", marginTop: "4px", margin: "4px 0 0" }}>
            Sign in with your Fortified Google account
          </p>
        </div>

        {error && (
          <div style={{
            width: "100%", background: "#feecec", border: "1px solid #f5c1c1",
            color: "#941e1e", fontSize: "13px", borderRadius: "8px",
            padding: "10px 14px", textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "12px", padding: "13px 16px",
            borderRadius: "10px", border: "1px solid #e6eef5",
            background: "#fff", fontSize: "14px", fontWeight: 500,
            color: "#1a2233", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p style={{ fontSize: "12px", color: "#cdd8e3", margin: 0 }}>
          Fortified Roofing & Siding — Internal Use Only
        </p>
      </div>
    </div>
  );
}