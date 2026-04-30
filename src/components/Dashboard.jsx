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

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", id);
    if (!error) {
      refreshData();
      if (selectedApplicant?.id === id) setSelectedApplicant({ ...selectedApplicant, status: newStatus });
    }
  };

  const postNewJob = async () => {
    if (!newJob.title || !newJob.description) {
      alert("Title and Description are required");
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
          <button onClick={() => { /* exportCSV function */ }} style={exportBtn}>Export CSV</button>
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

      {/* Applicants Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {paginatedApps.length > 0 ? (
          paginatedApps.map(app => (
            <div key={app.id} style={card} onClick={() => setSelectedApplicant(app)}>
              <h4>{app.full_name}</h4>
              <p>{app.email}</p>
              <p><strong>Score:</strong> {app.score || 0}%</p>
              <p style={{ color: app.status === "Hired" ? "green" : app.status === "Rejected" ? "red" : "orange" }}>
                Status: {app.status || "New"}
              </p>
            </div>
          ))
        ) : (
          <p>No applications found.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={pageBtn}>Previous</button>
          <span style={{ margin: "0 20px" }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={pageBtn}>Next</button>
        </div>
      )}

      {/* Post New Job Modal */}
      {showJobModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Post New Job</h3>
            {/* Full job form from previous message */}
            <button onClick={postNewJob} disabled={postingJob}>Post Job</button>
            <button onClick={() => setShowJobModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Basic Styles
const card = { padding: 20, background: "white", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", cursor: "pointer" };
const searchInput = { padding: 12, borderRadius: 8, border: "1px solid #ccc", width: 280 };
const selectStyle = { padding: 12, borderRadius: 8, border: "1px solid #ccc" };
const pageBtn = { padding: "10px 20px", margin: "0 8px", borderRadius: 8 };
const addBtn = { padding: "12px 20px", background: "#10b981", color: "white", border: "none", borderRadius: 10, cursor: "pointer" };
const exportBtn = { padding: "12px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: 10, cursor: "pointer" };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { background: "white", padding: 30, borderRadius: 16, width: "90%", maxWidth: 600 };
