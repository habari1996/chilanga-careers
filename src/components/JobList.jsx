import React from "react";

export default function JobList({ jobs, setTab }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <h2 style={{ fontSize: "2rem", color: "#0f172a" }}>No Open Positions Right Now</h2>
        <p style={{ color: "#64748b", marginTop: 12, fontSize: "1.1rem" }}>
          Check back later or <span onClick={() => setTab("apply")} style={{ color: "#f59e0b", cursor: "pointer", textDecoration: "underline" }}>start a general application</span>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h2 style={{ fontSize: "2.4rem", fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Open Job Opportunities
        </h2>
        <p style={{ fontSize: "1.15rem", color: "#475569", maxWidth: "600px", margin: "0 auto" }}>
          Join a company with purpose. Explore current roles below.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        gap: "28px"
      }}>
        {jobs.map((job) => (
          <div key={job.id} style={jobCard}>
            <div style={jobHeader}>
              <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600, color: "#0f172a" }}>
                {job.title}
              </h3>
              <span style={badge}>{job.job_type || "Full-time"}</span>
            </div>

            <div style={metaInfo}>
              <p><strong>Location:</strong> {job.location || "Lusaka"}</p>
              <p><strong>Department:</strong> {job.department || "Engineering"}</p>
              {job.experience_required && <p><strong>Experience:</strong> {job.experience_required}</p>}
              {job.salary_range && <p><strong>Salary:</strong> {job.salary_range}</p>}
            </div>

            <p style={description}>
              {job.description ? job.description.substring(0, 180) : "Exciting opportunity to join our growing team."}
              {job.description && job.description.length > 180 ? "..." : ""}
            </p>

            {job.deadline && (
              <p style={deadline}>
                Deadline: {new Date(job.deadline).toLocaleDateString("en-GB", { 
                  day: "numeric", month: "long", year: "numeric" 
                })}
              </p>
            )}

            <div style={buttonGroup}>
              <button
                onClick={() => setTab("apply", job.id)}
                style={applyBtn}
              >
                Apply Now
              </button>
              <button
                onClick={() => alert(job.description || "No further details available.")}
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

// ==================== PROFESSIONAL STYLES ====================
const jobCard = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "32px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
  border: "1px solid #f1f5f9",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  transition: "all 0.3s ease"
};

const jobHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "20px"
};

const badge = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "6px 14px",
  borderRadius: "9999px",
  fontSize: "0.85rem",
  fontWeight: "600",
  whiteSpace: "nowrap"
};

const metaInfo = {
  color: "#475569",
  fontSize: "0.98rem",
  lineHeight: "1.7",
  marginBottom: "20px"
};

const description = {
  color: "#334155",
  lineHeight: "1.6",
  flex: 1,
  marginBottom: "24px"
};

const deadline = {
  color: "#ef4444",
  fontSize: "0.95rem",
  marginBottom: "24px",
  fontWeight: "500"
};

const buttonGroup = {
  display: "flex",
  gap: "12px",
  marginTop: "auto"
};

const applyBtn = {
  flex: 1,
  padding: "16px",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "600",
  fontSize: "1.02rem",
  cursor: "pointer",
  transition: "all 0.3s ease"
};

const detailsBtn = {
  flex: 1,
  padding: "16px",
  background: "white",
  color: "#1e40af",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.3s ease"
};
