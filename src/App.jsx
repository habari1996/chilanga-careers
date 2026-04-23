import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

export default function App() {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    skills: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: jobsData } = await supabase.from("jobs").select("*");
    const { data: appData } = await supabase
      .from("applications")
      .select("*")
      .order("id", { ascending: false });

    const normalized = (appData || []).map((a) => ({
      ...a,
      status: a.status || "New",
      score: calculateScore(a)
    }));

    setJobs(jobsData || []);
    setApps(normalized);
  }

  function calculateScore(a) {
    let score = 0;
    if ((a.qualification || "").toLowerCase().includes("degree")) score += 50;
    if ((a.skills || "").length > 3) score += 30;
    if ((a.email || "").includes("@")) score += 20;
    return score;
  }

  async function submitApplication() {
    await supabase.from("applications").insert(form);
    alert("Application Submitted");
    setForm({
      full_name: "",
      email: "",
      phone: "",
      qualification: "",
      skills: ""
    });
    loadData();
    setTab("dashboard");
  }

  async function updateStatus(id, status) {
    await supabase.from("applications").update({ status }).eq("id", id);
    loadData();
  }

  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      const matchesSearch =
        (a.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.skills || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || a.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const stats = {
    total: apps.length,
    shortlisted: apps.filter((a) => a.status === "Shortlisted").length,
    hired: apps.filter((a) => a.status === "Hired").length,
    avgScore:
      apps.length > 0
        ? Math.round(
            apps.reduce((sum, a) => sum + (a.score || 0), 0) / apps.length
          )
        : 0
  };

  const styles = {
    page: {
      fontFamily: "Arial, sans-serif",
      padding: "24px",
      background: "#f4f6f8",
      minHeight: "100vh"
    },
    top: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
      marginBottom: "20px"
    },
    title: { fontSize: "34px", fontWeight: "bold" },
    nav: { display: "flex", gap: "10px", flexWrap: "wrap" },
    btn: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #2563eb",
      background: "#2563eb",
      color: "#fff",
      cursor: "pointer"
    },
    btnLight: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #2563eb",
      background: "#fff",
      color: "#2563eb",
      cursor: "pointer"
    },
    card: {
      background: "#fff",
      padding: "18px",
      borderRadius: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
      gap: "16px"
    },
    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      marginBottom: "10px"
    },
    tableWrap: {
      overflowX: "auto"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    th: {
      textAlign: "left",
      padding: "10px",
      background: "#eef2ff",
      fontSize: "14px"
    },
    td: {
      padding: "10px",
      borderBottom: "1px solid #eee",
      fontSize: "14px",
      verticalAlign: "top"
    },
    badge: (text) => ({
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "999px",
      fontSize: "12px",
      background:
        text === "Hired"
          ? "#dcfce7"
          : text === "Shortlisted"
          ? "#dbeafe"
          : text === "Rejected"
          ? "#fee2e2"
          : "#f3f4f6",
      color: "#111827"
    })
  };

  return (
    <div style={styles.page}>
      <div style={styles.top}>
        <div style={styles.title}>Chilanga Cement PLC Careers</div>

        <div style={styles.nav}>
          <button style={styles.btn} onClick={() => setTab("jobs")}>
            Jobs
          </button>
          <button style={styles.btnLight} onClick={() => setTab("apply")}>
            Apply
          </button>
          <button style={styles.btnLight} onClick={() => setTab("dashboard")}>
            Recruiter Dashboard
          </button>
        </div>
      </div>

      {tab === "jobs" && (
        <div>
          <h2>Open Positions</h2>
          <div style={styles.grid}>
            {jobs.map((job) => (
              <div key={job.id} style={styles.card}>
                <h3>{job.title}</h3>
                <p><strong>Location:</strong> {job.location}</p>
                <p>{job.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "apply" && (
        <div style={{ ...styles.card, maxWidth: "650px" }}>
          <h2>Application Form</h2>

          <input style={styles.input} placeholder="Full Name"
            value={form.full_name}
            onChange={(e)=>setForm({...form, full_name:e.target.value})} />

          <input style={styles.input} placeholder="Email"
            value={form.email}
            onChange={(e)=>setForm({...form, email:e.target.value})} />

          <input style={styles.input} placeholder="Phone"
            value={form.phone}
            onChange={(e)=>setForm({...form, phone:e.target.value})} />

          <input style={styles.input} placeholder="Qualification"
            value={form.qualification}
            onChange={(e)=>setForm({...form, qualification:e.target.value})} />

          <input style={styles.input} placeholder="Skills"
            value={form.skills}
            onChange={(e)=>setForm({...form, skills:e.target.value})} />

          <button style={styles.btn} onClick={submitApplication}>
            Submit Application
          </button>
        </div>
      )}

      {tab === "dashboard" && (
        <div>
          <h2>Recruiter Dashboard</h2>

          <div style={{ ...styles.grid, marginBottom: "16px" }}>
            <div style={styles.card}>
              <div>Total Applicants</div>
              <h1>{stats.total}</h1>
            </div>
            <div style={styles.card}>
              <div>Shortlisted</div>
              <h1>{stats.shortlisted}</h1>
            </div>
            <div style={styles.card}>
              <div>Hired</div>
              <h1>{stats.hired}</h1>
            </div>
            <div style={styles.card}>
              <div>Average Score</div>
              <h1>{stats.avgScore}%</h1>
            </div>
          </div>

          <div style={{ ...styles.card, marginBottom: "16px" }}>
            <div style={styles.grid}>
              <input
                style={styles.input}
                placeholder="Search applicant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                style={styles.input}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>New</option>
                <option>Shortlisted</option>
                <option>Interview</option>
                <option>Rejected</option>
                <option>Hired</option>
              </select>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Candidate</th>
                    <th style={styles.th}>Qualification</th>
                    <th style={styles.th}>Skills</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((a) => (
                    <tr key={a.id}>
                      <td style={styles.td}>
                        <strong>{a.full_name}</strong><br />
                        {a.email}<br />
                        {a.phone}
                      </td>
                      <td style={styles.td}>{a.qualification}</td>
                      <td style={styles.td}>{a.skills}</td>
                      <td style={styles.td}>{a.score}%</td>
                      <td style={styles.td}>
                        <span style={styles.badge(a.status)}>
                          {a.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <select
                          value={a.status}
                          onChange={(e) =>
                            updateStatus(a.id, e.target.value)
                          }
                        >
                          <option>New</option>
                          <option>Shortlisted</option>
                          <option>Interview</option>
                          <option>Rejected</option>
                          <option>Hired</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {filteredApps.length === 0 && (
                    <tr>
                      <td style={styles.td} colSpan="6">
                        No matching applicants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
