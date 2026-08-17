import React, { useState } from "react";
import useIsMobile from "../hooks/useIsMobile";

export default function JobList({ jobs, setTab }) {
  const isMobile = useIsMobile();
  const [selectedJob, setSelectedJob] = useState(null);

  // Only show Published jobs on the public page
  const publishedJobs = (jobs || []).filter(
    (job) => job.status === "Published" || !job.status
  );

  if (!publishedJobs || publishedJobs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: isMobile ? "48px 16px" : "100px 20px" }}>
        <h2 style={{ fontSize: isMobile ? "1.4rem" : "2rem", color: "#0f172a" }}>No Open Positions Right Now</h2>
        <p style={{ color: "#64748b", marginTop: 12, fontSize: "1.1rem" }}>
          Check back later or{" "}
          <span
            onClick={() => setTab("apply")}
            style={{ color: "#b45309", cursor: "pointer", textDecoration: "underline" }}
          >
            start a general application
          </span>
          .
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h2 style={{ fontSize: isMobile ? "1.6rem" : "2.4rem", fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Open Job Opportunities
        </h2>
        <p style={{ fontSize: "1.15rem", color: "#475569", maxWidth: "600px", margin: "0 auto" }}>
          Join a company with purpose. Explore current roles below.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "28px",
        }}
      >
        {publishedJobs.map((job) => (
          <div key={job.id} style={jobCard}>
            <div style={jobHeader}>
              <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600, color: "#0f172a" }}>
                {job.title}
              </h3>
              <span style={badge}>{job.job_type || "Full-time"}</span>
            </div>

            <div style={metaInfo}>
              <p>
                <strong>Location:</strong> {job.location || "Zambia"}
              </p>
              <p>
                <strong>Department:</strong>{" "}
                {job.department || "Open (Multiple fields)"}
              </p>
              {job.experience_required && (
                <p>
                  <strong>Experience:</strong> {job.experience_required}
                </p>
              )}
            </div>

            <p style={description}>
              {(job.description || "").length > 160
                ? (job.description || "").slice(0, 160) + "…"
                : job.description || "No description provided."}
            </p>

            {job.deadline && (
              <p style={deadline}>
                Closing: {new Date(job.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
                onClick={() => setSelectedJob(job)}
                style={detailsBtn}
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.55)",
              zIndex: 1000,
            }}
            onClick={() => setSelectedJob(null)}
          />
          <div style={modalContainer}>
            <div
              style={{
                ...modalContent,
                padding: isMobile ? "24px 16px" : "36px",
                margin: isMobile ? "12px" : undefined,
                maxWidth: isMobile ? "100%" : "640px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: isMobile ? "1.25rem" : "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                  {selectedJob.title}
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b", lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ color: "#475569", fontSize: "0.98rem", lineHeight: 1.7, marginBottom: 20 }}>
                <p><strong>Location:</strong> {selectedJob.location || "Zambia"}</p>
                <p><strong>Department:</strong> {selectedJob.department || "Open (Multiple fields)"}</p>
                <p><strong>Type:</strong> {selectedJob.job_type || "Full-time"}</p>
                {selectedJob.deadline && (
                  <p><strong>Deadline:</strong> {new Date(selectedJob.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                )}
              </div>
              <div style={{ color: "#334155", lineHeight: 1.65, marginBottom: 28, whiteSpace: "pre-wrap" }}>
                {selectedJob.description || "No description provided."}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setTab("apply", selectedJob.id);
                  }}
                  style={{ ...applyBtn, flex: 1 }}
                >
                  Apply Now
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{ ...detailsBtn, flex: 1 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== STYLES ====================
const jobCard = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "32px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
  border: "1px solid #f1f5f9",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  transition: "all 0.3s ease",
};

const jobHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "20px",
};

const badge = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "6px 14px",
  borderRadius: "9999px",
  fontSize: "0.85rem",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const metaInfo = {
  color: "#475569",
  fontSize: "0.98rem",
  lineHeight: "1.7",
  marginBottom: "20px",
};

const description = {
  color: "#334155",
  lineHeight: "1.6",
  flex: 1,
  marginBottom: "24px",
};

const deadline = {
  color: "#ef4444",
  fontSize: "0.95rem",
  marginBottom: "24px",
  fontWeight: "500",
};

const buttonGroup = {
  display: "flex",
  gap: "12px",
  marginTop: "auto",
};

const applyBtn = {
  flex: 1,
  padding: "16px",
  background: "#b45309",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "600",
  fontSize: "1.02rem",
  cursor: "pointer",
  transition: "all 0.3s ease",
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
  transition: "all 0.3s ease",
};

const modalContainer = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1001,
  padding: "20px",
};

const modalContent = {
  background: "white",
  borderRadius: "20px",
  padding: "36px",
  width: "100%",
  maxWidth: "640px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};
