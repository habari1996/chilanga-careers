import React, { useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ apps, refreshData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  // Post New Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "", location: "", department: "", job_type: "Full-time",
    experience_required: "", salary_range: "", deadline: "",
    description: "", requirements: "", responsibilities: ""
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
      if (selectedApplicant && selectedApplicant.id === id) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
    }
  };

  const postNewJob = async () => { /* your existing postNewJob function */ };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Recruiter Dashboard ({filteredApps.length} Applications)</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowJobModal(true)} style={addBtn}>+ Post New Job</button>
          <button onClick={() => alert("CSV Export coming soon")} style={exportBtn}>Export CSV</button>
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
        {paginatedApps.length > 0 ? (
          paginatedApps.map(app => (
            <div 
              key={app.id} 
              style={cardStyle}
              onClick={() => setSelectedApplicant(app)}
            >
              <h4 style={{ margin: "0 0 8px 0" }}>{app.full_name}</h4>
              <p style={{ margin: "4px 0", color: "#64748b" }}>{app.email}</p>
              <p><strong>Score:</strong> {app.score || 0}%</p>
              <p style={{ 
                display: "inline-block", 
                padding: "4px 12px", 
                borderRadius: "9999px",
                background: app.status === "Hired" ? "#dcfce7" : app.status === "Rejected" ? "#fee2e2" : "#fef3c7",
                color: app.status === "Hired" ? "#166534" : app.status === "Rejected" ? "#b91c1c" : "#92400e",
                fontSize: "0.85rem"
              }}>
                {app.status || "New"}
              </p>
            </div>
          ))
        ) : (
          <p>No applications found matching your filters.</p>
        )}
      </div>

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
          <button onClick={() => setSelectedApplicant(null)} style={{ float: "right", fontSize: "20px", cursor: "pointer" }}>×</button>
          <h3>{selectedApplicant.full_name}</h3>
          <p><strong>Email:</strong> {selectedApplicant.email}</p>
          <p><strong>Phone:</strong> {selectedApplicant.phone}</p>
          <p><strong>Score:</strong> {selectedApplicant.score || 0}%</p>
          <p><strong>Status:</strong> {selectedApplicant.status}</p>

          <div style={{ marginTop: 20 }}>
            <button onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")} style={shortlistBtn}>Shortlist</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Hired")} style={hireBtn}>Hire</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Rejected")} style={rejectBtn}>Reject</button>
          </div>
        </div>
      )}

      {/* Job Posting Modal - Keep your existing modal here */}
    </div>
  );
}

// Styles
const cardStyle = {
  padding: "20px",
  background: "white",
  borderRadius: "16px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  cursor: "pointer",
  transition: "all 0.2s"
};

const sidebarStyle = {
  position: "fixed",
  top: "80px",
  right: "20px",
  width: "380px",
  background: "white",
  padding: "24px",
  borderRadius: "16px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
  zIndex: 1000,
  maxHeight: "80vh",
  overflowY: "auto"
};

const shortlistBtn = { background: "#eab308", color: "white", padding: "10px 16px", border: "none", borderRadius: "8px", marginRight: "8px", cursor: "pointer" };
const hireBtn = { background: "#22c55e", color: "white", padding: "10px 16px", border: "none", borderRadius: "8px", marginRight: "8px", cursor: "pointer" };
const rejectBtn = { background: "#ef4444", color: "white", padding: "10px 16px", border: "none", borderRadius: "8px", cursor: "pointer" };

const pageBtn = { padding: "10px 20px", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer" };
const addBtn = { padding: "12px 24px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" };
const exportBtn = { padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" };
const searchInput = { padding: "12px", width: "280px", borderRadius: "8px", border: "1px solid #ccc" };
const selectStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ccc" };
