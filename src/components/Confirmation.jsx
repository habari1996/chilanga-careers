import React from "react";

export default function Confirmation({ onBack, applicantName }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 20px",
      maxWidth: 620,
      margin: "0 auto"
    }}>
      {/* Success Icon */}
      <div style={{
        width: 90,
        height: 90,
        background: "#dcfce7",
        borderRadius: "9999px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px"
      }}>
        <span style={{ fontSize: "48px" }}>✅</span>
      </div>

      <h1 style={{ 
        color: "#166534", 
        marginBottom: 12,
        fontSize: "2.2rem",
        fontWeight: 700
      }}>
        Application Submitted Successfully!
      </h1>

      {applicantName && (
        <p style={{ 
          fontSize: "1.1rem", 
          color: "#374151",
          marginBottom: 24 
        }}>
          Thank you, <strong>{applicantName}</strong>.
        </p>
      )}

      <div style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "32px 28px",
        marginBottom: 32,
        textAlign: "left"
      }}>
        <p style={{ 
          fontSize: 17, 
          lineHeight: 1.7, 
          color: "#334155",
          margin: 0 
        }}>
          Your application for the <strong>Chilanga Cement Step Up Program 2026</strong> has been received.
        </p>
        <p style={{ 
          fontSize: 17, 
          lineHeight: 1.7, 
          color: "#334155",
          marginTop: 16,
          marginBottom: 0
        }}>
          Our HR team will review it and contact you via email within the next few days if you are shortlisted.
        </p>
      </div>

      <button 
        onClick={onBack} 
        style={{
          padding: "16px 48px",
          fontSize: "1.05rem",
          background: "#b45309",
          color: "white",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)"
        }}
      >
        Return to Home
      </button>

      <p style={{ 
        marginTop: 40, 
        color: "#64748b", 
        fontSize: "0.95rem" 
      }}>
        You will receive a confirmation email with your application reference shortly.
      </p>
    </div>
  );
}
