import React from "react";

export default function JobList({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2>No Open Positions Right Now</h2>
        <p style={{ color: "#64748b", marginTop: 12 }}>Check back later for new opportunities.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "32px", textAlign: "center" }}>Open Job Positions</h2>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
        gap: "24px" 
      }}>
        {jobs.map((job) => (
          <div key={job.id} style={jobCard}>
            <div style={jobHeader}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.35rem" }}>{job.title}</h3>
              <span style={badge}>{job.job_type || "Full-time"}</span>
            </div>

            <div style={{ marginBottom: 16, color: "#475569", fontSize: "0.95rem" }}>
              <p><strong>Location:</strong> {job.location || "Lusaka"}</p>
              <p><strong>Department:</strong> {job.department}</p>
              {job.experience_required && <p><strong>Experience:</strong> {job.experience_required}</p>}
              {job.salary_range && <p><strong>Salary:</strong> {job.salary_range}</p>}
            </div>

            <p style={{ marginBottom: 16, lineHeight: "1.5", color: "#334155" }}>
              {job.description?.substring(0, 180)}...
            </p>

            {job.deadline && (
              <p style={{ fontSize: "0.9rem", color: "#ef4444", marginBottom: 16 }}>
                Deadline: {new Date(job.deadline).toLocaleDateString()}
              </p>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => window.open(`/apply?job=${job.id}`, "_blank")}
                style={applyBtn}
              >
                Apply Now
              </button>
              <button 
                onClick={() => alert("Job details coming soon...")}
                style={detailsBtn}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Card Styles
const jobCard = {
  background: "#fff",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
  transition: "transform 0.2s",
  height: "100%",
  display: "flex",
  flexDirection: "column"
};

const jobHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px"
};

const badge = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "0.85rem",
  fontWeight: "600"
};

const applyBtn = {
  flex: 1,
  padding: "14px",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "600",
  cursor: "pointer"
};

const detailsBtn = {
  flex: 1,
  padding: "14px",
  background: "#fff",
  color: "#1e40af",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  fontWeight: "600",
  cursor: "pointer"
};
