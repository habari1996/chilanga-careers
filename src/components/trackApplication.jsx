import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function TrackApplication() {
  const [email, setEmail] = useState("");
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackApplication = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setApplication(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setApplication(data[0]);
      } else {
        setError("No application found with this email address.");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "60px auto", padding: "0 16px" }}>
      <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <h2>Track Your Application</h2>
        <p style={{ color: "#666", marginBottom: 30 }}>
          Enter the email address you used to submit your application
        </p>

        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "14px",
            fontSize: "16px",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            marginBottom: 20
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
            cursor: "pointer"
          }}
        >
          {loading ? "Searching..." : "Track My Application"}
        </button>

        {error && <p style={{ color: "red", marginTop: 20, fontWeight: 500 }}>{error}</p>}

        {application && (
          <div style={{ marginTop: 40, textAlign: "left", background: "#f8fafc", padding: 30, borderRadius: 12 }}>
            <h3 style={{ color: "#16a34a", marginBottom: 20 }}>✅ Application Found</h3>
            
            <p><strong>Applicant:</strong> {application.full_name}</p>
            <p><strong>Status:</strong> 
              <span style={{
                padding: "6px 16px",
                borderRadius: 30,
                marginLeft: 10,
                backgroundColor: application.status === "Hired" ? "#dcfce7" :
                                application.status === "Shortlisted" ? "#dbeafe" :
                                application.status === "Rejected" ? "#fee2e2" : "#fef3c7"
              }}>
                {application.status || "New"}
              </span>
            </p>
            <p><strong>Score:</strong> {application.score || 0}%</p>
            <p><strong>Applied On:</strong> {new Date(application.created_at).toLocaleDateString('en-GB')}</p>
            <p><strong>Qualification:</strong> {application.qualification}</p>
            <p><strong>Institution:</strong> {application.institution}</p>
            
            {application.dob && <p><strong>Date of Birth:</strong> {new Date(application.dob).toLocaleDateString('en-GB')}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
