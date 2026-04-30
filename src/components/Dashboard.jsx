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
        <h2>Recruiter Dashboard ({filteredApps.length} Applications)</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowJobModal(true)} style={addBtn}>+ Post New Job</button>
          <button onClick={() => alert("CSV Export - Coming Soon")} style={exportBtn}>Export CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input 
          placeholder="Search by name or email..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="All">All Status</option>
          <option value="New">New</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Hired">Hired</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Applicant Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {paginatedApps.map(app => (
          <div 
            key={app.id} 
            style={cardStyle}
            onClick={() => setSelectedApplicant(app)}
          >
            <h4 style={{ margin: "0 0 8px 0" }}>{app.full_name}</h4>
            <p style={{ margin: "4px 0", color: "#64748b" }}>{app.email}</p>
            <p><strong>Score:</strong> {app.score || 0}%</p>
            <p style={statusBadge(app.status)}>{app.status || "New"}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={pageBtn}>Previous</button>
          <span style={{ margin: "0 20px" }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={pageBtn}>Next</button>
        </div>
      )}

      {/* Applicant Detail Sidebar with Resume Viewer */}
      {selectedApplicant && (
        <div style={sidebarStyle}>
          <button onClick={() => setSelectedApplicant(null)} style={closeBtn}>✕</button>
          
          <h3>{selectedApplicant.full_name}</h3>
          <p><strong>Email:</strong> {selectedApplicant.email}</p>
          <p><strong>Phone:</strong> {selectedApplicant.phone}</p>
          <p><strong>Score:</strong> {selectedApplicant.score || 0}%</p>
          <p><strong>Status:</strong> {selectedApplicant.status || "New"}</p>

          {/* Resume Viewer */}
          {selectedApplicant.cv_url ? (
            <div style={{ margin: "24px 0" }}>
              <h4>📄 Resume / CV</h4>
              <div style={resumeContainer}>
                <iframe
                  src={selectedApplicant.cv_url}
                  style={iframeStyle}
                  title="Applicant Resume"
                />
              </div>
              <a href={selectedApplicant.cv_url} target="_blank" rel="noopener noreferrer" style={openLink}>
                Open in New Tab ↓
              </a>
            </div>
          ) : (
            <p style={{ color: "#ef4444", fontStyle: "italic" }}>No CV uploaded.</p>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")} style={shortlistBtn}>Shortlist</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Hired")} style={hireBtn}>Hire Candidate</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Rejected")} style={rejectBtn}>Reject</button>
          </div>
        </div>
      )}

      {/* Post New Job Modal - (Add your full modal here if needed) */}
    </div>
  );
}

// ==================== STYLES ====================
const cardStyle = {
  padding: "20px",
  background: "white",
  borderRadius: "16px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  cursor: "pointer",
  transition: "all 0.2s"
};

const statusBadge = (status) => ({
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "0.85rem",
  background: status === "Hired" ? "#dcfce7" : status === "Rejected" ? "#fee2e2" : "#fef3c7",
  color: status === "Hired" ? "#166534" : status === "Rejected" ? "#b91c1c" : "#92400e"
});

const sidebarStyle = {
  position: "fixed",
  top: "90px",
  right: "20px",
  width: "440px",
  background: "white",
  padding: "28px",
  borderRadius: "20px",
  boxShadow: "0 15px 50px rgba(0,0,0,0.2)",
  zIndex: 1000,
  maxHeight: "85vh",
  overflowY: "auto"
};

const closeBtn = { position: "absolute", top: "16px", right: "20px", fontSize: "28px", background: "none", border: "none", cursor: "pointer" };

const resumeContainer = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  overflow: "hidden",
  height: "460px",
  background: "#f8fafc"
};

const iframeStyle = { width: "100%", height: "100%", border: "none" };

const openLink = { display: "block", textAlign: "center", marginTop: "12px", color: "#2563eb", textDecoration: "none" };

const shortlistBtn = { background: "#eab308", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const hireBtn = { background: "#22c55e", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const rejectBtn = { background: "#ef4444", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };

const searchInput = { padding: "12px", width: "280px", borderRadius: "8px", border: "1px solid #ccc" };
const selectStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ccc" };
const pageBtn = { padding: "10px 20px", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer" };
const addBtn = { padding: "12px 24px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" };
const exportBtn = { padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" };
