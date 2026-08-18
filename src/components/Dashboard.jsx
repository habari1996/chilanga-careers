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
  const [allJobs, setAllJobs] = useState([]);
  const [jobStatusFilter, setJobStatusFilter] = useState("All");
  const [showJobsPanel, setShowJobsPanel] = useState(false);
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

  const fetchAllJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (!error) setAllJobs(data || []);
  };
  useEffect(() => { fetchAllJobs(); }, []);

  const pendingJobs = allJobs.filter(j => j.status === "Pending Approval");
  const managedJobs = jobStatusFilter === "All"
    ? allJobs
    : allJobs.filter(j => j.status === jobStatusFilter);

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
      if (active) {
        setDocUrls({ cv, qualifications, tertiary, nrc });
        setDocsLoading(false);
      }
    };
    resolveDocs();
    return () => { active = false; };
  }, [selectedApplicant]);

  const filtered = useMemo(() => {
    let list = [...(apps || [])];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(a =>
        (a.full_name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.phone || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(a => a.status === statusFilter);
    if (qualificationFilter !== "All") list = list.filter(a => a.qualification === qualificationFilter);
    if (genderFilter !== "All") list = list.filter(a => a.gender === genderFilter);
    if (institutionSearch.trim()) {
      const ins = institutionSearch.trim().toLowerCase();
      list = list.filter(a => (a.institution || "").toLowerCase().includes(ins));
    }
    if (fieldSearch.trim()) {
      const f = fieldSearch.trim().toLowerCase();
      list = list.filter(a => (a.field_of_study || "").toLowerCase().includes(f));
    }
    if (ageMin) list = list.filter(a => (a.age || 0) >= parseInt(ageMin));
    if (ageMax) list = list.filter(a => (a.age || 999) <= parseInt(ageMax));
    if (minPoints) list = list.filter(a => (grade12Data[a.id] || 0) >= parseInt(minPoints));
    if (dateFrom) list = list.filter(a => a.created_at && a.created_at.slice(0, 10) >= dateFrom);
    if (dateTo) list = list.filter(a => a.created_at && a.created_at.slice(0, 10) <= dateTo);
    if (sortMode === "newest") list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    else if (sortMode === "oldest") list.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    else if (sortMode === "name") list.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    return list;
  }, [apps, search, statusFilter, qualificationFilter, genderFilter, institutionSearch, fieldSearch, ageMin, ageMax, minPoints, dateFrom, dateTo, sortMode, grade12Data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAllPage = () => {
    const ids = pageItems.map(a => a.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    else setSelectedIds(prev => [...new Set([...prev, ...ids])]);
  };

  const updateStatus = async (id, status, reason) => {
    const payload = { status };
    if (reason) payload.rejection_reason = reason;
    const { error } = await supabase.from("applications").update(payload).eq("id", id);
    if (error) throw error;
    showToast(`Status set to ${status}`);
    if (refreshData) await refreshData();
  };

  const bulkUpdateStatus = async (status) => {
    if (!selectedIds.length) return;
    openConfirm({
      title: `Bulk ${status}`,
      message: `Set ${selectedIds.length} application(s) to ${status}?`,
      onConfirm: async (reason) => {
        const payload = { status };
        if (reason && status === "Rejected") payload.rejection_reason = reason;
        const { error } = await supabase.from("applications").update(payload).in("id", selectedIds);
        if (error) throw error;
        showToast(`Updated ${selectedIds.length} to ${status}`);
        setSelectedIds([]);
        if (refreshData) await refreshData();
      }
    });
  };

  const exportCSV = () => {
    const headers = ["full_name", "email", "phone", "gender", "age", "qualification", "institution", "field_of_study", "status", "created_at"];
    const rows = filtered.map(a => headers.map(h => `"${String(a[h] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prev => ({ ...prev, [name]: value }));
  };

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
      fetchAllJobs();
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
        const { error } = await supabase.from("jobs").update({
          status: "Published",
          approved_by: userEmail || null,
          approved_at: new Date().toISOString()
        }).eq("id", jobId);
        if (error) throw error;
        showToast("Job published");
        fetchAllJobs();
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
        fetchAllJobs();
      }
    });
  };

  const deleteJob = async (jobId, jobTitle) => {
    openConfirm({
      title: "Delete Job",
      message: `Permanently delete "${jobTitle || "this job"}"? This cannot be undone.`,
      onConfirm: async () => {
        const { error } = await supabase.from("jobs").delete().eq("id", jobId);
        if (error) throw error;
        showToast("Job deleted");
        fetchAllJobs();
        if (refreshData) await refreshData();
      }
    });
  };

  const closeJob = async (jobId) => {
    openConfirm({
      title: "Close Job",
      message: "Close this job so it no longer appears on the public Jobs page?",
      onConfirm: async () => {
        const { error } = await supabase.from("jobs").update({ status: "Closed" }).eq("id", jobId);
        if (error) throw error;
        showToast("Job closed");
        fetchAllJobs();
        if (refreshData) await refreshData();
      }
    });
  };

  const isPdf = (url) => url && (url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf"));

  const downloadDoc = async (url, name, label) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = (url.split(".").pop() || "bin").split("?")[0];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(name || "document").replace(/\s+/g, "_")}_${label}.${ext}`;
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

  const qualifications = useMemo(() => {
    const set = new Set((apps || []).map(a => a.qualification).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [apps]);

  return (
    <div style={{ padding: isMobile ? "8px 0" : "0", marginRight: (!isMobile && selectedApplicant) ? "420px" : "0", transition: "margin 0.25s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? "1.35rem" : "1.75rem" }}>Recruiter Dashboard</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canPostJobs && <button onClick={() => setShowJobModal(true)} style={addBtn}>+ Post New Job</button>}
          {(canPostJobs || canApproveJobs) && (
            <button onClick={() => setShowJobsPanel(v => !v)} style={exportBtn}>
              {showJobsPanel ? "Hide Jobs" : "Manage Jobs"}
            </button>
          )}
          {canExportCSV && <button onClick={exportCSV} style={exportBtn}>Export CSV</button>}
        </div>
      </div>

      {canApproveJobs && pendingJobs.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem" }}>Jobs Pending Approval ({pendingJobs.length})</h3>
          {pendingJobs.map(job => (
            <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #fde68a", flexWrap: "wrap" }}>
              <div>
                <strong>{job.title}</strong>
                <span style={{ color: "#64748b", marginLeft: 8, fontSize: "0.9rem" }}>{job.location} • {job.department}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => approveJob(job.id)} style={{ padding: "6px 14px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Approve</button>
                <button onClick={() => rejectJob(job.id)} style={{ padding: "6px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Reject</button>
                <button onClick={() => deleteJob(job.id, job.title)} style={{ padding: "6px 14px", background: "#475569", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showJobsPanel && (canPostJobs || canApproveJobs) && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Manage Jobs ({managedJobs.length})</h3>
            <select value={jobStatusFilter} onChange={e => setJobStatusFilter(e.target.value)} style={{ ...mInput, width: "auto", minWidth: 160 }}>
              <option value="All">All statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Published">Published</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          {managedJobs.length === 0 && (
            <p style={{ color: "#94a3b8", margin: 0 }}>No jobs in this filter.</p>
          )}
          {managedJobs.map(job => (
            <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ wordBreak: "break-word" }}>{job.title}</strong>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: 2 }}>
                  {job.location || "—"} • {job.department || "—"} • <span style={{
                    color: job.status === "Published" ? "#059669" : job.status === "Pending Approval" ? "#b45309" : job.status === "Rejected" ? "#dc2626" : "#64748b",
                    fontWeight: 600
                  }}>{job.status}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {job.status === "Pending Approval" && canApproveJobs && (
                  <>
                    <button onClick={() => approveJob(job.id)} style={{ padding: "6px 12px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" }}>Approve</button>
                    <button onClick={() => rejectJob(job.id)} style={{ padding: "6px 12px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" }}>Reject</button>
                  </>
                )}
                {job.status === "Published" && (
                  <button onClick={() => closeJob(job.id)} style={{ padding: "6px 12px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" }}>Close</button>
                )}
                <button onClick={() => deleteJob(job.id, job.title)} style={{ padding: "6px 12px", background: "#475569", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            {qualifications.map(q => <option key={q} value={q}>{q === "All" ? "All Qualifications" : q}</option>)}
          </select>
          <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1); }} style={mInput}>
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <input placeholder="Institution" value={institutionSearch} onChange={e => { setInstitutionSearch(e.target.value); setPage(1); }} style={mInput} />
          <input placeholder="Field of study" value={fieldSearch} onChange={e => { setFieldSearch(e.target.value); setPage(1); }} style={mInput} />
          <input placeholder="Min age" type="number" value={ageMin} onChange={e => { setAgeMin(e.target.value); setPage(1); }} style={mInput} />
          <input placeholder="Max age" type="number" value={ageMax} onChange={e => { setAgeMax(e.target.value); setPage(1); }} style={mInput} />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={mInput} />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={mInput} />
          <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={mInput}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
          <button onClick={clearFilters} style={{ ...mInput, background: "#e2e8f0", cursor: "pointer", border: "none" }}>Clear filters</button>
        </div>
        <div style={{ color: "#64748b", fontSize: "0.9rem" }}>{filtered.length} results</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={pageItems.length > 0 && pageItems.every(a => selectedIds.includes(a.id))} onChange={toggleSelectAllPage} />
          Select all on this page
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {pageItems.map(app => (
          <div key={app.id} onClick={() => setSelectedApplicant(app)} style={{
            background: "white", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            cursor: "pointer", border: selectedIds.includes(app.id) ? "2px solid #b45309" : "1px solid #e2e8f0",
            wordBreak: "break-word", overflowWrap: "anywhere"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <input type="checkbox" checked={selectedIds.includes(app.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(app.id)} />
                <div>
                  <strong style={{ fontSize: "1.05rem" }}>{app.full_name}</strong>
                  {app.status === "New" && <span style={{ marginLeft: 8, background: "#dbeafe", color: "#1d4ed8", fontSize: "0.75rem", padding: "2px 8px", borderRadius: 999 }}>New</span>}
                </div>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap" }}>{app.status}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: "0.9rem", color: "#475569" }}>
              <div>{app.qualification}</div>
              <div>{app.institution}</div>
              <div style={{ wordBreak: "break-all" }}>{app.email}</div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "#94a3b8", padding: 40 }}>No applications match your filters.</p>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={pageBtn}>Prev</button>
          <span style={{ padding: "8px 12px" }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={pageBtn}>Next</button>
        </div>
      )}

      {selectedIds.length > 0 && canUpdateStatus && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "white", padding: "12px 20px", borderRadius: 12, display: "flex", gap: 12, alignItems: "center", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <span>{selectedIds.length} selected</span>
          <button onClick={() => bulkUpdateStatus("Shortlisted")} style={{ padding: "8px 14px", background: "#059669", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Shortlist</button>
          <button onClick={() => bulkUpdateStatus("Rejected")} style={{ padding: "8px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Reject</button>
          <button onClick={() => setSelectedIds([])} style={{ padding: "8px 14px", background: "#475569", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Clear</button>
        </div>
      )}

      {selectedApplicant && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: isMobile ? "100%" : 400, height: "100%",
          background: "white", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 40, overflowY: "auto", padding: 20
        }}>
          <button onClick={() => setSelectedApplicant(null)} style={{ float: "right", border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>Close</button>
          <h3 style={{ marginTop: 0, wordBreak: "break-word" }}>{selectedApplicant.full_name}</h3>
          <p style={{ color: "#64748b", wordBreak: "break-all" }}>{selectedApplicant.email}</p>
          <p>{selectedApplicant.phone} · {selectedApplicant.gender} · Age {selectedApplicant.age}</p>
          <p>{selectedApplicant.qualification} — {selectedApplicant.institution}</p>
          <p>{selectedApplicant.field_of_study}</p>
          <p style={{ fontSize: "0.9rem" }}>Status: <strong>{selectedApplicant.status}</strong></p>

          {canUpdateStatus && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
              {["Shortlisted", "Interview", "Hired", "Rejected"].map(s => (
                <button key={s} onClick={() => openConfirm({ title: s, message: `Set status to ${s}?`, onConfirm: (reason) => updateStatus(selectedApplicant.id, s, reason) })} style={{ padding: "8px 12px", background: s === "Rejected" ? "#fee2e2" : "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem" }}>{s}</button>
              ))}
            </div>
          )}

          <h4>Documents</h4>
          {docsLoading && <p>Loading documents...</p>}
          {!docsLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "cv", label: "CV", url: docUrls.cv },
                { key: "qualifications", label: "Results / Transcript", url: docUrls.qualifications },
                { key: "tertiary", label: "Tertiary Certificate", url: docUrls.tertiary },
                { key: "nrc", label: "NRC", url: docUrls.nrc },
              ].map(doc => (
                <div key={doc.key}>
                  <strong>{doc.label}</strong>
                  {!doc.url && <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Not uploaded</p>}
                  {doc.url && isPdf(doc.url) && (
                    <iframe src={doc.url} title={doc.label} style={{ width: "100%", height: 280, border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 6 }} />
                  )}
                  {doc.url && !isPdf(doc.url) && (
                    <button onClick={() => downloadDoc(doc.url, selectedApplicant.full_name, doc.label)} style={{ marginTop: 6, padding: "8px 12px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Download {doc.label}</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showJobModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: isMobile ? 20 : 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Post New Job</h3>
              <button onClick={() => setShowJobModal(false)} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: 0 }}>Job will be sent for approval before going live.</p>
            <div><label style={mLabel}>Job Title *</label><input name="title" style={mInput} value={newJob.title} onChange={handleJobChange} placeholder="e.g. Graduate Trainee - Mechanical Engineering" /></div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div><label style={mLabel}>Location</label><input name="location" style={mInput} value={newJob.location} onChange={handleJobChange} placeholder="Lusaka" /></div>
              <div><label style={mLabel}>Department</label><select name="department" style={mInput} value={newJob.department} onChange={handleJobChange}><option value="Open (Multiple fields)">Open (Multiple fields)</option><option value="Engineering">Engineering</option><option value="Accounting & Finance">Accounting & Finance</option><option value="Human Resources">Human Resources</option><option value="Purchasing & Supply">Purchasing & Supply</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option><option value="IT">IT</option></select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div><label style={mLabel}>Job Type</label><select name="job_type" style={mInput} value={newJob.job_type} onChange={handleJobChange}><option value="Full-time">Full-time</option><option value="Internship">Internship</option><option value="Graduate Trainee">Graduate Trainee</option><option value="Contract">Contract</option></select></div>
              <div><label style={mLabel}>Application Deadline</label><input name="deadline" type="date" style={mInput} value={newJob.deadline} onChange={handleJobChange} /></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={mLabel}>Description</label><textarea name="description" style={{ ...mInput, minHeight: 120 }} value={newJob.description} onChange={handleJobChange} placeholder="Role overview, requirements..." /></div>
            <button onClick={postJob} disabled={postingJob} style={{ ...addBtn, padding: "14px", fontSize: "1.05rem", width: "100%", marginTop: 16 }}>{postingJob ? "Submitting..." : "Submit for Approval"}</button>
          </div>
        </div>
      )}

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
            <h3 style={{ marginTop: 0 }}>{confirm.title}</h3>
            <p style={{ color: "#475569" }}>{confirm.message}</p>
            {(confirm.title === "Rejected" || confirm.title === "Bulk Rejected" || confirm.title === "Reject Job") && (
              <textarea value={confirmReason} onChange={e => setConfirmReason(e.target.value)} placeholder="Optional reason..." style={{ ...mInput, minHeight: 80, marginBottom: 12 }} />
            )}
            <div style={{ display: "flex", justifyContent: "end", gap: 8 }}>
              <button onClick={closeConfirm} style={{ padding: "10px 16px", border: "1px solid #e2e8f0", background: "white", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={confirmLoading} style={{ padding: "10px 16px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>{confirmLoading ? "Working..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#0f172a", color: "white", padding: "12px 20px", borderRadius: 10, zIndex: 80, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

const mInput = { width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.95rem", boxSizing: "border-box" };
const mLabel = { display: "block", marginBottom: 6, fontWeight: 600, fontSize: "0.9rem", color: "#374151" };
const addBtn = { padding: "10px 16px", background: "#b45309", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const exportBtn = { padding: "10px 16px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };
const pageBtn = { padding: "8px 14px", border: "1px solid #e2e8f0", background: "white", borderRadius: 8, cursor: "pointer" };
