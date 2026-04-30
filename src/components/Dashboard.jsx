import React, { useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ apps, refreshData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // New Job Modal State - Comprehensive Fields
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    location: "",
    department: "",
    job_type: "Full-time",
    experience_required: "",
    salary_range: "",
    deadline: "",
    description: "",
    requirements: "",
    responsibilities: ""
  });
  const [postingJob, setPostingJob] = useState(false);

  // ... keep all your existing filters, filteredApps, updateStatus, exportCSV, etc.

  const handleJobChange = (e) => {
    setNewJob({ ...newJob, [e.target.name]: e.target.value });
  };

  const postNewJob = async () => {
    if (!newJob.title || !newJob.description || !newJob.department) {
      alert("Please fill Title, Department and Description");
      return;
    }

    setPostingJob(true);
    try {
      const { error } = await supabase.from("jobs").insert([newJob]);
      if (error) throw error;

      alert("✅ Job posted successfully!");
      setShowJobModal(false);
      setNewJob({
        title: "", location: "", department: "", job_type: "Full-time",
        experience_required: "", salary_range: "", deadline: "",
        description: "", requirements: "", responsibilities: ""
      });
      refreshData();
    } catch (err) {
      alert("Failed to post job: " + err.message);
    } finally {
      setPostingJob(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Recruiter Dashboard</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowJobModal(true)} style={addJobBtn}>+ Post New Job</button>
          <button onClick={exportCSV} style={primaryBtn}>Export CSV</button>
        </div>
      </div>

      {/* Your existing filters and applicant list remain the same */}

      {/* ==================== POST NEW JOB MODAL ==================== */}
      {showJobModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Post New Job Opening</h3>

            <input name="title" placeholder="Job Title *" style={inputStyle} value={newJob.title} onChange={handleJobChange} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input name="location" placeholder="Location (e.g. Lusaka)" style={inputStyle} value={newJob.location} onChange={handleJobChange} />
              <input name="department" placeholder="Department" style={inputStyle} value={newJob.department} onChange={handleJobChange} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <select name="job_type" style={inputStyle} value={newJob.job_type} onChange={handleJobChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
              <input name="experience_required" placeholder="Experience Required" style={inputStyle} value={newJob.experience_required} onChange={handleJobChange} />
            </div>

            <input name="salary_range" placeholder="Salary Range (optional)" style={inputStyle} value={newJob.salary_range} onChange={handleJobChange} />
            <input name="deadline" type="date" placeholder="Application Deadline" style={inputStyle} value={newJob.deadline} onChange={handleJobChange} />

            <label style={{ marginTop: 12, display: "block", fontWeight: 600 }}>Job Description *</label>
            <textarea name="description" style={{ ...inputStyle, minHeight: "100px" }} value={newJob.description} onChange={handleJobChange} placeholder="Detailed job description..." />

            <label style={{ marginTop: 12, display: "block", fontWeight: 600 }}>Key Requirements</label>
            <textarea name="requirements" style={{ ...inputStyle, minHeight: "80px" }} value={newJob.requirements} onChange={handleJobChange} placeholder="Qualifications, skills required..." />

            <label style={{ marginTop: 12, display: "block", fontWeight: 600 }}>Responsibilities</label>
            <textarea name="responsibilities" style={{ ...inputStyle, minHeight: "80px" }} value={newJob.responsibilities} onChange={handleJobChange} placeholder="Daily tasks and responsibilities..." />

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowJobModal(false)} style={cancelBtn}>Cancel</button>
              <button onClick={postNewJob} disabled={postingJob} style={primaryBtn}>
                {postingJob ? "Posting Job..." : "Post Job Opening"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const primaryBtn = { padding: "12px 24px", background: "#f59e0b", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
const cancelBtn = { padding: "12px 24px", background: "#fff", border: "1px solid #ccc", borderRadius: 10, cursor: "pointer" };
const inputStyle = { width: "100%", padding: "12px", marginBottom: 12, border: "1px solid #cbd5e1", borderRadius: 10 };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContent = { background: "white", padding: 32, borderRadius: 16, width: "90%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" };
