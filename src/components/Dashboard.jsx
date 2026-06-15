import React, { useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ apps, refreshData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  // Post New Job Modal
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

  // Helper: Show relative time (e.g. "Just now", "2h ago", "Yesterday")
  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = !search ||
        (app.full_name?.toLowerCase().includes(search.toLowerCase()) ||
         app.email?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "All" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", id);
    if (!error) {
      refreshData();
      if (selectedApplicant?.id === id) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
    }
  };

  const handleJobChange = (e) => {
    setNewJob({ ...newJob, [e.target.name]: e.target.value });
  };

  const postNewJob = async () => {
    if (!newJob.title || !newJob.description) {
      alert("Title and Description are required!");
      return;
    }
    setPostingJob(true);
    try {
      const { error } = await supabase.from("jobs").insert([newJob]);
      if (error) throw error;
      alert("\u2705 Job posted successfully!");
      setShowJobModal(false);
      setNewJob({ title: "", location: "", department: "", job_type: "Full-time", experience_required: "", salary_range: "", deadline: "", description: "", requirements: "", responsibilities: "" });
      refreshData();
    } catch (err) {
      alert("Failed to post job: " + err.message);
    } finally {
      setPostingJob(false);
    }
  };

  const exportCSV = () => {
    if (!filteredApps.length) {
      alert("No applications to export.");
      return;
    }
    const cols = ["full_name", "email", "phone", "gender", "age", "qualification", "institution", "field_of_study", "graduation_year", "skills", "status", "score", "created_at"];
    const header = cols.join(",");
    const rows = filteredApps.map(app =>
      cols.map(c => {
        const val = app[c] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chilanga-applications-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prominent status badge styling
  const statusBadge = (status) => {
    const base = { padding: "4px 12px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 };
    if (status === "New") return { ...base, background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
    if (status === "Shortlisted") return { ...base, background: "#fef3c7", color: "#854d0e" };
    if (status === "Hired") return { ...base, background: "#dbeafe", color: "#1e40af" };
    if (status === "Rejected") return { ...base, background: "#fee2e2", color: "#991b1b" };
    return { ...base, background: "#f1f5f9", color: "#475569" };
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Recruiter Dashboard ({filteredApps.length} Applications)</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowJobModal(true)} style={addBtn}>+ Post New Job</button>
          <button onClick={exportCSV} style={exportBtn}>Export CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={searchInput}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="All">All Status</option>
          <option value="New">New</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Applicant Cards */}
      {paginatedApps.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <p style={{ fontSize: 18 }}>No applications match your filters.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {paginatedApps.map(app => {
            const isNew = app.status === "New";
            return (
              <div 
                key={app.id} 
                style={{
                  ...cardStyle,
                  borderLeft: isNew ? "4px solid #22c55e" : "4px solid transparent",
                  background: isNew ? "#f8fff9" : "white"
                }} 
                onClick={() => setSelectedApplicant(app)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h4 style={{ margin: "0 0 4px 0" }}>{app.full_name}</h4>
                  {isNew && <span style={{ fontSize: "10px", background: "#22c55e", color: "white", padding: "1px 8px", borderRadius: "9999px", fontWeight: 600 }}>NEW</span>}
                </div>
                <p style={{ margin: "2px 0", color: "#64748b", fontSize: 14 }}>{app.email}</p>
                <p style={{ margin: "4px 0", fontSize: 14 }}>{app.qualification} — {app.institution}</p>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{getTimeAgo(app.created_at)}</span>
                  <span style={statusBadge(app.status)}>{app.status || "New"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={pageBtn}>Previous</button>
          <span style={{ margin: "0 20px" }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={pageBtn}>Next</button>
        </div>
      )}

      {/* Applicant Detail Sidebar */}
      {selectedApplicant && (
        <div style={sidebarStyle}>
          <button onClick={() => setSelectedApplicant(null)} style={closeBtn}>✕</button>
          <h3 style={{ marginTop: 0 }}>{selectedApplicant.full_name}</h3>
          <p><strong>Email:</strong> {selectedApplicant.email}</p>
          <p><strong>Phone:</strong> {selectedApplicant.phone}</p>
          <p><strong>Gender:</strong> {selectedApplicant.gender || "—"}</p>
          <p><strong>Age:</strong> {selectedApplicant.age || "—"}</p>
          <p><strong>Qualification:</strong> {selectedApplicant.qualification}</p>
          <p><strong>Institution:</strong> {selectedApplicant.institution}</p>
          <p><strong>Field:</strong> {selectedApplicant.field_of_study || "—"}</p>
          <p><strong>Skills:</strong> {selectedApplicant.skills || "—"}</p>
          <p><strong>Score:</strong> {selectedApplicant.score || 0}%</p>
          <p><strong>Status:</strong> <span style={statusBadge(selectedApplicant.status)}>{selectedApplicant.status || "New"}</span></p>
          <p><strong>Applied:</strong> {new Date(selectedApplicant.created_at).toLocaleDateString("en-GB")} ({getTimeAgo(selectedApplicant.created_at)})</p>

          {selectedApplicant.cv_url ? (
            <div style={{ margin: "20px 0" }}>
              <h4 style={{ marginBottom: 10 }}>📄 Resume / CV</h4>
              <div style={resumeContainer}>
                <iframe src={selectedApplicant.cv_url} style={iframeStyle} title="Applicant Resume" />
              </div>
              <a href={selectedApplicant.cv_url} target="_blank" rel="noopener noreferrer" style={openLink}>Open in New Tab ↗</a>
            </div>
          ) : selectedApplicant.cv_text ? (
            <div style={{ margin: "20px 0" }}>
              <h4>📝 CV Text</h4>
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, fontSize: 13, lineHeight: 1.6, maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {selectedApplicant.cv_text}
              </div>
            </div>
          ) : (
            <p style={{ color: "#ef4444", fontStyle: "italic" }}>No CV uploaded.</p>
          )}

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")} style={shortlistBtn}>Shortlist</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Hired")} style={hireBtn}>Hire Candidate</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Rejected")} style={rejectBtn}>Reject</button>
          </div>
        </div>
      )}

      {showJobModal && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setShowJobModal(false)}>
          <div style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>Post New Job</h3>
              <button onClick={() => setShowJobModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={mLabel}>Job Title *</label>
                <input name="title" style={mInput} value={newJob.title} onChange={handleJobChange} placeholder="e.g. Mechanical Engineer — Graduate Trainee" />
              </div>
              <div>
                <label style={mLabel}>Location</label>
                <input name="location" style={mInput} value={newJob.location} onChange={handleJobChange} placeholder="Lusaka" />
              </div>
              <div>
                <label style={mLabel}>Department</label>
                <input name="department" style={mInput} value={newJob.department} onChange={handleJobChange} placeholder="Production" />
              </div>
              <div>
                <label style={mLabel}>Job Type</label>
                <select name="job_type" style={mInput} value={newJob.job_type} onChange={handleJobChange}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>
              <div>
                <label style={mLabel}>Experience Required</label>
                <input name="experience_required" style={mInput} value={newJob.experience_required} onChange={handleJobChange} placeholder="0-2 years" />
              </div>
              <div>
                <label style={mLabel}>Salary Range</label>
                <input name="salary_range" style={mInput} value={newJob.salary_range} onChange={handleJobChange} placeholder="ZMW 8,000 - 12,000" />
              </div>
              <div>
                <label style={mLabel}>Deadline</label>
                <input name="deadline" type="date" style={mInput} value={newJob.deadline} onChange={handleJobChange} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={mLabel}>Description *</label>
                <textarea name="description" style={{ ...mInput, minHeight: "80px" }} value={newJob.description} onChange={handleJobChange} placeholder="Describe the graduate trainee role..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={mLabel}>Requirements</label>
                <textarea name="requirements" style={{ ...mInput, minHeight: "60px" }} value={newJob.requirements} onChange={handleJobChange} placeholder="Degree in Engineering, strong analytical skills..." />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowJobModal(false)} style={cancelBtn}>Cancel</button>
              <button onClick={postNewJob} disabled={postingJob} style={postBtn}>
                {postingJob ? "Posting..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const cardStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 20px 16px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
const searchInput = { flex: 1, minWidth: 220, padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "1rem" };
const selectStyle = { padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "1rem", minWidth: 160 };
const addBtn = { padding: "10px 20px", background: "#0f172a", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const exportBtn = { padding: "10px 20px", background: "white", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const pageBtn = { padding: "8px 18px", background: "white", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer" };
const sidebarStyle = { position: "fixed", top: 0, right: 0, width: "380px", height: "100vh", background: "white", borderLeft: "1px solid #e2e8f0", padding: "24px", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)", zIndex: 100 };
const closeBtn = { position: "absolute", top: 20, right: 24, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b" };
const shortlistBtn = { padding: "12px", background: "#fef3c7", color: "#854d0e", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const hireBtn = { padding: "12px", background: "#dbeafe", color: "#1e40af", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const rejectBtn = { padding: "12px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const mLabel = { display: "block", marginBottom: 6, fontWeight: 600, color: "#374151", fontSize: "0.95rem" };
const mInput = { width: "100%", padding: "12px 14px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "1rem", marginBottom: 4 };
const cancelBtn = { flex: 1, padding: "14px", background: "white", border: "1px solid #cbd5e1", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const postBtn = { flex: 1, padding: "14px", background: "#0f172a", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 };
const modalStyle = { background: "white", borderRadius: 20, padding: "32px", width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto" };
const resumeContainer = { border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#f8fafc" };
const iframeStyle = { width: "100%", height: "320px", border: "none" };
const openLink = { display: "inline-block", marginTop: 8, color: "#0ea5e9", textDecoration: "none", fontSize: "0.95rem" };
