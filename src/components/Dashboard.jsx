import React, { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

export default function Dashboard({ apps, refreshData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicant, setSelectedApplicant] = useState(null);

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
      alert("Failed to update status");
    } else {
      refreshData();
      if (selectedApplicant?.id === id) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Qualification", "Score", "Status", "Applied Date"];
    const rows = filteredApps.map((a) => [
      a.full_name,
      a.email,
      a.phone,
      a.qualification,
      a.score,
      a.status,
      a.created_at ? new Date(a.created_at).toLocaleDateString() : "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Recruiter Dashboard</h2>
        <button onClick={exportCSV} style={primaryBtn}>Export CSV</button>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      <div style={{ margin: "20px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["All", "New", "Shortlisted", "Rejected", "Hired"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              ...ghostBtn,
              background: statusFilter === st ? "#0f172a" : "#fff",
              color: statusFilter === st ? "#fff" : "#000",
            }}
          >
            {st} ({apps.filter((a) => st === "All" || a.status === st).length})
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {filteredApps.map((app) => (
          <div
            key={app.id}
            onClick={() => setSelectedApplicant(app)}
            style={applicantCard}
          >
            <strong>{app.full_name}</strong>
            <p style={{ margin: "4px 0", color: "#666" }}>{app.email}</p>
            <p>Score: <strong>{app.score || 0}%</strong></p>
            <span style={{
              ...statusBadge,
              background: app.status === "Hired" ? "#dcfce7" : app.status === "Rejected" ? "#fee2e2" : app.status === "Shortlisted" ? "#dbeafe" : "#f3f4f6"
            }}>
              {app.status}
            </span>
          </div>
        ))}
      </div>

      {/* Applicant Detail Sidebar */}
      {selectedApplicant && (
        <div style={sidebar}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3>Candidate Profile</h3>
            <button onClick={() => setSelectedApplicant(null)} style={ghostBtn}>Close</button>
          </div>

          <div style={detailCard}>
            <h4>Personal Information</h4>
            <p><strong>Name:</strong> {selectedApplicant.full_name}</p>
            <p><strong>Email:</strong> {selectedApplicant.email}</p>
            <p><strong>Phone:</strong> {selectedApplicant.phone}</p>
          </div>

          <div style={detailCard}>
            <h4>Education</h4>
            <p><strong>Qualification:</strong> {selectedApplicant.qualification}</p>
            <p><strong>Institution:</strong> {selectedApplicant.institution}</p>
          </div>

          <div style={detailCard}>
            <h4>Skills & Score</h4>
            <p><strong>Skills:</strong> {selectedApplicant.skills}</p>
            <p><strong>Score:</strong> {selectedApplicant.score}%</p>
          </div>

          <div style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")} style={ghostBtn}>Shortlist</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Rejected")} style={ghostBtn}>Reject</button>
            <button onClick={() => updateStatus(selectedApplicant.id, "Hired")} style={primaryBtn}>Hire Candidate</button>
          </div>
        </div>
      )}
    </div>
  );
}

const primaryBtn = { padding: "10px 20px", background: "#f59e0b", color: "white", border: "none", borderRadius: 10, cursor: "pointer" };
const ghostBtn = { padding: "10px 20px", border: "1px solid #cbd5e1", borderRadius: 10, background: "white", cursor: "pointer" };
const inputStyle = { width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: 10, marginBottom: 16 };
const applicantCard = { background: "white", padding: 20, borderRadius: 12, boxShadow: "0 4px 15px rgba(0,0,0,0.06)", cursor: "pointer" };
const statusBadge = { padding: "4px 12px", borderRadius: 20, fontSize: 13, display: "inline-block" };
const sidebar = { position: "fixed", top: 0, right: 0, width: 420, height: "100vh", background: "white", boxShadow: "-8px 0 30px rgba(0,0,0,0.15)", padding: 24, overflowY: "auto", zIndex: 1000 };
const detailCard = { background: "#f8fafc", padding: 20, borderRadius: 12, marginBottom: 16 };
