import React from "react";

export default function Confirmation({ onBack }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "100px 20px",
      maxWidth: 600,
      margin: "0 auto"
    }}>
      <div style={{ fontSize: 100, marginBottom: 20 }}>🎉</div>
      
      <h1 style={{ 
        color: "#16a34a", 
        marginBottom: 16,
        fontSize: "2.5rem"
      }}>
        Application Submitted Successfully!
      </h1>
      
      <p style={{ 
        fontSize: 18, 
        lineHeight: 1.7, 
        color: "#374151",
        marginBottom: 30 
      }}>
        Thank you for applying to the <strong>Chilanga Cement Step Up Program 2026</strong>.<br /><br />
        Your application has been received and is under review.<br />
        Our HR team will contact you via email within the next few days.
      </p>

      <div style={{ marginTop: 40 }}>
        <button 
          onClick={onBack} 
          style={primaryBtn}
        >
          Return to Home
        </button>
      </div>

      <p style={{ marginTop: 50, color: "#888", fontSize: "15px" }}>
        Application ID will be sent to your email shortly.
      </p>
    </div>
  );
}

const primaryBtn = {
  padding: "14px 36px",
  fontSize: "1.1rem",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 600,
};
