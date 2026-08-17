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
      <div style={{ textAlign: "center", marginBottom: isMobile ? "28px" : "50px" }}>
        <h2 style={{ fontSize: isMobile ? "1.6rem" : "2.4rem", fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Open Job Opportunities
        </h2>
        <p style={{ fontSize: isMobile ? "1rem" : "1.15rem", color: "#475569", maxWidth: "600px", margin: "0 auto" }}>
          Join a company with purpose. Explore current roles below.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: isMobile ? "16px" : "28px",
        }}
      >
        {publishedJobs.map((job) => (
          <div key={job.id} style={{ ...jobCard, padding: isMobile ? "20px" : "32px" }}>
            <div style={jobHeader}>
              <h3 style={{ margin: 0, fontSize: isMobile ? "1.15rem" : "1.4rem", fontWeight: 600, color: "#0f172a" }}>
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
              {job.salary_range && (
                <p>
                  <strong>Salary:</strong> {job.salary_range}
                </p>
              )}
            </div>

            <p style={description}>
              {job.description
                ? job.description.substring(0, 180)
                : "Exciting opportunity to join our growing team."}
              {job.description && job.description.length > 180 ? "..." : ""}
            </p>

            {job.deadline && (
              <p style={deadline}>
                Deadline:{" "}
                {new Date(job.deadline).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            <div style={{ ...buttonGroup, flexDirection: isMobile ? "column" : "row" }}>
              <button onClick={() => setTab("apply", job.id)} style={applyBtn}>
                Apply Now
              </button>
              <button onClick={() => setSelectedJob(job)} style={detailsBtn}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <>
          <div
            onClick={() => setSelectedJob(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
          />

          <div style={{ ...modalContainer, padding: isMobile ? "12px" : "20px" }}>
            <div style={{ ...modalContent, padding: isMobile ? "20px 16px" : "36px", borderRadius: isMobile ? 14 : 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: isMobile ? "1.25rem" : "1.6rem", fontWeight: 700, color: "#0f172a" }}>
                    {selectedJob.title}
                  </h2>
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={badge}>{selectedJob.job_type || "Full-time"}</span>
                    <span style={{ ...badge, background: "#e0f2fe", color: "#0369a1" }}>
                      {selectedJob.location || "Zambia"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                    color: "#64748b",
                    lineHeight: 1,
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", color: "#475569" }}>
                  <strong>Department:</strong> {selectedJob.department || "Open (Multiple fields)"}
                </p>
                {selectedJob.experience_required && (
                  <p style={{ margin: "0 0 8px", color: "#475569" }}>
                    <strong>Experience:</strong> {selectedJob.experience_required}
                  </p>
                )}
                {selectedJob.salary_range && (
                  <p style={{ margin: "0 0 8px", color: "#475569" }}>
                    <strong>Salary:</strong> {selectedJob.salary_range}
                  </p>
                )}
                {selectedJob.deadline && (
                  <p style={{ margin: 0, color: "#475569" }}>
                    <strong>Deadline:</strong>{" "}
                    {new Date(selectedJob.deadline).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 32 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "1.05rem", color: "#0f172a" }}>
                  About the Role
                </h4>
                <p style={{ margin: 0, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {selectedJob.description || "No further details available."}
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
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
  gap: 12,
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
