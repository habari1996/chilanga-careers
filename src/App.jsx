// REPLACE ENTIRE src/App.jsx WITH THIS ENTERPRISE VERSION
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

const qualifications = [
  "Certificate",
  "Diploma",
  "Advanced Diploma",
  "Bachelor's Degree",
  "Postgraduate Diploma",
  "Master's Degree",
  "PhD",
  "Professional Qualification",
  "Other"
];

const institutions = [
  "University of Zambia (UNZA)",
  "Copperbelt University (CBU)",
  "Mulungushi University",
  "Kwame Nkrumah University",
  "Mukuba University",
  "Chalimbana University",
  "ZCAS University",
  "Cavendish University Zambia",
  "Northrise University",
  "Eden University",
  "Zambia Open University",
  "Other"
];

const departments = [
  "Engineering",
  "Accounting",
  "Human Resources",
  "Marketing",
  "Purchasing & Supply",
  "IT",
  "Operations"
];

export default function App() {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    nrc: "",
    dob: "",
    age: "",
    gender: "",
    nationality: "Zambian",
    address: "",
    town: "",
    province: "",
    email: "",
    phone: "",
    alt_phone: "",
    qualification: "",
    degree_title: "",
    field_of_study: "",
    institution: "",
    graduation_year: "",
    gpa: "",
    department: "",
    motivation: "",
    start_date: "",
    relocate: "",
    experience: "",
    certifications: "",
    skills: "",
    languages: "",
    right_to_work: "",
    criminal_record: "",
    age_confirm: "",
    status: "New",
    score: 0,
    cv_url: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: jobsData } = await supabase.from("jobs").select("*").order("id");
    const { data: appData } = await supabase.from("applications").select("*").order("id", { ascending: false });
    setJobs(jobsData || []);
    setApps(appData || []);
  }

  function calcAge(dateString) {
    if (!dateString) return "";
    const dob = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age.toString();
  }

  function calculateScore(data) {
    let score = 0;

    const age = parseInt(data.age || "0");
    if (age > 0 && age <= 25) score += 30;

    if (data.qualification.includes("Bachelor")) score += 25;
    else if (data.qualification.includes("Diploma")) score += 15;
    else if (data.qualification.includes("Master")) score += 30;

    if (data.skills && data.skills.length > 3) score += 20;
    if (data.experience) score += 10;
    if (data.right_to_work === "Yes") score += 10;
    if (data.criminal_record === "No") score += 5;

    return Math.min(score, 100);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };

    if (name === "dob") {
      updated.age = calcAge(value);
    }

    updated.score = calculateScore(updated);
    setForm(updated);
  }

  async function uploadCV(file) {
    if (!file) return "";

    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("cvs").upload(fileName, file);

    if (error) {
      console.error(error);
      alert("CV upload failed");
      return "";
    }

    const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function submitApplication() {
    setLoading(true);

    const fileInput = document.getElementById("cvFile");
    const file = fileInput?.files?.[0];

    let cvUrl = "";
    if (file) cvUrl = await uploadCV(file);

    const payload = {
      ...form,
      cv_url: cvUrl,
      score: calculateScore(form)
    };

    const { error } = await supabase.from("applications").insert(payload);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Submission failed");
      return;
    }

    alert("Application submitted successfully");
    setTab("dashboard");
    loadData();
  }

  async function updateStatus(id, status) {
    await supabase.from("applications").update({ status }).eq("id", id);
    loadData();
  }

  function exportCSV() {
    const rows = [
      ["Name", "Email", "Qualification", "Institution", "Score", "Status"]
    ];

    filteredApps.forEach((a) => {
      rows.push([
        a.full_name,
        a.email,
        a.qualification,
        a.institution,
        a.score,
        a.status
      ]);
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "applicants.csv";
    link.click();
  }

  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      const matchesSearch =
        (a.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.institution || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.skills || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : a.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const total = apps.length;
  const shortlisted = apps.filter((a) => a.status === "Shortlisted").length;
  const hired = apps.filter((a) => a.status === "Hired").length;
  const avgScore =
    apps.length > 0
      ? Math.round(
          apps.reduce((sum, a) => sum + Number(a.score || 0), 0) / apps.length
        )
      : 0;

  const s = {
    page: { fontFamily: "Arial", padding: 20, background: "#f4f6f8", minHeight: "100vh" },
    top: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 20 },
    title: { fontSize: 28, fontWeight: "bold" },
    nav: { display: "flex", gap: 10, flexWrap: "wrap" },
    btn: { padding: "10px 14px", borderRadius: 8, border: "1px solid #2563eb", background: "#2563eb", color: "#fff", cursor: "pointer" },
    btn2: { padding: "10px 14px", borderRadius: 8, border: "1px solid #2563eb", background: "#fff", color: "#2563eb", cursor: "pointer" },
    card: { background: "#fff", padding: 18, borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,.08)", marginBottom: 16 },
    grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
    input: { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db" },
    area: { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db", minHeight: 90 },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: 10, background: "#eef2ff" },
    td: { padding: 10, borderBottom: "1px solid #eee", verticalAlign: "top" },
    h2: { margin: "0 0 12px 0" }
  };

  return (
    <div style={s.page}>
      <div style={s.top}>
        <div style={s.title}>Chilanga Cement PLC Careers</div>
        <div style={s.nav}>
          <button style={tab==="jobs"?s.btn:s.btn2} onClick={() => setTab("jobs")}>Jobs</button>
          <button style={tab==="apply"?s.btn:s.btn2} onClick={() => setTab("apply")}>Apply</button>
          <button style={tab==="dashboard"?s.btn:s.btn2} onClick={() => setTab("dashboard")}>Recruiter Dashboard</button>
        </div>
      </div>

      {tab === "jobs" && (
        <div style={s.card}>
          <h2 style={s.h2}>Open Positions</h2>
          {jobs.map((j) => (
            <div key={j.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 10, marginBottom: 10 }}>
              <strong>{j.title}</strong><br />
              <small>{j.location}</small>
              <p>{j.description}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "apply" && (
        <>
          <div style={s.card}>
            <h2 style={s.h2}>Personal Details</h2>
            <div style={s.grid2}>
              <input name="full_name" placeholder="Full Name" style={s.input} onChange={handleChange}/>
              <input name="nrc" placeholder="NRC / Passport" style={s.input} onChange={handleChange}/>
              <input name="dob" type="date" style={s.input} onChange={handleChange}/>
              <input name="age" placeholder="Age (auto)" value={form.age} readOnly style={s.input}/>
              <select name="gender" style={s.input} onChange={handleChange}><option value="">Gender</option><option>Male</option><option>Female</option></select>
              <input name="nationality" placeholder="Nationality" style={s.input} onChange={handleChange}/>
              <input name="address" placeholder="Address" style={s.input} onChange={handleChange}/>
              <input name="town" placeholder="Town / City" style={s.input} onChange={handleChange}/>
              <input name="province" placeholder="Province" style={s.input} onChange={handleChange}/>
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.h2}>Contact</h2>
            <div style={s.grid2}>
              <input name="email" placeholder="Email" style={s.input} onChange={handleChange}/>
              <input name="phone" placeholder="Phone" style={s.input} onChange={handleChange}/>
              <input name="alt_phone" placeholder="Alternative Phone" style={s.input} onChange={handleChange}/>
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.h2}>Education</h2>
            <div style={s.grid2}>
              <select name="qualification" style={s.input} onChange={handleChange}>
                <option value="">Highest Qualification</option>
                {qualifications.map(q => <option key={q}>{q}</option>)}
              </select>
              <input name="degree_title" placeholder="Degree Title" style={s.input} onChange={handleChange}/>
              <input name="field_of_study" placeholder="Field of Study" style={s.input} onChange={handleChange}/>
              <select name="institution" style={s.input} onChange={handleChange}>
                <option value="">Institution</option>
                {institutions.map(i => <option key={i}>{i}</option>)}
              </select>
              <input name="graduation_year" placeholder="Graduation Year" style={s.input} onChange={handleChange}/>
              <input name="gpa" placeholder="Grade / GPA" style={s.input} onChange={handleChange}/>
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.h2}>Internship Fit</h2>
            <div style={s.grid2}>
              <select name="department" style={s.input} onChange={handleChange}>
                <option value="">Preferred Department</option>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
              <input name="start_date" type="date" style={s.input} onChange={handleChange}/>
              <select name="relocate" style={s.input} onChange={handleChange}>
                <option value="">Willing to Relocate?</option><option>Yes</option><option>No</option>
              </select>
            </div>
            <textarea name="motivation" placeholder="Why do you want to join?" style={s.area} onChange={handleChange}/>
          </div>

          <div style={s.card}>
            <h2 style={s.h2}>Experience</h2>
            <div style={s.grid2}>
              <input name="experience" placeholder="Previous Experience" style={s.input} onChange={handleChange}/>
              <input name="certifications" placeholder="Certifications" style={s.input} onChange={handleChange}/>
              <input name="skills" placeholder="Technical Skills" style={s.input} onChange={handleChange}/>
              <input name="languages" placeholder="Languages" style={s.input} onChange={handleChange}/>
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.h2}>Compliance & Uploads</h2>
            <div style={s.grid2}>
              <select name="right_to_work" style={s.input} onChange={handleChange}><option value="">Right to work?</option><option>Yes</option><option>No</option></select>
              <select name="criminal_record" style={s.input} onChange={handleChange}><option value="">Criminal Record?</option><option>No</option><option>Yes</option></select>
              <input id="cvFile" type="file" accept=".pdf,.doc,.docx" style={s.input}/>
              <input name="score" value={`Auto Score: ${form.score}%`} readOnly style={s.input}/>
            </div>
          </div>

          <button style={s.btn} disabled={loading} onClick={submitApplication}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </>
      )}

      {tab === "dashboard" && (
        <>
          <h2 style={{ marginBottom: 12 }}>Recruiter Dashboard</h2>

          <div style={s.grid4}>
            <div style={s.card}><strong>Total Applicants</strong><h1>{total}</h1></div>
            <div style={s.card}><strong>Shortlisted</strong><h1>{shortlisted}</h1></div>
            <div style={s.card}><strong>Hired</strong><h1>{hired}</h1></div>
            <div style={s.card}><strong>Average Score</strong><h1>{avgScore}%</h1></div>
          </div>

          <div style={s.card}>
            <div style={s.grid2}>
              <input placeholder="Search applicant..." style={s.input} value={search} onChange={(e)=>setSearch(e.target.value)}/>
              <select style={s.input} value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                <option>All</option>
                <option>New</option>
                <option>Shortlisted</option>
                <option>Rejected</option>
                <option>Hired</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <button style={s.btn} onClick={exportCSV}>Export to Excel (CSV)</button>
            </div>
          </div>

          <div style={s.card}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Candidate</th>
                  <th style={s.th}>Qualification</th>
                  <th style={s.th}>Skills</th>
                  <th style={s.th}>Score</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((a) => (
                  <tr key={a.id}>
                    <td style={s.td}>
                      <strong>{a.full_name}</strong><br />
                      {a.email}<br />
                      <small>{a.institution}</small><br />
                      {a.cv_url && (
                        <a href={a.cv_url} target="_blank" rel="noreferrer">View CV</a>
                      )}
                    </td>
                    <td style={s.td}>{a.qualification}</td>
                    <td style={s.td}>{a.skills}</td>
                    <td style={s.td}>{a.score || 0}%</td>
                    <td style={s.td}>{a.status}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button style={s.btn2} onClick={()=>updateStatus(a.id,"Shortlisted")}>Shortlist</button>
                        <button style={s.btn2} onClick={()=>updateStatus(a.id,"Rejected")}>Reject</button>
                        <button style={s.btn2} onClick={()=>updateStatus(a.id,"Hired")}>Hire</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr><td colSpan="6" style={s.td}>No matching applicants found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
