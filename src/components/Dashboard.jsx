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

  // NOTE: FULL FILE CONTINUED IN NEXT PUSH - this is emergency partial
  return <div style={{ padding: 40 }}><h2>Dashboard temporarily restoring...</h2><p>Please wait for the next deploy.</p></div>;
}
