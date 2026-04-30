import React, { useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ apps, refreshData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // New Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    location: "",
    department: "",
    description: ""
  });
  const [postingJob, setPostingJob] = useState(false);

  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      const matchesSearch =
        (a.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.email || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      refreshData();
      if (selectedApplicant?.id === id) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Qualification", "Institution", "Score", "Status", "Applied Date"];
    
    const rows = filteredApps.map((a) => [
      a.full_name || "",
      a.email || "",
      a.phone || "",
      a.qualification || "",
      a.institution || "",
      a.score || 0,
      a.status || "New",
      a.created_at ? new Date(a.created_at).toLocaleDateString() : "",
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `applications_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleJobChange = (e) => {
    setNewJob({ ...newJob, [e.target.name]: e.target.value });
  };

  const postNewJob = async () => {
    if (!newJob.title || !newJob.description) {
      alert("Job Title and Description are required");
      return;
    }

    setPostingJob(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .insert([newJob]);

      if (error) throw error;

      alert("✅ Job posted successfully!");
      setShowJobModal(false);
      setNewJob({ title: "", location: "", department: "", description: "" });
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
          <button onClick={() => setShowJobModal(true)} style={addJobBtn}>
            + Post New Job
          </button>
          <button onClick={exportCSV} style={primaryBtn}>Export CSV</button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search applicants by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInput}
      />

      <div style={{ margin: "20px 0 30px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["All", "New", "Shortlisted", "Rejected", "Hired"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              ...filterBtn,
              background: statusFilter === status ? "#0f172a" : "white",
              color: statusFilter === status ? "white" : "#000",
            }}
          >
            {status} ({apps.filter(a => status === "All" || a.status === status).length})
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {filteredApps.map((app) => (
          <div
            key={app.id}
            onClick={() => setSelectedApplicant(app)}
            style={applicantCard}
          >
            <strong>{app.full_name}</strong>
            <p style={{ margin: "6px 0", color: "#555", fontSize: "14px" }}>{app.email}</p>
            <p>Score: <strong>{app.score || 0}%</strong></p>
            <span style={{
              ...statusBadge,
              backgroundColor: 
                app.status === "Hired" ? "#dcfce7" : 
                app.status === "Rejected" ? "#fee2e2" : 
                app.status === "Shortlisted" ? "#dbeafe" : "#f3f4f6"
            }}>
              {app.status || "New"}
            </span>
          </div>
        ))}
      </div>

      {/* Applicant Detail Sidebar */}
      {selectedApplicant && (
        <div style={sidebarStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3>Candidate Profile</h3>
            <button onClick={() => setSelectedApplicant(null)} style={closeBtn}>Close</button>
          </div>

          <div style={detailCard}>
            <h4>Personal Details</h4>
            <p><strong>Name:</strong> {selectedApplicant.full_name}</p>
            <p><strong>Email:</strong> {selectedApplicant.email}</p>
            <p><strong>Phone:</strong> {selectedApplicant.phone || "—"}</p>
          </div>

          <div style={detailCard}>
            <h4>Education</h4>
            <p><strong>Qualification:</strong> {selectedApplicant.qualification || "—"}</p>
            <p><strong>Institution:</strong> {selectedApplicant.institution || "—"}</p>
          </div>

          <div style={detailCard}>
            <h4>Skills & Score</h4>
            <p><strong>Skills:</strong> {selectedApplicant.skills || "—"}</p>
            <p><strong>Score:</strong> {selectedApplicant.score || 0}%</p>
          </div>

          <div style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")} style={ghostBtn}>Shortlist</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Rejected")} style={ghostBtn}>Reject</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Hired")} style={primaryBtn}>Hire Candidate</button>
          </div>
        </div>
      )}

      {/* Post New Job Modal */}
      {showJobModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Post New Job Opening</h3>
            
            <input
              name="title"
              placeholder="Job Title *"
              style={inputStyle}
              value={newJob.title}
              onChange={handleJobChange}
            />
            <input
              name="location"
              placeholder="Location (e.g. Lusaka, Kitwe)"
              style={inputStyle}
              value={newJob.location}
              onChange={handleJobChange}
            />
            <input
              name="department"
              placeholder="Department (e.g. Engineering, Operations)"
              style={inputStyle}
              value={newJob.department}
              onChange={handleJobChange}
            />
            <textarea
              name="description"
              placeholder="Full Job Description *"
              style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
              value={newJob.description}
              onChange={handleJobChange}
            />

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowJobModal(false)} style={cancelBtn}>Cancel</button>
              <button onClick={postNewJob} disabled={postingJob} style={primaryBtn}>
                {postingJob ? "Posting Job..." : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== STYLES ======================
const primaryBtn = { 
  padding: "10px 20px", 
  background: "#f59e0b", 
  color: "white", 
  border: "none", 
  borderRadius: 10, 
  cursor: "pointer", 
  fontWeight: 600 
};

const addJobBtn = { 
  padding: "10px 20px", 
  background: "#10b981", 
  color: "white", 
  border: "none", 
  borderRadius: 10, 
  cursor: "pointer", 
  fontWeight: 600 
};

const ghostBtn = { 
  padding: "10px 20px", 
  border: "1px solid #cbd5e1", 
  background: "white", 
  borderRadius: 10, 
  cursor: "pointer" 
};

const cancelBtn = { 
  padding: "10px 20px", 
  background: "#fff", 
  border: "1px solid #ccc", 
  borderRadius: 10, 
  cursor: "pointer" 
};

const searchInput = { 
  width: "100%", 
  padding: "14px", 
  border: "1px solid #cbd5e1", 
  borderRadius: 10, 
  fontSize: "16px", 
  marginBottom: 20 
};

const filterBtn = { 
  padding: "8px 16px", 
  borderRadius: 8, 
  border: "1px solid #cbd5e1", 
  cursor: "pointer" 
};

const applicantCard = { 
  background: "white", 
  padding: 20, 
  borderRadius: 12, 
  boxShadow: "0 4px 15px rgba(0,0,0,0.06)", 
  cursor: "pointer" 
};

const statusBadge = { 
  padding: "4px 12px", 
  borderRadius: 999, 
  fontSize: "13px", 
  fontWeight: 500 
};

const sidebarStyle = { 
  position: "fixed", 
  top: 0, 
  right: 0, 
  width: 420, 
  height: "100vh", 
  background: "white", 
  boxShadow: "-8px 0 30px rgba(0,0,0,0.2)", 
  padding: 24, 
  overflowY: "auto", 
  zIndex: 1000 
};

const detailCard = { 
  background: "#f8fafc", 
  padding: 20, 
  borderRadius: 12, 
  marginBottom: 16 
};

const closeBtn = { 
  padding: "8px 16px", 
  background: "none", 
  border: "1px solid #ccc", 
  borderRadius: 8, 
  cursor: "pointer" 
};

const modalOverlay = {
  position: "fixed", 
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0, 
  background: "rgba(0,0,0,0.7)", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  zIndex: 2000 
};

const modalContent = {
  background: "white", 
  padding: 32, 
  borderRadius: 16, 
  width: "90%", 
  maxWidth: 500, 
  boxShadow: "0 20px 40px rgba(0,0,0,0.25)" 
};

const inputStyle = { 
  width: "100%", 
  padding: "12px", 
  marginBottom: 12, 
  border: "1px solid #cbd5e1", 
  borderRadius: 10 
};
