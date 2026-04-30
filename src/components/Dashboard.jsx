import React, { useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ apps, refreshData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  // Post New Job Modal State (keep your existing)
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ /* your job fields */ });
  const [postingJob, setPostingJob] = useState(false);

  const filteredApps = useMemo(() => { /* your filter logic */ }, [apps, search, statusFilter]);

  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);

  const updateStatus = async (id, newStatus) => { /* your existing function */ };

  return (
    <div>
      {/* Header, Filters, Cards - same as before */}

      {/* Applicant Detail Sidebar with Resume Viewer */}
      {selectedApplicant && (
        <div style={sidebarStyle}>
          <button onClick={() => setSelectedApplicant(null)} style={closeBtn}>✕</button>
          
          <h3>{selectedApplicant.full_name}</h3>
          <p><strong>Email:</strong> {selectedApplicant.email}</p>
          <p><strong>Phone:</strong> {selectedApplicant.phone}</p>
          <p><strong>Score:</strong> {selectedApplicant.score || 0}%</p>
          <p><strong>Status:</strong> {selectedApplicant.status || "New"}</p>

          {/* Resume / CV Viewer */}
          {selectedApplicant.cv_url ? (
            <div style={{ margin: "24px 0" }}>
              <h4>📄 Resume / CV</h4>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", height: "420px", background: "#f8fafc" }}>
                <iframe
                  src={selectedApplicant.cv_url}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Applicant CV"
                />
              </div>
              <a 
                href={selectedApplicant.cv_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: "block", textAlign: "center", marginTop: "12px", color: "#3b82f6" }}
              >
                Open CV in New Tab ↓
              </a>
            </div>
          ) : (
            <p style={{ color: "#ef4444", fontStyle: "italic" }}>No CV uploaded by this applicant.</p>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")} style={shortlistBtn}>Shortlist Candidate</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Hired")} style={hireBtn}>Hire Candidate</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Rejected")} style={rejectBtn}>Reject Candidate</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const sidebarStyle = {
  position: "fixed",
  top: "90px",
  right: "20px",
  width: "420px",
  background: "white",
  padding: "24px",
  borderRadius: "16px",
  boxShadow: "0 15px 50px rgba(0,0,0,0.2)",
  zIndex: 1000,
  maxHeight: "85vh",
  overflowY: "auto"
};

const closeBtn = { 
  position: "absolute", 
  top: "16px", 
  right: "16px", 
  fontSize: "24px", 
  background: "none", 
  border: "none", 
  cursor: "pointer" 
};

const shortlistBtn = { background: "#eab308", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const hireBtn = { background: "#22c55e", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const rejectBtn = { background: "#ef4444", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
