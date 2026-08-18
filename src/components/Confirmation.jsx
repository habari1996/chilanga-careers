import React from "react";

export default function Confirmation({ onBack }) {
  return (
    <div style={{
      maxWidth: 640,
      margin: "40px auto",
      padding: "0 16px",
      textAlign: "center"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: "48px 40px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)"
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 36
        }}>
          ✓
        </div>

        <h2 style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 12
        }}>
          Application Submitted
        </h2>

        <div style={{
          textAlign: "left"
        }}>
          <p style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: "#334155",
            margin: 0
          }}>
            Your application to <strong>Chilanga Cement PLC</strong> has been received.
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
            marginTop: 32,
            padding: "14px 28px",
            background: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
