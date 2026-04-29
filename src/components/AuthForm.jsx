import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

export default function AuthForm({ setTab }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setTab("dashboard");
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) setMessage(error.message);
    else setMessage("Account created! Please check your email.");
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <div style={{ background: "white", padding: 32, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h2>{mode === "login" ? "HR Staff Login" : "Create HR Account"}</h2>

        {mode === "signup" && (
          <input placeholder="Full Name" style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        )}
        <input placeholder="Email" type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" style={input} value={password} onChange={(e) => setPassword(e.target.value)} />

        <button onClick={mode === "login" ? handleLogin : handleSignUp} style={primaryBtn}>
          {mode === "login" ? "Login" : "Create Account"}
        </button>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ marginTop: 15, background: "none", border: "none", color: "#f59e0b", cursor: "pointer" }}>
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>

        {message && <p style={{ marginTop: 15, color: message.includes("success") || message.includes("created") ? "green" : "red" }}>{message}</p>}
      </div>
    </div>
  );
}

const input = { width: "100%", padding: "12px", marginBottom: 12, border: "1px solid #cbd5e1", borderRadius: 10 };
const primaryBtn = { width: "100%", padding: "12px", background: "#f59e0b", color: "white", border: "none", borderRadius: 10, fontWeight: 600 };
