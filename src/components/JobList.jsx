import React from "react";

export default function JobList({ jobs }) {
  return (
    <div style={{ padding: "40px 0" }}>
      <h2 style={{ marginBottom: 30, textAlign: "center" }}>Open Positions - Step Up Program 2026</h2>

      {jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "18px", color: "#666" }}>No open positions at the moment.</p>
          <p style={{ color: "#888" }}>Please check back later or contact HR.</p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
          gap: 24 
        }}>
          {jobs.map((job) => (
            <div key={job.id} style={jobCard}>
              <h3 style={{ marginBottom: 12 }}>{job.title}</h3>
              
              <p><strong>Location:</strong> {job.location || "Lusaka"}</p>
              <p><strong>Department:</strong> {job.department || "General"}</p>
              
              <p style={{ margin: "16px 0", lineHeight: 1.6 }}>
                {job.description?.length > 180 
                  ? job.description.substring(0, 180) + "..." 
                  : job.description}
              </p>

              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
  transition: "transform 0.2s, box-shadow 0.2s",
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
  width: "100%"
};
