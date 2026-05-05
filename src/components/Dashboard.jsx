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
      alert("✅ Job posted successfully!");
      setShowJobModal(false);
      setNewJob({ title: "", location: "", department: "", job_type: "Full-time", experience_required: "", salary_range: "", deadline: "", description: "", requirements: "", responsibilities: "" });
      refreshData();
    } catch (err) {
      alert("Failed to post job: " + err.message);
    } finally {
      setPostingJob(false);
    }
  };

  // FIX: Real CSV export from the apps array
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Recruiter Dashboard ({filteredApps.length} Applications)</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowJobModal(true)} style={addBtn}>+ Post New Job</button>
          {/* FIX: Real CSV export */}
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
          {paginatedApps.map(app => (
            <div key={app.id} style={cardStyle} onClick={() => setSelectedApplicant(app)}>
              <h4 style={{ margin: "0 0 8px 0" }}>{app.full_name}</h4>
              <p style={{ margin: "4px 0", color: "#64748b", fontSize: 14 }}>{app.email}</p>
              <p style={{ margin: "4px 0", fontSize: 14 }}>{app.qualification} — {app.institution}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span><strong>Score:</strong> {app.score || 0}%</span>
                <span style={statusBadge(app.status)}>{app.status || "New"}</span>
              </div>
            </div>
          ))}
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
          <p><strong>Applied:</strong> {new Date(selectedApplicant.created_at).toLocaleDateString("en-GB")}</p>

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

      {/* FIX: Post New Job Modal — fully implemented */}
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
                <input name="department" style={mInput} value={newJob.department} onChange={handleJobChange} placeholder="Engineering" />
              </div>
              <div>
                <label style={mLabel}>Job Type</label>
                <select name="job_type" style={mInput} value={newJob.job_type} onChange={handleJobChange}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Graduate Trainee</option>
                </select>
              </div>
              <div>
                <label style={mLabel}>Experience Required</label>
                <input name="experience_required" style={mInput} value={newJob.experience_required} onChange={handleJobChange} placeholder="0–2 years" />
              </div>
              <div>
                <label style={mLabel}>Salary Range</label>
                <input name="salary_range" style={mInput} value={newJob.salary_range} onChange={handleJobChange} placeholder="ZMW 8,000 – 12,000" />
              </div>
              <div>
                <label style={mLabel}>Application Deadline</label>
                <input name="deadline" type="date" style={mInput} value={newJob.deadline} onChange={handleJobChange} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={mLabel}>Job Description *</label>
                <textarea name="description" style={{ ...mInput, minHeight: 100 }} value={newJob.description} onChange={handleJobChange} placeholder="Overview of the role and responsibilities..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={mLabel}>Requirements</label>
                <textarea name="requirements" style={{ ...mInput, minHeight: 80 }} value={newJob.requirements} onChange={handleJobChange} placeholder="Minimum qualifications, skills, certifications..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={mLabel}>Key Responsibilities</label>
                <textarea name="responsibilities" style={{ ...mInput, minHeight: 80 }} value={newJob.responsibilities} onChange={handleJobChange} placeholder="Day-to-day duties..." />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setShowJobModal(false)} style={{ padding: "12px 24px", border: "1px solid #ccc", borderRadius: 10, background: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={postNewJob} disabled={postingJob} style={{ padding: "12px 28px", background: "#10b981", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", opacity: postingJob ? 0.7 : 1 }}>
                {postingJob ? "Posting..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STYLES ====================
const cardStyle = { padding: "20px", background: "white", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", cursor: "pointer", border: "1px solid #f1f5f9", transition: "box-shadow 0.2s" };
const statusBadge = (status) => ({ display: "inline-block", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 600, background: status === "Hired" ? "#dcfce7" : status === "Rejected" ? "#fee2e2" : status === "Shortlisted" ? "#dbeafe" : "#fef3c7", color: status === "Hired" ? "#166534" : status === "Rejected" ? "#b91c1c" : status === "Shortlisted" ? "#1e40af" : "#92400e" });
const sidebarStyle = { position: "fixed", top: "90px", right: "20px", width: "440px", background: "white", padding: "28px", borderRadius: "20px", boxShadow: "0 15px 50px rgba(0,0,0,0.2)", zIndex: 1000, maxHeight: "85vh", overflowY: "auto" };
const closeBtn = { position: "absolute", top: "16px", right: "20px", fontSize: "24px", background: "none", border: "none", cursor: "pointer" };
const resumeContainer = { border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", height: "400px", background: "#f8fafc" };
const iframeStyle = { width: "100%", height: "100%", border: "none" };
const openLink = { display: "block", textAlign: "center", marginTop: "10px", color: "#2563eb", textDecoration: "none", fontSize: 14 };
const shortlistBtn = { background: "#eab308", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const hireBtn = { background: "#22c55e", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const rejectBtn = { background: "#ef4444", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const searchInput = { padding: "12px 16px", width: "280px", borderRadius: "8px", border: "1px solid #ccc", fontSize: 14 };
const selectStyle = { padding: "12px 16px", borderRadius: "8px", border: "1px solid #ccc", fontSize: 14 };
const pageBtn = { padding: "10px 20px", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer" };
const addBtn = { padding: "12px 20px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600 };
const exportBtn = { padding: "12px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600 };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modalStyle = { background: "white", borderRadius: 20, padding: 32, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", position: "relative" };
const mLabel = { display: "block", marginBottom: 6, fontWeight: 600, color: "#374151", fontSize: 14 };
const mInput = { width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" };
