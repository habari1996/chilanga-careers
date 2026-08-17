import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useIsMobile from "../hooks/useIsMobile";

export default function Dashboard({ apps, refreshData, userEmail, permissions }) {
  const isMobile = useIsMobile();
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

  const filteredApps = useMemo(() => {
    let list = [...apps];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.full_name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.phone || "").includes(q) ||
        (a.institution || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(a => a.status === statusFilter);
    if (qualificationFilter !== "All") list = list.filter(a => a.qualification === qualificationFilter);
    if (genderFilter !== "All") list = list.filter(a => a.gender === genderFilter);
    if (institutionSearch.trim()) {
      const q = institutionSearch.toLowerCase();
      list = list.filter(a => (a.institution || "").toLowerCase().includes(q));
    }
    if (fieldSearch.trim()) {
      const q = fieldSearch.toLowerCase();
      list = list.filter(a => (a.field_of_study || "").toLowerCase().includes(q));
    }
    if (ageMin) list = list.filter(a => (a.age || 0) >= parseInt(ageMin));
    if (ageMax) list = list.filter(a => (a.age || 999) <= parseInt(ageMax));
    if (minPoints) list = list.filter(a => (grade12Data[a.id] || 999) <= parseInt(minPoints));
    if (dateFrom) list = list.filter(a => a.created_at && a.created_at.slice(0, 10) >= dateFrom);
    if (dateTo) list = list.filter(a => a.created_at && a.created_at.slice(0, 10) <= dateTo);

    if (sortMode === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortMode === "oldest") list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortMode === "points") list.sort((a, b) => (grade12Data[a.id] || 999) - (grade12Data[b.id] || 999));
    else if (sortMode === "name") list.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

    return list;
  }, [apps, search, statusFilter, qualificationFilter, genderFilter, institutionSearch, fieldSearch, ageMin, ageMax, minPoints, dateFrom, dateTo, sortMode, grade12Data]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / itemsPerPage));
  const paginatedApps = filteredApps.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const someSelected = selectedIds.length > 0;

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedApps.length) setSelectedIds([]);
    else setSelectedIds(paginatedApps.map(a => a.id));
  };

  const updateStatus = async (id, status, reason = "") => {
    const { error } = await supabase.from("applications").update({ status, notes: reason || null }).eq("id", id);
    if (error) throw error;
    showToast(`Status updated to ${status}`);
    if (refreshData) await refreshData();
    if (selectedApplicant?.id === id) setSelectedApplicant(prev => ({ ...prev, status }));
  };

  const bulkUpdateStatus = async (status) => {
    if (!selectedIds.length) return;
    openConfirm({
      title: `Bulk ${status}`,
      message: `Update ${selectedIds.length} application(s) to "${status}"?`,
      onConfirm: async () => {
        const { error } = await supabase.from("applications").update({ status }).in("id", selectedIds);
        if (error) throw error;
        showToast(`${selectedIds.length} applications updated to ${status}`);
        setSelectedIds([]);
        if (refreshData) await refreshData();
      }
    });
  };

  const exportCSV = () => {
    const headers = ["Full Name", "Email", "Phone", "Gender", "Age", "Qualification", "Institution", "Field", "Status", "Applied"];
    const rows = filteredApps.map(a => [
      a.full_name, a.email, a.phone, a.gender, a.age, a.qualification, a.institution, a.field_of_study, a.status, a.created_at?.slice(0, 10)
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleJobChange = (e) => setNewJob(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const postJob = async () => {
    if (!newJob.title.trim()) { alert("Job title is required"); return; }
    setPostingJob(true);
    try {
      const { error } = await supabase.from("jobs").insert({
        ...newJob,
        status: "Pending Approval",
        created_by: userEmail
      });
      if (error) throw error;
      showToast("Job submitted for approval");
      setShowJobModal(false);
      setNewJob({ title: "", location: "Lusaka", department: "Open (Multiple fields)", job_type: "Full-time", description: "", deadline: "" });
      fetchPendingJobs();
    } catch (e) {
      alert(e.message || "Failed to post job");
    } finally {
      setPostingJob(false);
    }
  };

  const approveJob = async (jobId) => {
    openConfirm({
      title: "Approve Job",
      message: "Publish this job so it becomes visible to candidates?",
      onConfirm: async () => {
        const { error } = await supabase.from("jobs").update({ status: "Published" }).eq("id", jobId);
        if (error) throw error;
        showToast("Job published");
        fetchPendingJobs();
        if (refreshData) await refreshData();
      }
    });
  };

  const rejectJob = async (jobId) => {
    openConfirm({
      title: "Reject Job",
      message: "Reject this job posting?",
      onConfirm: async () => {
        const { error } = await supabase.from("jobs").update({ status: "Rejected" }).eq("id", jobId);
        if (error) throw error;
        showToast("Job rejected");
        fetchPendingJobs();
      }
    });
  };

  const isPdf = (url) => url && (url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf"));

  const downloadDoc = async (url, name, label) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = (url.split(".").pop() || "pdf").split("?")[0];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name || "Document"}_${label}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      window.open(url, "_blank");
    }
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("All"); setQualificationFilter("All"); setGenderFilter("All");
    setInstitutionSearch(""); setFieldSearch(""); setAgeMin(""); setAgeMax(""); setMinPoints("");
    setDateFrom(""); setDateTo(""); setSortMode("newest"); setPage(1);
  };

  const addBtn = { padding: "10px 18px", background: "#b45309", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600 };
  const exportBtn = { padding: "10px 18px", background: "#0f172a", color: "white", border: "none", borderRadius: 10, cursor: "pointer" };
  const mLabel = { display: "block", marginBottom: 6, fontWeight: 600, color: "#374151", fontSize: "0.9rem" };
  const mInput = { width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "1rem", boxSizing: "border-box" };
  const modalStyle = { background: "white", borderRadius: 20, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" };

  return (
    <div>
      <div style={{ marginRight: (!isMobile && selectedApplicant) ? "420px" : "0", transition: "margin-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)", paddingBottom: someSelected ? 80 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 16, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? "1.35rem" : undefined }}>Recruiter Dashboard</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {canPostJobs && <button onClick={() => setShowJobModal(true)} style={addBtn}>+ Post New Job</button>}
            {canExportCSV && <button onClick={exportCSV} style={exportBtn}>Export CSV</button>}
          </div>
        </div>

        {/* Pending Jobs Approval */}
        {canApproveJobs && pendingJobs.length > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem" }}>Jobs Pending Approval ({pendingJobs.length})</h3>
            {pendingJobs.map(job => (
              <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #fde68a", flexWrap: "wrap" }}>
                <div>
                  <strong>{job.title}</strong>
                  <span style={{ color: "#64748b", marginLeft: 8, fontSize: "0.9rem" }}>{job.location} • {job.department}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => approveJob(job.id)} style={{ padding: "6px 14px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Approve</button>
                  <button onClick={() => rejectJob(job.id)} style={{ padding: "6px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: 12, marginBottom: 12 }}>
            <input placeholder="Search name, email, phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={mInput} />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={mInput}>
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select value={qualificationFilter} onChange={e => { setQualificationFilter(e.target.value); setPage(1); }} style={mInput}>
              {qualificationsList.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1); }} style={mInput}>
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input placeholder="Institution" value={institutionSearch} onChange={e => { setInstitutionSearch(e.target.value); setPage(1); }} style={mInput} />
            <input placeholder="Field of study" value={fieldSearch} onChange={e => { setFieldSearch(e.target.value); setPage(1); }} style={mInput} />
            <input type="number" placeholder="Min age" value={ageMin} onChange={e => { setAgeMin(e.target.value); setPage(1); }} style={mInput} />
            <input type="number" placeholder="Max age" value={ageMax} onChange={e => { setAgeMax(e.target.value); setPage(1); }} style={mInput} />
            <input type="number" placeholder="Max Grade 12 pts" value={minPoints} onChange={e => { setMinPoints(e.target.value); setPage(1); }} style={mInput} />
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={mInput} />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={mInput} />
            <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={mInput}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="points">Best Grade 12</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "#64748b", fontSize: "0.95rem" }}>{filteredApps.length} result{filteredApps.length !== 1 ? "s" : ""}</span>
            <button onClick={clearFilters} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", color: "#475569" }}>Clear filters</button>
          </div>
        </div>

        {/* Select all */}
        {paginatedApps.length > 0 && canUpdateStatus && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.95rem" }}>
              <input type="checkbox" checked={selectedIds.length === paginatedApps.length && paginatedApps.length > 0} onChange={toggleSelectAll} />
              Select all on this page
            </label>
          </div>
        )}

        {/* Cards */}
        {paginatedApps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}><p style={{ fontSize: 18 }}>No applications match your filters.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "20px" }}>
            {paginatedApps.map((app) => {
              const isNew = app.status === "New";
              const selected = selectedIds.includes(app.id);
              return (
                <div key={app.id} style={{ background: selected ? "#f0f9ff" : "#fff", border: selected ? "2px solid #0ea5e9" : "1px solid #e2e8f0", borderRadius: 14, padding: 18, cursor: "pointer", transition: "all 0.2s" }} onClick={() => setSelectedApplicant(app)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {canUpdateStatus && (
                        <input type="checkbox" checked={selected} onChange={(e) => { e.stopPropagation(); toggleSelect(app.id); }} onClick={e => e.stopPropagation()} />
                      )}
                      <strong style={{ fontSize: "1.05rem" }}>{app.full_name}</strong>
                    </div>
                    {isNew && <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: "0.75rem", padding: "2px 8px", borderRadius: 999 }}>New</span>}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    <div>{app.qualification}</div>
                    <div>{app.institution}</div>
                    <div>{app.email}</div>
                    <div style={{ marginTop: 6 }}><span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: "0.8rem" }}>{app.status}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>Prev</button>
            <span style={{ padding: "8px 12px", color: "#64748b" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>Next</button>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {someSelected && canUpdateStatus && (
        <div style={{ position: "fixed", bottom: isMobile ? 12 : 24, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "white", padding: isMobile ? "12px 14px" : "14px 20px", borderRadius: 14, display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", zIndex: 250, maxWidth: "95vw", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontWeight: 600 }}>{selectedIds.length} selected</span>
          <button onClick={() => bulkUpdateStatus("Shortlisted")} style={{ padding: "8px 14px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Shortlist</button>
          <button onClick={() => bulkUpdateStatus("Rejected")} style={{ padding: "8px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Reject</button>
          <button onClick={() => setSelectedIds([])} style={{ padding: "8px 14px", background: "transparent", color: "#94a3b8", border: "1px solid #475569", borderRadius: 8, cursor: "pointer" }}>Clear</button>
        </div>
      )}

      {/* Sidebar */}
      {selectedApplicant && (
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: isMobile ? "100%" : "420px",
          background: "white",
          padding: isMobile ? "16px 16px 40px" : "24px 24px 40px",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.12)",
          zIndex: 200, overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{selectedApplicant.full_name}</h3>
            <button onClick={() => setSelectedApplicant(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b" }}>✕</button>
          </div>
          <div style={{ fontSize: "0.95rem", color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>
            <div><strong>Email:</strong> {selectedApplicant.email}</div>
            <div><strong>Phone:</strong> {selectedApplicant.phone}</div>
            <div><strong>Gender:</strong> {selectedApplicant.gender} • Age {selectedApplicant.age}</div>
            <div><strong>Qualification:</strong> {selectedApplicant.qualification}</div>
            <div><strong>Institution:</strong> {selectedApplicant.institution}</div>
            <div><strong>Field:</strong> {selectedApplicant.field_of_study}</div>
            <div><strong>Status:</strong> {selectedApplicant.status}</div>
            <div><strong>Grade 12 pts:</strong> {grade12Data[selectedApplicant.id] ?? "—"}</div>
          </div>

          {canUpdateStatus && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {["Shortlisted", "Interview", "Hired", "Rejected"].map(s => (
                <button key={s} onClick={() => openConfirm({ title: s, message: `Set status to ${s}?`, onConfirm: (reason) => updateStatus(selectedApplicant.id, s, reason) })} style={{ padding: "8px 12px", background: s === "Rejected" ? "#fee2e2" : "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem" }}>{s}</button>
              ))}
            </div>
          )}

          {/* Documents */}
          <h4 style={{ margin: "0 0 10px" }}>Documents</h4>
          {docsLoading ? <p style={{ color: "#64748b" }}>Loading documents...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "cv", label: "CV", url: docUrls.cv },
                { key: "qualifications", label: "Transcript / Results", url: docUrls.qualifications },
                { key: "tertiary", label: "Tertiary Certificate", url: docUrls.tertiary },
                { key: "nrc", label: "NRC", url: docUrls.nrc }
              ].map(doc => (
                <div key={doc.key} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong>{doc.label}</strong>
                    {doc.url && <button onClick={() => downloadDoc(doc.url, selectedApplicant.full_name, doc.label)} style={{ padding: "4px 10px", fontSize: "0.85rem", background: "#0f172a", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>Download</button>}
                  </div>
                  {doc.url ? (
                    isPdf(doc.url) ? (
                      <iframe src={doc.url} title={doc.label} style={{ width: "100%", height: 220, border: "none", borderRadius: 8 }} />
                    ) : (
                      <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Preview not available for this file type. Use Download.</p>
                    )
                  ) : <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Not uploaded</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Modal */}
      {showJobModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: isMobile ? 8 : 20 }}>
          <div style={{ ...modalStyle, padding: isMobile ? "20px 16px" : "32px", maxWidth: isMobile ? "100%" : "720px", margin: isMobile ? "8px" : undefined, borderRadius: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 18 : 28 }}>
              <div><h3 style={{ margin: 0, fontSize: isMobile ? "1.15rem" : "1.35rem", fontWeight: 700, color: "#0f172a" }}>Post New Job</h3><p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "#64748b" }}>Job will be sent for approval before going live</p></div>
              <button onClick={() => setShowJobModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div><label style={mLabel}>Job Title *</label><input name="title" style={mInput} value={newJob.title} onChange={handleJobChange} placeholder="e.g. Graduate Trainee - Mechanical Engineering" /></div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                <div><label style={mLabel}>Location</label><input name="location" style={mInput} value={newJob.location} onChange={handleJobChange} placeholder="Lusaka" /></div>
                <div><label style={mLabel}>Department</label><select name="department" style={mInput} value={newJob.department} onChange={handleJobChange}><option value="Open (Multiple fields)">Open (Multiple fields)</option><option value="Engineering">Engineering</option><option value="Accounting & Finance">Accounting & Finance</option><option value="Human Resources">Human Resources</option><option value="Purchasing & Supply">Purchasing & Supply</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option><option value="IT">IT</option></select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                <div><label style={mLabel}>Job Type</label><select name="job_type" style={mInput} value={newJob.job_type} onChange={handleJobChange}><option value="Full-time">Full-time</option><option value="Internship">Internship</option><option value="Graduate Trainee">Graduate Trainee</option><option value="Contract">Contract</option></select></div>
                <div><label style={mLabel}>Application Deadline</label><input name="deadline" type="date" style={mInput} value={newJob.deadline} onChange={handleJobChange} /></div>
              </div>
              <div><label style={mLabel}>Description</label><textarea name="description" style={{ ...mInput, minHeight: 120 }} value={newJob.description} onChange={handleJobChange} placeholder="Role overview, requirements..." /></div>
              <button onClick={postJob} disabled={postingJob} style={{ ...addBtn, padding: "14px", fontSize: "1.05rem" }}>{postingJob ? "Submitting..." : "Submit for Approval"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, maxWidth: 420, width: "100%" }}>
            <h3 style={{ margin: "0 0 8px" }}>{confirm.title}</h3>
            <p style={{ color: "#64748b", marginBottom: 16 }}>{confirm.message}</p>
            {confirm.title !== "Bulk Shortlisted" && confirm.title !== "Bulk Rejected" && (
              <textarea value={confirmReason} onChange={e => setConfirmReason(e.target.value)} placeholder="Optional note / reason" style={{ ...mInput, minHeight: 70, marginBottom: 16 }} />
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeConfirm} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={confirmLoading} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#0f172a", color: "white", cursor: "pointer" }}>{confirmLoading ? "Working..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#0f172a", color: "white", padding: "12px 20px", borderRadius: 10, zIndex: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
