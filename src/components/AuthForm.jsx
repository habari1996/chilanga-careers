import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthForm({ setTab }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setTab("dashboard");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 16px" }}>
      <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center", marginBottom: 30 }}>HR Staff Login</h2>

        <div>
          <label style={labelStyle}>Email Address</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="hr@huaxin.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={handleLogin} disabled={loading} style={primaryBtn}>
          {loading ? "Processing..." : "Login"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, color: "#64748b", fontSize: 14 }}>
          HR accounts are issued by IT. Applicants should use Apply Now, not this page.
        </p>

        {message && (
          <p style={{ marginTop: 20, textAlign: "center", color: "red" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600, color: "#374151" };
const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: 16,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontSize: "15px",
};

const primaryBtn = {
  width: "100%",
  padding: "14px",
  background: "#b45309",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontSize: "16px",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 10,
};
