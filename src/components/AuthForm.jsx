import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthForm({ setTab }) {
  const [mode, setMode] = useState("login"); // login or signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setTab("dashboard");
    }
  };

  const handleSignUp = async () => {
    if (!fullName) {
      setMessage("Full name is required");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created successfully! You can now login.");
      setMode("login");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 16px" }}>
      <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center", marginBottom: 30 }}>
          {mode === "login" ? "HR Staff Login" : "Create HR Account"}
        </h2>

        {mode === "signup" && (
          <div>
            <label style={labelStyle}>Full Name</label>
            <input 
              style={inputStyle} 
              placeholder="Full Name" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>Email Address</label>
          <input 
            style={inputStyle} 
            type="email" 
            placeholder="hr@company.com" 
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

        <button 
          onClick={mode === "login" ? handleLogin : handleSignUp} 
          disabled={loading}
          style={primaryBtn}
        >
          {loading ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button 
            onClick={() => setMode(mode === "login" ? "signup" : "login")} 
            style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "15px" }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>

        {message && (
          <p style={{ 
            marginTop: 20, 
            textAlign: "center",
            color: message.includes("success") || message.includes("created") ? "green" : "red" 
          }}>
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
  fontSize: "15px" 
};

const primaryBtn = { 
  width: "100%", 
  padding: "14px", 
  background: "#f59e0b", 
  color: "white", 
  border: "none", 
  borderRadius: 10, 
  fontSize: "16px", 
  fontWeight: 600, 
  cursor: "pointer",
  marginTop: 10
};
