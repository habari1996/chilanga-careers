import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AuthForm({ setTab }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) setMessage(error.message);
    else setTab("dashboard");
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);
    
    if (error) setMessage(error.message);
    else setMessage("Account created! Please check your email to confirm.");
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <div style={{ background: "white", padding: 32, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h2>{mode === "login" ? "HR Staff Login" : "Create HR Account"}</h2>

        {mode === "signup" && (
          <input 
            placeholder="Full Name" 
            style={inputStyle} 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
          />
        )}
        
        <input 
          placeholder="Email Address" 
          type="email" 
          style={inputStyle} 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        
        <input 
          placeholder="Password" 
          type="password" 
          style={inputStyle} 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />

        <button 
          onClick={mode === "login" ? handleLogin : handleSignUp} 
          disabled={loading}
          style={primaryBtn}
        >
          {loading ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
        </button>

        <button 
          onClick={() => setMode(mode === "login" ? "signup" : "login")} 
          style={{ marginTop: 15, background: "none", border: "none", color: "#f59e0b", cursor: "pointer" }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>

        {message && <p style={{ marginTop: 15, color: message.includes("created") ? "green" : "red" }}>{message}</p>}
      </div>
    </div>
  );
}

const inputStyle = { 
  width: "100%", 
  padding: "12px", 
  marginBottom: 12, 
  border: "1px solid #cbd5e1", 
  borderRadius: 10 
};

const primaryBtn = { 
  width: "100%", 
  padding: "14px", 
  background: "#f59e0b", 
  color: "white", 
  border: "none", 
  borderRadius: 10, 
  fontWeight: 600, 
  cursor: "pointer" 
};
