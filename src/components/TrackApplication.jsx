import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function TrackApplication() {
  const [email, setEmail] = useState("");
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackApplication = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setApplication(null);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error: fetchError } = await supabase
        .rpc("track_application", { p_email: cleanEmail });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setApplication(data[0]);
      } else {
        setError("No application found with this email address.\n\nPlease make sure you are using the exact email you applied with.");
      }
    } catch (err) {
      console.error(err);
      setError("Error searching for application: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") trackApplication();
  };

  const statusColor = (status) => {
    if (status === "Hired") return { bg: "#dcfce7", color: "#166534" };
    if (status === "Shortlisted") return { bg: "#dbeafe", color: "#1e40af" };
    if (status === "Rejected") return { bg: "#fee2e2", color: "#b91c1c" };
    return { bg: "#fef3c7", color: "#92400e" };
  };

  return (
    <div style={{ maxWidth: 700, margin: "60px auto", padding: "0 16px" }}>
      <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <h2 style={{ marginBottom: 8 }}>Track Your Application</h2>
        <p style={{ color: "#666", marginBottom: 30 }}>
          Enter the email address you used to submit your application
        </p>

        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "14px",
            fontSize: "16px",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            marginBottom: 20,
            boxSizing: "border-box"
          }}
        />

        <button
          onClick={trackApplication}
          disabled={loading}
          style={{
            padding: "14px 40px",
            background: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Searching..." : "Track My Application"}
        </button>

        {error && (
          <p style={{ color: "#ef4444", marginTop: 20, fontWeight: 500, whiteSpace: "pre-line" }}>{error}</p>
        )}

        {application && (
          <div style={{ marginTop: 40, textAlign: "left", background: "#f8fafc", padding: 30, borderRadius: 12 }}>
            <h3 style={{ color: "#16a34a", marginBottom: 20, marginTop: 0 }}>✅ Application Found</h3>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 0", color: "#64748b", width: "40%" }}>Applicant</td>
                  <td style={{ padding: "10px 0", fontWeight: 500 }}>{application.full_name}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 0", color: "#64748b" }}>Email</td>
                  <td style={{ padding: "10px 0" }}>{application.email}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 0", color: "#64748b" }}>Status</td>
                  <td style={{ padding: "10px 0" }}>
                    <span style={{ padding: "5px 16px", borderRadius: 20, background: statusColor(application.status).bg, color: statusColor(application.status).color, fontWeight: 600, fontSize: 13 }}>
                      {application.status || "Under Review"}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 0", color: "#64748b" }}>Qualification</td>
                  <td style={{ padding: "10px 0" }}>{application.qualification || "—"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", color: "#64748b" }}>Applied On</td>
                  <td style={{ padding: "10px 0" }}>{new Date(application.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 20, padding: 16, background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", fontSize: 14, color: "#78350f" }}>
              Our HR team will contact you at this email address if shortlisted.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
