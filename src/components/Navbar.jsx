import React from "react";

export default function Navbar({ tab, setTab, session, isHR, onSignOut }) {
  return (
    <nav style={{ 
      background: "#0f172a", 
      color: "white", 
      position: "sticky", 
      top: 0, 
      zIndex: 100 
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto", 
        padding: "16px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        flexWrap: "wrap", 
        gap: 12 
      }}>
        <strong style={{ fontSize: 22 }}>Chilanga Cement PLC</strong>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button 
            onClick={() => setTab("home")} 
            style={tab === "home" ? activeBtn : ghostBtn}
          >
            Home
          </button>
          
          <button 
            onClick={() => setTab("jobs")} 
            style={ghostBtn}
          >
            Jobs
          </button>

          <button 
            onClick={() => setTab("apply")} 
            style={primaryBtn}
          >
            Apply Now
          </button>

          <button 
            onClick={() => setTab("track")} 
            style={ghostBtn}
          >
            Track Application
          </button>

          {!session && (
            <button 
              onClick={() => setTab("auth")} 
              style={ghostBtn}
            >
              HR Login
            </button>
          )}

          {session && isHR && (
            <button 
              onClick={() => setTab("dashboard")} 
              style={ghostBtn}
            >
              Dashboard
            </button>
          )}

          {session && (
            <button onClick={onSignOut} style={ghostBtn}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// Button Styles
const primaryBtn = { 
  padding: "10px 18px", 
  background: "#f59e0b", 
  color: "white", 
  border: "none", 
  borderRadius: 10, 
  cursor: "pointer", 
  fontWeight: 600 
};

const ghostBtn = { 
  padding: "10px 18px", 
  background: "transparent", 
  color: "white", 
  border: "1px solid #64748b", 
  borderRadius: 10, 
  cursor: "pointer" 
};

const activeBtn = { 
  ...ghostBtn, 
  background: "#1e2937", 
  borderColor: "#f59e0b" 
};
