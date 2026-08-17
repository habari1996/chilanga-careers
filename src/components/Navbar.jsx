import React from "react";
import useIsMobile from "../hooks/useIsMobile";

export default function Navbar({ tab, setTab, session, isHR, onSignOut }) {
  const isMobile = useIsMobile();

  const primaryBtn = {
    padding: isMobile ? "8px 12px" : "10px 18px",
    background: "#b45309",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: isMobile ? "0.85rem" : undefined,
    whiteSpace: "nowrap",
  };

  const ghostBtn = {
    padding: isMobile ? "8px 12px" : "10px 18px",
    background: "transparent",
    color: "white",
    border: "1px solid #64748b",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: isMobile ? "0.85rem" : undefined,
    whiteSpace: "nowrap",
  };

  const activeBtn = {
    ...ghostBtn,
    background: "#1e2937",
    borderColor: "#b45309",
  };

  return (
    <nav
      style={{
        background: "#0f172a",
        color: "white",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "12px" : "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexWrap: "wrap",
          gap: isMobile ? 10 : 12,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <strong style={{ fontSize: isMobile ? 18 : 22 }}>Chilanga Cement PLC</strong>

        <div
          style={{
            display: "flex",
            gap: isMobile ? 8 : 10,
            flexWrap: "wrap",
            width: isMobile ? "100%" : undefined,
          }}
        >
          <button onClick={() => setTab("home")} style={tab === "home" ? activeBtn : ghostBtn}>
            Home
          </button>
          <button onClick={() => setTab("jobs")} style={ghostBtn}>
            Jobs
          </button>
          <button onClick={() => setTab("apply")} style={primaryBtn}>
            Apply Now
          </button>
          <button onClick={() => setTab("track")} style={ghostBtn}>
            Track Application
          </button>
          {!session && (
            <button onClick={() => setTab("auth")} style={ghostBtn}>
              HR Login
            </button>
          )}
          {session && isHR && (
            <button onClick={() => setTab("dashboard")} style={ghostBtn}>
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
