import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard({ apps, refreshData, userEmail, permissions }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [qualificationFilter, setQualificationFilter] = useState("All");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortMode, setSortMode] = useState("newest");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", location: "Lusaka", department: "Open (Multiple fields)", job_type: "Full-time", description: "", deadline: "" });
  const [postingJob, setPostingJob] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [grade12Data, setGrade12Data] = useState({});
  const [docUrls, setDocUrls] = useState({ cv: null, qualifications: null, tertiary: null, nrc: null });
  const [docsLoading, setDocsLoading] = useState(false);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const canApproveJobs = permissions?.canApproveJobs === true;
  const canPostJobs = permissions?.canPostJobs === true;
  const canExportCSV = permissions?.canExportCSV !== false;
  const canUpdateStatus = permissions?.canUpdateApplicationStatus !== false;

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3500);
  };

  const openConfirm = (opts) => { setConfirmReason(""); setConfirm(opts); };
  const closeConfirm = () => { setConfirm(null); setConfirmReason(""); setConfirmLoading(false); };
  const handleConfirm = async () => {
    if (!confirm?.onConfirm) return;
    setConfirmLoading(true);
    try { await confirm.onConfirm(confirmReason); closeConfirm(); }
    catch (e) { setConfirmLoading(false); alert(e.message || "Action failed"); }
  };

  useEffect(() => {
    const fetchGrade12Results = async () => {
      if (!apps.length) return;
      const appIds = apps.map((a) => a.id);
      const chunkSize = 200;
      const pointsMap = {};
      for (let i = 0; i < appIds.length; i += chunkSize) {
        const chunk = appIds.slice(i, i + chunkSize);
        const { data, error } = await supabase.from("grade12_results").select("application_id, points").in("application_id", chunk);
        if (error) continue;
        data.forEach((row) => { if (!pointsMap[row.application_id]) pointsMap[row.application_id] = 0; pointsMap[row.application_id] += row.points || 0; });
      }
      setGrade12Data(pointsMap);
    };
    fetchGrade12Results();
  }, [apps]);

  const fetchPendingJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*").eq("status", "Pending Approval").order("created_at", { ascending: false });
    if (!error) setPendingJobs(data || []);
  };
  useEffect(() => { fetchPendingJobs(); }, []);

  const cvPathFromStored = (stored) => {
    if (!stored) return null;
    const marker = "/storage/v1/object/public/cvs/";
    const i = stored.indexOf(marker);
    return i !== -1 ? stored.slice(i + marker.length) : stored;
  };

  useEffect(() => {
    let active = true;
    const resolveDocs = async () => {
      setDocUrls({ cv: null, qualifications: null, tertiary: null, nrc: null });
      if (!selectedApplicant) return;
      setDocsLoading(true);
      const resolveOne = async (stored) => {
        const path = cvPathFromStored(stored);
        if (!path) return null;
        const { data, error } = await supabase.storage.from("cvs").createSignedUrl(path, 3600);
        return error ? null : data.signedUrl;
      };
      const [cv, qualifications, tertiary, nrc] = await Promise.all([
        resolveOne(selectedApplicant.cv_url),
        resolveOne(selectedApplicant.qualifications_url),
        resolveOne(selectedApplicant.tertiary_certificate_url),
        resolveOne(selectedApplicant.nrc_url),
      ]);
      if (active) { setDocUrls({ cv, qualifications, tertiary, nrc }); setDocsLoading(false); }
    };
    resolveDocs();
    return () => { active = false; };
  }, [selectedApplicant]);

  const qualificationsList = ["All", "Grade 12 Certificate", "Certificate", "Diploma", "Advanced Diploma", "Bachelor's Degree", "Bachelor of Engineering", "Bachelor of Science", "Bachelor of Commerce", "Bachelor of Business Administration", "Master's Degree", "Other"];

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
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || app.full_name?.toLowerCase().includes(q) || app.email?.toLowerCase().includes(q) || app.phone?.toLowerCase().includes(q) || app.institution?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || app.status === statusFilter;
      const matchesQualification = qualificationFilter === "All" || (app.qualification && app.qualification.toLowerCase().includes(qualificationFilter.toLowerCase()));
      const age = parseInt(app.age);
      const matchesAgeMin = !ageMin || (age && age >= parseInt(ageMin));
      const matchesAgeMax = !ageMax || (age && age <= parseInt(ageMax));
      const appPoints = grade12Data[app.id] || 0;
      const matchesMinPoints = !minPoints || appPoints >= parseInt(minPoints);
      const matchesGender = genderFilter === "All" || (app.gender || "").toLowerCase() === genderFilter.toLowerCase();
      const instQ = institutionSearch.trim().toLowerCase();
      const matchesInstitution = !instQ || (app.institution || "").toLowerCase().includes(instQ);
      const fieldQ = fieldSearch.trim().toLowerCase();
      const matchesField = !fieldQ || (app.field_of_study || "").toLowerCase().includes(fieldQ);
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const created = app.created_at ? new Date(app.created_at) : null;
        if (!created) matchesDate = false;
        else {
          if (dateFrom) { const from = new Date(dateFrom); from.setHours(0, 0, 0, 0); if (created < from) matchesDate = false; }
          if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59, 999); if (created > to) matchesDate = false; }
        }
      }
      return matchesSearch && matchesStatus && matchesQualification && matchesAgeMin && matchesAgeMax && matchesMinPoints && matchesGender && matchesInstitution && matchesField && matchesDate;
    });
    if (sortMode === "bestMatch") result.sort((a, b) => getBestMatchScore(b) - getBestMatchScore(a));
    else if (sortMode === "points") result.sort((a, b) => (grade12Data[a.id] || 0) - (grade12Data[b.id] || 0));
    else if (sortMode === "name") result.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    else result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return result;
  }, [apps, search, statusFilter, qualificationFilter, ageMin, ageMax, minPoints, genderFilter, institutionSearch, fieldSearch, dateFrom, dateTo, sortMode, grade12Data]);

  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalApps = apps.length;
  const newApps = apps.filter((a) => a.status === "New").length;
  const shortlistedApps = apps.filter((a) => a.status === "Shortlisted").length;
  const hiredApps = apps.filter((a) => a.status === "Hired").length;

  const pageIds = paginatedApps.map((a) => a.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0;

  const toggleSelect = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAllPage = () => {
    if (allPageSelected) setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    else setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
  };

  const clearSelection = () => setSelectedIds([]);

  const hasActiveFilters = !!(search || statusFilter !== "All" || qualificationFilter !== "All" || ageMin || ageMax || minPoints || genderFilter !== "All" || institutionSearch || fieldSearch || dateFrom || dateTo);

  const clearFilters = () => {
    setSearch(""); setStatusFilter("All"); setQualificationFilter("All"); setAgeMin(""); setAgeMax(""); setMinPoints(""); setGenderFilter("All"); setInstitutionSearch(""); setFieldSearch(""); setDateFrom(""); setDateTo(""); setSortMode("newest"); setPage(1);
  };

  const doBulkUpdateStatus = async (ids, newStatus) => {
    if (!canUpdateStatus) { alert("You do not have permission to update application status."); return; }
    if (!ids.length) return;
    const { error } = await supabase.from("applications").update({ status: newStatus }).in("id", ids);
    if (error) throw new Error(error.message);
    clearSelection(); refreshData();
    if (selectedApplicant && ids.includes(selectedApplicant.id)) setSelectedApplicant({ ...selectedApplicant, status: newStatus });
    showToast(`${ids.length} application${ids.length > 1 ? "s" : ""} marked as ${newStatus}.`);
  };

  const requestBulkStatus = (newStatus) => {
    const count = selectedIds.length;
    if (!count) return;
    const isReject = newStatus === "Rejected";
    openConfirm({
      title: isReject ? `Reject ${count} candidate${count > 1 ? "s" : ""}?` : `Shortlist ${count} candidate${count > 1 ? "s" : ""}?`,
      message: isReject ? `This will mark ${count} selected application${count > 1 ? "s" : ""} as Rejected.` : `This will mark ${count} selected application${count > 1 ? "s" : ""} as Shortlisted.`,
      confirmLabel: isReject ? "Yes, Reject All" : "Yes, Shortlist All",
      danger: isReject,
      onConfirm: async () => doBulkUpdateStatus(selectedIds, newStatus),
    });
  };

  const doUpdateStatus = async (id, newStatus) => {
    if (!canUpdateStatus) { alert("You do not have permission to update application status."); return; }
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", id);
    if (!error) {
      refreshData();
      if (selectedApplicant?.id === id) setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      showToast(`Status updated to ${newStatus}.`);
    } else throw new Error(error.message);
  };

  const requestStatusUpdate = (id, newStatus, name) => {
    const labels = {
      Shortlisted: { title: "Shortlist candidate?", msg: `Move ${name || "this candidate"} to Shortlisted.`, label: "Yes, Shortlist", danger: false },
      Hired: { title: "Hire candidate?", msg: `Mark ${name || "this candidate"} as Hired.`, label: "Yes, Hire", danger: false },
      Rejected: { title: "Reject candidate?", msg: `Reject ${name || "this candidate"}'s application.`, label: "Yes, Reject", danger: true },
    };
    const cfg = labels[newStatus] || { title: "Confirm", msg: `Update status to ${newStatus}?`, label: "Confirm", danger: false };
    openConfirm({ title: cfg.title, message: cfg.msg, confirmLabel: cfg.label, danger: cfg.danger, onConfirm: async () => doUpdateStatus(id, newStatus) });
  };

  const handleJobChange = (e) => setNewJob({ ...newJob, [e.target.name]: e.target.value });

  const postNewJob = async () => {
    if (!canPostJobs) { alert("You do not have permission to post jobs."); return; }
    if (!newJob.title.trim() || !newJob.description.trim()) { alert("Job Title and Description are required!"); return; }
    setPostingJob(true);
    try {
      const { error } = await supabase.from("jobs").insert([{ title: newJob.title.trim(), location: newJob.location || "Lusaka", department: newJob.department || "Open (Multiple fields)", job_type: newJob.job_type || "Full-time", description: newJob.description.trim(), deadline: newJob.deadline || null, status: "Pending Approval" }]);
      if (error) throw error;
      alert("Job submitted for approval successfully!");
      setShowJobModal(false);
      setNewJob({ title: "", location: "Lusaka", department: "Open (Multiple fields)", job_type: "Full-time", description: "", deadline: "" });
      fetchPendingJobs(); refreshData();
    } catch (err) { alert("Failed to post job: " + err.message); }
    finally { setPostingJob(false); }
  };

  const doApproveJob = async (jobId) => {
    if (!canApproveJobs) { alert("You do not have permission to approve jobs."); return; }
    const { error } = await supabase.from("jobs").update({ status: "Published", approved_at: new Date().toISOString() }).eq("id", jobId);
    if (!error) { showToast("Job approved and published successfully!"); fetchPendingJobs(); refreshData(); }
    else throw new Error(error.message);
  };

  const doRejectJob = async (jobId, reason) => {
    if (!canApproveJobs) { alert("You do not have permission to reject jobs."); return; }
    const { error } = await supabase.from("jobs").update({ status: "Rejected", rejection_reason: reason || null }).eq("id", jobId);
    if (!error) { showToast("Job rejected."); fetchPendingJobs(); }
    else throw new Error(error.message);
  };

  const requestApproveJob = (job) => openConfirm({ title: "Approve this job?", message: `"${job.title}" will go live on the public Jobs page.`, confirmLabel: "Yes, Approve", danger: false, onConfirm: async () => doApproveJob(job.id) });
  const requestRejectJob = (job) => openConfirm({ title: "Reject this job?", message: `"${job.title}" will not appear on the Jobs page.`, confirmLabel: "Yes, Reject", danger: true, needReason: true, onConfirm: async (reason) => doRejectJob(job.id, reason) });

  const exportCSV = () => {
    if (!canExportCSV) { alert("You do not have permission to export."); return; }
    if (!filteredApps.length) { alert("No applications to export."); return; }
    const cols = ["full_name", "email", "phone", "age", "gender", "qualification", "institution", "field_of_study", "total_points", "status", "created_at"];
    const header = cols.join(",");
    const rows = filteredApps.map((app) => {
      const points = grade12Data[app.id] || 0;
      return cols.map((col) => { let val = col === "total_points" ? points : (app[col] ?? ""); if (typeof val === "string") val = val.replace(/"/g, '""'); return `"${val}"`; }).join(",");
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
    const base = { padding: "4px 12px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 };
    if (status === "New") return { ...base, background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
    if (status === "Shortlisted") return { ...base, background: "#fef3c7", color: "#854d0e" };
    if (status === "Hired") return { ...base, background: "#dbeafe", color: "#1e40af" };
    if (status === "Rejected") return { ...base, background: "#fee2e2", color: "#991b1b" };
    return { ...base, background: "#f1f5f9", color: "#475569" };
  };

  const renderDocSection = (label, url) => (
    <div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>{label}</div>
      {url ? (<><div style={resumeContainer}><iframe src={url} style={iframeStyle} title={label} /></div><a href={url} target="_blank" rel="noopener noreferrer" style={openLink}>Open in New Tab ↗</a></>) : (<p style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.85rem", margin: 0 }}>Not uploaded</p>)}
    </div>
  );

  return (
    <div>
      <div style={{ marginRight: selectedApplicant ? "420px" : "0", transition: "margin-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)", paddingBottom: someSelected ? 80 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Recruiter Dashboard</h2>
          <div style={{ display: "flex", gap: 12 }}>
            {canPostJobs && <button onClick={() => setShowJobModal(true)} style={addBtn}>+ Post New Job</button>}
            {canExportCSV && <button onClick={exportCSV} style={exportBtn}>Export CSV</button>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}><div style={{ fontSize: "0.9rem", color: "#64748b" }}>Total Applications</div><div style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a" }}>{totalApps}</div></div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}><div style={{ fontSize: "0.9rem", color: "#64748b" }}>New Applications</div><div style={{ fontSize: "2rem", fontWeight: 700, color: "#16a34a" }}>{newApps}</div></div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}><div style={{ fontSize: "0.9rem", color: "#64748b" }}>Shortlisted</div><div style={{ fontSize: "2rem", fontWeight: 700, color: "#ca8a04" }}>{shortlistedApps}</div></div>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}><div style={{ fontSize: "0.9rem", color: "#64748b" }}>Hired</div><div style={{ fontSize: "2rem", fontWeight: 700, color: "#2563eb" }}>{hiredApps}</div></div>
        </div>
        {pendingJobs.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Pending Job Approvals<span style={{ marginLeft: 10, background: "#fef3c7", color: "#92400e", fontSize: "0.8rem", padding: "3px 10px", borderRadius: 9999, fontWeight: 600 }}>{pendingJobs.length}</span></h3>
            <div style={{ display: "grid", gap: 16 }}>
              {pendingJobs.map((job) => (
                <div key={job.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", fontWeight: 600, color: "#0f172a" }}>{job.title}</h4>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8, fontSize: "0.9rem", color: "#64748b" }}>
                      <span>📍 {job.location || "Zambia"}</span><span>🏢 {job.department || "Open"}</span><span>💼 {job.job_type || "Full-time"}</span>
                      {job.deadline && <span>📅 Deadline: {new Date(job.deadline).toLocaleDateString("en-GB")}</span>}
                    </div>
                    <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem", lineHeight: 1.5 }}>{job.description ? (job.description.length > 160 ? job.description.substring(0, 160) + "..." : job.description) : "No description"}</p>
                  </div>
                  {canApproveJobs ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
                      <button onClick={() => requestApproveJob(job)} style={{ padding: "10px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Approve</button>
                      <button onClick={() => requestRejectJob(job)} style={{ padding: "10px 16px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Reject</button>
                    </div>
                  ) : (
                    <div style={{ padding: "10px 14px", background: "#f1f5f9", borderRadius: 10, fontSize: "0.85rem", color: "#64748b", textAlign: "center", minWidth: 130 }}>Waiting for<br />HR Director approval</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>Candidate filters</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{filteredApps.length} result{filteredApps.length === 1 ? "" : "s"}</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", color: "#334155" }}>Clear filters</button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Search name, email, phone, institution..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ ...searchInput, flex: 1, minWidth: 220 }} />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}><option value="All">All Status</option><option value="New">New</option><option value="Shortlisted">Shortlisted</option><option value="Hired">Hired</option><option value="Rejected">Rejected</option></select>
            <select value={qualificationFilter} onChange={(e) => { setQualificationFilter(e.target.value); setPage(1); }} style={selectStyle}>{qualificationsList.map((q) => <option key={q} value={q}>{q}</option>)}</select>
            <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} style={selectStyle}><option value="All">All Genders</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
            <select value={sortMode} onChange={(e) => { setSortMode(e.target.value); setPage(1); }} style={selectStyle}><option value="newest">Newest First</option><option value="bestMatch">Best Match</option><option value="points">Best Results (Lowest Points)</option><option value="name">Name A-Z</option></select>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Institution..." value={institutionSearch} onChange={(e) => { setInstitutionSearch(e.target.value); setPage(1); }} style={{ width: 160, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
            <input placeholder="Field of study..." value={fieldSearch} onChange={(e) => { setFieldSearch(e.target.value); setPage(1); }} style={{ width: 160, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" placeholder="Min Age" value={ageMin} onChange={(e) => { setAgeMin(e.target.value); setPage(1); }} style={{ width: 90, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
              <span style={{ color: "#64748b" }}>-</span>
              <input type="number" placeholder="Max Age" value={ageMax} onChange={(e) => { setAgeMax(e.target.value); setPage(1); }} style={{ width: 90, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
            </div>
            <input type="number" placeholder="Min Points" value={minPoints} onChange={(e) => { setMinPoints(e.target.value); setPage(1); }} style={{ width: 110, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: "0.8rem", color: "#64748b" }}>From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
              <label style={{ fontSize: "0.8rem", color: "#64748b" }}>To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.95rem" }} />
            </div>
          </div>
        </div>

        {canUpdateStatus && paginatedApps.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.95rem", color: "#334155", fontWeight: 500 }}>
              <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllPage} style={{ width: 16, height: 16, cursor: "pointer" }} />
              Select all on this page
            </label>
            {someSelected && <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{selectedIds.length} selected</span>}
          </div>
        )}
        {paginatedApps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}><p style={{ fontSize: 18 }}>No applications match your filters.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {paginatedApps.map((app) => {
              const isNew = app.status === "New";
              const totalPoints = grade12Data[app.id] || 0;
              return (
                <div key={app.id} style={{ ...cardStyle, borderLeft: isNew ? "4px solid #22c55e" : selectedIds.includes(app.id) ? "4px solid #0f172a" : "4px solid transparent", background: selectedIds.includes(app.id) ? "#f8fafc" : isNew ? "#f8fff9" : "white" }} onClick={() => setSelectedApplicant(app)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {canUpdateStatus && (
                        <input type="checkbox" checked={selectedIds.includes(app.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => toggleSelect(app.id, e)} style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                      )}
                      <h4 style={{ margin: "0 0 4px 0" }}>{app.full_name}</h4>
                    </div>
                    {isNew && <span style={{ fontSize: "10px", background: "#22c55e", color: "white", padding: "1px 8px", borderRadius: "9999px", fontWeight: 600 }}>NEW</span>}
                  </div>
                  <p style={{ margin: "2px 0", color: "#64748b", fontSize: 14 }}>{app.email}</p>
                  <p style={{ margin: "4px 0", fontSize: 14 }}>{app.qualification} — {app.institution}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: "13px", color: "#64748b" }}>{getTimeAgo(app.created_at)}</span><span style={{ fontSize: "12px", background: "#e0f2fe", color: "#0369a1", padding: "1px 8px", borderRadius: "9999px", fontWeight: 600 }}>Points: {totalPoints}</span></div>
                    <span style={statusBadge(app.status)}>{app.status || "New"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {someSelected && canUpdateStatus && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "white", padding: "14px 20px", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", zIndex: 250, maxWidth: "95vw" }}>
          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{selectedIds.length} selected</span>
          <button onClick={() => requestBulkStatus("Shortlisted")} style={{ padding: "10px 16px", background: "#fef3c7", color: "#854d0e", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Shortlist</button>
          <button onClick={() => requestBulkStatus("Rejected")} style={{ padding: "10px 16px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Reject</button>
          <button onClick={clearSelection} style={{ padding: "10px 14px", background: "transparent", color: "#cbd5e1", border: "1px solid #475569", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Clear</button>
        </div>
      )}

      {selectedApplicant && (
        <>
          <div onClick={() => setSelectedApplicant(null)} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 90, backdropFilter: "blur(2px)" }} />
          <div style={sidebarStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div><h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>{selectedApplicant.full_name}</h3><div style={{ marginTop: 6 }}><span style={statusBadge(selectedApplicant.status || "New")}>{selectedApplicant.status || "New"}</span></div></div>
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
                  <div><div style={{ fontSize: "0.85rem", color: "#0369a1", fontWeight: 500 }}>Total Grade 12 Points</div><div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>Lower is better</div></div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, color: (grade12Data[selectedApplicant.id] || 0) <= 12 ? "#166534" : (grade12Data[selectedApplicant.id] || 0) <= 20 ? "#854d0e" : "#991b1b" }}>{grade12Data[selectedApplicant.id] || 0}</div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: "0 0 14px 0", fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>📎 Documents</h4>
              {docsLoading ? <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.9rem" }}>Loading documents…</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {renderDocSection("Resume / CV", docUrls.cv)}
                  {renderDocSection("Academic Results / Transcript", docUrls.qualifications)}
                  {renderDocSection("Degree / Tertiary Certificate", docUrls.tertiary)}
                  {renderDocSection("National Registration Card (NRC)", docUrls.nrc)}
                </div>
              )}
            </div>
            {canUpdateStatus && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => requestStatusUpdate(selectedApplicant.id, "Shortlisted", selectedApplicant.full_name)} style={shortlistBtn}>Shortlist Candidate</button>
                <button onClick={() => requestStatusUpdate(selectedApplicant.id, "Hired", selectedApplicant.full_name)} style={hireBtn}>Hire Candidate</button>
                <button onClick={() => requestStatusUpdate(selectedApplicant.id, "Rejected", selectedApplicant.full_name)} style={rejectBtn}>Reject</button>
              </div>
            )}
          </div>
        </>
      )}

      {toast.show && (<div style={{ position: "fixed", bottom: someSelected ? "90px" : "24px", right: "24px", background: "#0f172a", color: "white", padding: "14px 22px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 300, maxWidth: "380px" }}>{toast.message}</div>)}

      {confirm && (
        <div style={{ ...overlayStyle, zIndex: 400 }} onClick={(e) => e.target === e.currentTarget && !confirmLoading && closeConfirm()}>
          <div style={{ background: "white", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{confirm.title}</h3>
            <p style={{ margin: "0 0 20px", color: "#475569", lineHeight: 1.55, fontSize: "0.98rem" }}>{confirm.message}</p>
            {confirm.needReason && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ ...mLabel, fontSize: "0.9rem" }}>Reason (optional)</label>
                <textarea value={confirmReason} onChange={(e) => setConfirmReason(e.target.value)} placeholder="Add a short reason..." style={{ ...mInput, minHeight: 72, resize: "vertical", marginBottom: 0 }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={closeConfirm} disabled={confirmLoading} style={{ ...cancelBtn, opacity: confirmLoading ? 0.6 : 1 }}>Cancel</button>
              <button onClick={handleConfirm} disabled={confirmLoading} style={{ flex: 1, padding: "14px", border: "none", borderRadius: 10, fontWeight: 600, cursor: confirmLoading ? "not-allowed" : "pointer", background: confirm.danger ? "#dc2626" : "#0f172a", color: "white", opacity: confirmLoading ? 0.7 : 1 }}>
                {confirmLoading ? "Please wait..." : confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJobModal && canPostJobs && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setShowJobModal(false)}>
          <div style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div><h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>Post New Job</h3><p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "#64748b" }}>Job will be sent for approval before going live</p></div>
              <button onClick={() => setShowJobModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div><label style={mLabel}>Job Title *</label><input name="title" style={mInput} value={newJob.title} onChange={handleJobChange} placeholder="e.g. Graduate Trainee - Mechanical Engineering" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={mLabel}>Location</label><input name="location" style={mInput} value={newJob.location} onChange={handleJobChange} placeholder="Lusaka" /></div>
                <div><label style={mLabel}>Department</label><select name="department" style={mInput} value={newJob.department} onChange={handleJobChange}><option value="Open (Multiple fields)">Open (Multiple fields)</option><option value="Engineering">Engineering</option><option value="Accounting & Finance">Accounting & Finance</option><option value="Human Resources">Human Resources</option><option value="Purchasing & Supply">Purchasing & Supply</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option><option value="IT">IT</option></select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={mLabel}>Job Type</label><select name="job_type" style={mInput} value={newJob.job_type} onChange={handleJobChange}><option value="Full-time">Full-time</option><option value="Internship">Internship</option><option value="Graduate Trainee">Graduate Trainee</option><option value="Contract">Contract</option></select></div>
                <div><label style={mLabel}>Application Deadline</label><input name="deadline" type="date" style={mInput} value={newJob.deadline} onChange={handleJobChange} /></div>
              </div>
              <div><label style={mLabel}>Description *</label><textarea name="description" style={{ ...mInput, minHeight: "130px", resize: "vertical" }} value={newJob.description} onChange={handleJobChange} placeholder="Describe the role, requirements, and what the successful candidate will do..." /></div>
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, fontSize: "0.9rem", color: "#0369a1" }}>After posting, this job will be marked as <strong>Pending Approval</strong> and will only appear on the public Jobs page once approved by the HR Director.</div>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button onClick={() => setShowJobModal(false)} style={cancelBtn}>Cancel</button>
              <button onClick={postNewJob} disabled={postingJob} style={postBtn}>{postingJob ? "Submitting..." : "Submit for Approval"}</button>
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
const sidebarStyle = { position: "fixed", top: 0, right: 0, width: "420px", maxWidth: "100vw", height: "100vh", background: "white", borderLeft: "1px solid #e2e8f0", padding: "24px 24px 40px", overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)", zIndex: 100, transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" };
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
const iframeStyle = { width: "100%", height: "280px", border: "none" };
const openLink = { display: "inline-block", marginTop: 8, color: "#0ea5e9", textDecoration: "none", fontSize: "0.95rem" };
const infoRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 };
const infoLabel = { fontSize: "0.8rem", color: "#64748b", fontWeight: 500, minWidth: 90 };
const infoValue = { fontSize: "0.9rem", color: "#0f172a", textAlign: "right", wordBreak: "break-word" };
