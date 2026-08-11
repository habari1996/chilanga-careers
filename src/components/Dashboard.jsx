import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ apps, refreshData }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [qualificationFilter, setQualificationFilter] = useState("All");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [sortMode, setSortMode] = useState("newest");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    location: "Lusaka",
    department: "Open (Multiple fields)",
    job_type: "Full-time",
    description: "",
    deadline: ""
  });
  const [postingJob, setPostingJob] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [grade12Data, setGrade12Data] = useState({});
  const [cvUrl, setCvUrl] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3500);
  };

  useEffect(() => {
    const fetchGrade12Results = async () => {
      if (!apps.length) return;
      const appIds = apps.map((a) => a.id);
      const chunkSize = 200;
      const pointsMap = {};
      for (let i = 0; i < appIds.length; i += chunkSize) {
        const chunk = appIds.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("grade12_results")
          .select("application_id, points")
          .in("application_id", chunk);
        if (error) {
          console.error(error);
          continue;
        }
        data.forEach((row) => {
          if (!pointsMap[row.application_id]) pointsMap[row.application_id] = 0;
          pointsMap[row.application_id] += row.points || 0;
        });
      }
      setGrade12Data(pointsMap);
    };
    fetchGrade12Results();
  }, [apps]);

  const cvPathFromStored = (stored) => {
    if (!stored) return null;
    const marker = "/storage/v1/object/public/cvs/";
    const i = stored.indexOf(marker);
    return i !== -1 ? stored.slice(i + marker.length) : stored;
  };

  useEffect(() => {
    let active = true;
    const resolveCv = async () => {
      setCvUrl(null);
      const path = cvPathFromStored(selectedApplicant?.cv_url);
      if (!path) return;
      setCvLoading(true);
      const { data, error } = await supabase.storage
        .from("cvs")
        .createSignedUrl(path, 3600);
      if (active) {
        setCvUrl(error ? null : data.signedUrl);
        setCvLoading(false);
      }
    };
    resolveCv();
    return () => {
      active = false;
    };
  }, [selectedApplicant]);

  const qualificationsList = [
    "All",
    "Grade 12 Certificate",
    "Certificate",
    "Diploma",
    "Advanced Diploma",
    "Bachelor's Degree",
    "Bachelor of Engineering",
    "Bachelor of Science",
    "Bachelor of Commerce",
    "Bachelor of Business Administration",
    "Master's Degree",
    "Other",
  ];

  const getBestMatchScore = (app) => {
    let score = 0;
    const qual = (app.qualification || "").toLowerCase();
    if (qual.includes("master")) score += 100;
    else if (qual.includes("bachelor of engineering") || qual.includes("bachelor of science")) score += 85;
    else if (qual.includes("bachelor")) score += 80;
    else if (qual.includes("advanced diploma")) score += 65;
    else if (qual.includes("diploma")) score += 55;
    else if (qual.includes("certificate") || qual.includes("grade 12")) score += 40;
    else score += 30;
    const age = parseInt(app.age);
    if (age && age >= 20 && age <= 26) score += 20;
    else if (age && age >= 27 && age <= 30) score += 10;
    return score;
  };

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
    let result = apps.filter((app) => {
      const matchesSearch =
        !search ||
        app.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        app.email?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || app.status === statusFilter;
      const matchesQualification =
        qualificationFilter === "All" ||
        (app.qualification &&
          app.qualification.toLowerCase().includes(qualificationFilter.toLowerCase()));
      const age = parseInt(app.age);
      const matchesAgeMin = !ageMin || (age && age >= parseInt(ageMin));
      const matchesAgeMax = !ageMax || (age && age <= parseInt(ageMax));
      const appPoints = grade12Data[app.id] || 0;
      const matchesMinPoints = !minPoints || appPoints >= parseInt(minPoints);
      return (
        matchesSearch &&
        matchesStatus &&
        matchesQualification &&
        matchesAgeMin &&
        matchesAgeMax &&
        matchesMinPoints
      );
    });

    if (sortMode === "bestMatch") {
      result.sort((a, b) => getBestMatchScore(b) - getBestMatchScore(a));
    } else if (sortMode === "points") {
      result.sort((a, b) => (grade12Data[a.id] || 0) - (grade12Data[b.id] || 0));
    } else if (sortMode === "name") {
      result.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  }, [
    apps,
    search,
    statusFilter,
    qualificationFilter,
    ageMin,
    ageMax,
    minPoints,
    sortMode,
    grade12Data,
  ]);

  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const totalApps = apps.length;
  const newApps = apps.filter((a) => a.status === "New").length;
  const shortlistedApps = apps.filter((a) => a.status === "Shortlisted").length;
  const hiredApps = apps.filter((a) => a.status === "Hired").length;

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) {
      refreshData();
      if (selectedApplicant?.id === id) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
      showToast(`Status updated to ${newStatus}. Email notification sent to candidate.`);
    }
  };

  const handleJobChange = (e) => {
    setNewJob({ ...newJob, [e.target.name]: e.target.value });
  };

  const postNewJob = async () => {
    if (!newJob.title.trim() || !newJob.description.trim()) {
      alert("Job Title and Description are required!");
      return;
    }

    setPostingJob(true);
    try {
      const { error } = await supabase.from("jobs").insert([{
        title: newJob.title.trim(),
        location: newJob.location || "Lusaka",
        department: newJob.department || "Open (Multiple fields)",
        job_type: newJob.job_type || "Full-time",
        description: newJob.description.trim(),
        deadline: newJob.deadline || null,
        status: "Pending Approval"
      }]);

      if (error) throw error;

      alert("Job submitted for approval successfully!");
      setShowJobModal(false);
      setNewJob({
        title: "",
        location: "Lusaka",
        department: "Open (Multiple fields)",
        job_type: "Full-time",
        description: "",
        deadline: ""
      });
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
    const cols = [
      "full_name",
      "email",
      "phone",
      "age",
      "gender",
      "qualification",
      "institution",
      "field_of_study",
      "total_points",
      "status",
      "created_at",
    ];
    const header = cols.join(",");
    const rows = filteredApps.map((app) => {
      const points = grade12Data[app.id] || 0;
      return cols
        .map((col) => {
          let val = "";
          if (col === "total_points") val = points;
          else val = app[col] ?? "";
          if (typeof val === "string") val = val.replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",");
    });
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chilanga-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status) => {
    const base = {
      padding: "4px 12px",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: 600,
    };
    if (status === "New")
      return { ...base, background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
    if (status === "Shortlisted") return { ...base, background: "#fef3c7", color: "#854d0e" };
    if (status === "Hired") return { ...base, background: "#dbeafe", color: "#1e40af" };
    if (status === "Rejected") return { ...base, background: "#fee2e2", color: "#991b1b" };
    return { ...base, background: "#f1f5f9", color: "#475569" };
  };

  return (
    <div>
      <div
        style={{
          marginRight: selectedApplicant ? "420px" : "0",
          transition: "margin-right 0.25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>Recruiter Dashboard</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setShowJobModal(true)} style={addBtn}>
              + Post New Job
            </button>
            <button onClick={exportCSV} style={exportBtn}>
              Export CSV
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>Total Applications</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a" }}>{totalApps}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>New Applications</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#16a34a" }}>{newApps}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>Shortlisted</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ca8a04" }}>{shortlistedApps}</div>
          </div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>Hired</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2563eb" }}>{hiredApps}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ ...searchInput, flex: 1, minWidth: 200 }}
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={qualificationFilter} onChange={(e) => { setQualificationFilter(e.target.value); setPage(1); }} style={selectStyle}>
            {qualificationsList.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" placeholder="Min Age" value={ageMin} onChange={(e) => { setAgeMin(e.target.value); setPage(1); }}
              style={{ width: 90, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
            <span style={{ color: "#64748b" }}>-</span>
            <input type="number" placeholder="Max Age" value={ageMax} onChange={(e) => { setAgeMax(e.target.value); setPage(1); }}
              style={{ width: 90, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
          </div>
          <input type="number" placeholder="Min Total Points" value={minPoints} onChange={(e) => { setMinPoints(e.target.value); setPage(1); }}
            style={{ width: 140, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
          <select value={sortMode} onChange={(e) => { setSortMode(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="newest">Newest First</option>
            <option value="bestMatch">Best Match</option>
            <option value="points">Best Results (Lowest Points)</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {paginatedApps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <p style={{ fontSize: 18 }}>No applications match your filters.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {paginatedApps.map((app) => {
              const isNew = app.status === "New";
              const totalPoints = grade12Data[app.id] || 0;
              return (
                <div
                  key={app.id}
                  style={{
                    ...cardStyle,
                    borderLeft: isNew ? "4px solid #22c55e" : "4px solid transparent",
                    background: isNew ? "#f8fff9" : "white",
                  }}
                  onClick={() => setSelectedApplicant(app)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: "0 0 4px 0" }}>{app.full_name}</h4>
                    {isNew && (
                      <span style={{ fontSize: "10px", background: "#22c55e", color: "white", padding: "1px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "2px 0", color: "#64748b", fontSize: 14 }}>{app.email}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}>{app.qualification} — {app.institution}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>{getTimeAgo(app.created_at)}</span>
                      <span style={{ fontSize: "12px", background: "#e0f2fe", color: "#0369a1", padding: "1px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                        Points: {totalPoints}
                      </span>
                    </div>
                    <span style={statusBadge(app.status)}>{app.status || "New"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedApplicant && (
        <>
          <div
            onClick={() => setSelectedApplicant(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 90, backdropFilter: "blur(2px)" }}
          />
          <div style={sidebarStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>{selectedApplicant.full_name}</h3>
                <div style={{ marginTop: 6 }}>
                  <span style={statusBadge(selectedApplicant.status || "New")}>{selectedApplicant.status || "New"}</span>
                </div>
              </div>
              <button onClick={() => setSelectedApplicant(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b", padding: 4, lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
              <div style={infoRow}><span style={infoLabel}>Email</span><span style={infoValue}>{selectedApplicant.email || "—"}</span></div>
              <div style={infoRow}><span style={infoLabel}>Phone</span><span style={infoValue}>{selectedApplicant.phone || "—"}</span></div>
              <div style={infoRow}><span style={infoLabel}>Age</span><span style={infoValue}>{selectedApplicant.age || "—"}</span></div>
              <div style={infoRow}><span style={infoLabel}>Qualification</span><span style={infoValue}>{selectedApplicant.qualification || "—"}</span></div>
              <div style={{ ...infoRow, marginBottom: 0 }}><span style={infoLabel}>Institution</span><span style={infoValue}>{selectedApplicant.institution || "—"}</span></div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>📊 Academic Results</h4>
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#0369a1", fontWeight: 500 }}>Total Grade 12 Points</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>Lower is better</div>
                  </div>
                  <div style={{
                    fontSize: "1.8rem", fontWeight: 700,
                    color: (grade12Data[selectedApplicant.id] || 0) <= 12 ? "#166534" : (grade12Data[selectedApplicant.id] || 0) <= 20 ? "#854d0e" : "#991b1b"
                  }}>
                    {grade12Data[selectedApplicant.id] || 0}
                  </div>
                </div>
              </div>
            </div>

            {selectedApplicant.cv_url ? (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>📄 Resume / CV</h4>
                {cvLoading ? (
                  <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.9rem" }}>Loading CV…</p>
                ) : cvUrl ? (
                  <>
                    <div style={resumeContainer}><iframe src={cvUrl} style={iframeStyle} title="Applicant Resume" /></div>
                    <a href={cvUrl} target="_blank" rel="noopener noreferrer" style={openLink}>Open in New Tab ↗</a>
                  </>
                ) : (
                  <p style={{ color: "#ef4444", fontStyle: "italic", fontSize: "0.9rem" }}>Could not load CV.</p>
                )}
              </div>
            ) : (
              <p style={{ color: "#94a3b8", fontStyle: "italic", marginBottom: 24 }}>No CV uploaded.</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")} style={shortlistBtn}>Shortlist Candidate</button>
              <button onClick={() => updateStatus(selectedApplicant.id, "Hired")} style={hireBtn}>Hire Candidate</button>
              <button onClick={() => updateStatus(selectedApplicant.id, "Rejected")} style={rejectBtn}>Reject</button>
            </div>
          </div>
        </>
      )}

      {toast.show && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", background: "#0f172a", color: "white", padding: "14px 22px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 300, maxWidth: "380px" }}>
          {toast.message}
        </div>
      )}

      {showJobModal && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setShowJobModal(false)}>
          <div style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>Post New Job</h3>
                <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "#64748b" }}>Job will be sent for approval before going live</p>
              </div>
              <button onClick={() => setShowJobModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={mLabel}>Job Title *</label>
                <input name="title" style={mInput} value={newJob.title} onChange={handleJobChange} placeholder="e.g. Graduate Trainee - Mechanical Engineering" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={mLabel}>Location</label>
                  <input name="location" style={mInput} value={newJob.location} onChange={handleJobChange} placeholder="Lusaka" />
                </div>
                <div>
                  <label style={mLabel}>Department</label>
                  <select name="department" style={mInput} value={newJob.department} onChange={handleJobChange}>
                    <option value="Open (Multiple fields)">Open (Multiple fields)</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Accounting & Finance">Accounting & Finance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Purchasing & Supply">Purchasing & Supply</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={mLabel}>Job Type</label>
                  <select name="job_type" style={mInput} value={newJob.job_type} onChange={handleJobChange}>
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Graduate Trainee">Graduate Trainee</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label style={mLabel}>Application Deadline</label>
                  <input name="deadline" type="date" style={mInput} value={newJob.deadline} onChange={handleJobChange} />
                </div>
              </div>

              <div>
                <label style={mLabel}>Description *</label>
                <textarea name="description" style={{ ...mInput, minHeight: "130px", resize: "vertical" }} value={newJob.description} onChange={handleJobChange} placeholder="Describe the role, requirements, and what the successful candidate will do..." />
              </div>
            </div>

            <div style={{ marginTop: 20, padding: "12px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, fontSize: "0.9rem", color: "#0369a1" }}>
              After posting, this job will be marked as <strong>Pending Approval</strong> and will only appear on the public Jobs page once approved by the HR Director.
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={() => setShowJobModal(false)} style={cancelBtn}>Cancel</button>
              <button onClick={postNewJob} disabled={postingJob} style={postBtn}>
                {postingJob ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 20px 16px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
const searchInput = { flex: 1, minWidth: 220, padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "1rem" };
const selectStyle = { padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "1rem", minWidth: 160 };
const addBtn = { padding: "10px 20px", background: "#0f172a", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const exportBtn = { padding: "10px 20px", background: "white", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
const sidebarStyle = { position: "fixed", top: 0, right: 0, width: "420px", maxWidth: "100vw", height: "100vh", background: "white", borderLeft: "1px solid #e2e8f0", padding: "24px 24px 40px", overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)", zIndex: 100 };
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
const infoRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 };
const infoLabel = { fontSize: "0.8rem", color: "#64748b", fontWeight: 500, minWidth: 90 };
const infoValue = { fontSize: "0.9rem", color: "#0f172a", textAlign: "right", wordBreak: "break-word" };
