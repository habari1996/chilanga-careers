import React, { useState } from "react";
import useIsMobile from "../hooks/useIsMobile";
import { supabase } from "../supabaseClient";

export default function TrackApplication() {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setResults(null);
    if (!email.trim() || !fullName.trim()) {
      setError("Enter both the full name and email used on the application.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("track_application", {
        p_email: email.trim().toLowerCase(),
        p_full_name: fullName.trim(),
      });
      if (rpcError) throw rpcError;
      if (!data || data.length === 0) {
        setError("No matching application found. Check the name and email, then try again.");
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error(err);
      setError("Could not look up application. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: isMobile ? "16px 8px" : "24px 0" }}>
      <h2 style={{ marginTop: 0, fontSize: isMobile ? "1.35rem" : "1.75rem" }}>Track Your Application</h2>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>
        Enter the <strong>full name</strong> and <strong>email</strong> exactly as on your application.
        Only status information is shown.
      </p>
      <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        <div>
          <label htmlFor="track-name" style={labelStyle}>Full name</label>
          <input
            id="track-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="As written on the application"
            style={inputStyle}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="track-email" style={labelStyle}>Email</label>
          <input
            id="track-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            autoComplete="email"
            required
          />
        </div>
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Searching..." : "Track application"}
        </button>
      </form>
      {error && (
        <p style={{ color: "#b91c1c", marginTop: 16 }} role="alert">{error}</p>
      )}
      {results && results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {results.map((row, i) => (
            <div
              key={i}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>Status: {row.status || "—"}</div>
              {row.qualification && (
                <div style={{ color: "#475569", marginTop: 6 }}>Qualification: {row.qualification}</div>
              )}
              {row.created_at && (
                <div style={{ color: "#64748b", marginTop: 6, fontSize: "0.9rem" }}>
                  Submitted: {new Date(row.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: "1rem",
  boxSizing: "border-box",
};
const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  fontSize: "0.9rem",
  color: "#374151",
};
const btnStyle = {
  padding: "14px",
  background: "#b45309",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: "1.05rem",
  cursor: "pointer",
};
