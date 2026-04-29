import React from "react";

export default function JobList({ jobs }) {
  return (
    <div style={{ padding: "40px 0" }}>
      <h2 style={{ marginBottom: 30 }}>Open Opportunities - 2026</h2>

      {jobs.length === 0 ? (
        <p>No open positions at the moment. Please check back later.</p>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
          gap: 24 
        }}>
          {jobs.map((job) => (
            <div key={job.id} style={jobCard}>
              <h3>{job.title}</h3>
              <p><strong>Location:</strong> {job.location || "Lusaka"}</p>
              <p><strong>Department:</strong> {job.department}</p>
              <p style={{ margin: "15px 0" }}>{job.description}</p>
              
              <button 
                onClick={() => window.location.href = "#apply-section"} 
                style={applyBtn}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const jobCard = {
  background: "white",
  padding: 28,
  borderRadius: 16,
  boxShadow: "0 8px 25px rgba(0,0,0,0.07)",
  transition: "transform 0.2s",
};

const applyBtn = {
  marginTop: 16,
  padding: "12px 28px",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "1rem",
};
