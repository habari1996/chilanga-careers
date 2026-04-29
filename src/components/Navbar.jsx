import React from "react";

export default function Navbar({ tab, setTab, session, isHR, onSignOut }) {
  const btnStyle = { 
    padding: "10px 18px", 
    borderRadius: 10, 
    cursor: "pointer", 
    fontWeight: 500 
  };
  
  const primary = { ...btnStyle, background: "#f59e0b", color: "white", border: "none" };
  const ghost = { ...btnStyle, background: "transparent", color: "white", border: "1px solid #64748b" };

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
          <button onClick={() => setTab("home")} style={tab === "home" ? { ...ghost, background: "#1e2937" } : ghost}>Home</button>
          <button onClick={() => setTab("jobs")} style={ghost}>Jobs</button>
          <button onClick={() => setTab("apply")} style={primary}>Apply Now</button>

          {!session && <button onClick={() => setTab("auth")} style={ghost}>HR Login</button>}
          
          {session && isHR && <button onClick={() => setTab("dashboard")} style={ghost}>Dashboard</button>}
          
          {session && <button onClick={onSignOut} style={ghost}>Logout</button>}
        </div>
      </div>
    </nav>
  );
}
