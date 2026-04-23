import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

const qualifications = [
  "Certificate","Diploma","Advanced Diploma","Bachelor's Degree",
  "Postgraduate Diploma","Master's Degree","PhD","Professional Qualification","Other"
];

const institutions = [
  "University of Zambia (UNZA)","Copperbelt University (CBU)","Mulungushi University",
  "Kwame Nkrumah University","Mukuba University","Chalimbana University",
  "ZCAS University","Cavendish University Zambia","Northrise University",
  "Eden University","Zambia Open University","Other"
];

const departments = [
  "Engineering","Accounting","Human Resources","Marketing",
  "Purchasing & Supply","IT","Operations"
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [form, setForm] = useState({
    full_name: "", nrc: "", dob: "", age: "", gender: "",
    nationality: "Zambian", address: "", town: "", province: "",
    email: "", phone: "", alt_phone: "", qualification: "",
    degree_title: "", field_of_study: "", institution: "",
    graduation_year: "", gpa: "", department: "", motivation: "",
    start_date: "", relocate: "", experience: "", certifications: "",
    skills: "", languages: "", right_to_work: "", criminal_record: "",
    age_confirm: "", status: "New", score: 0, cv_url: ""
  });

  useEffect(() => { loadData(); }, []);

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
    if (data.qualification.includes("Master")) score += 30;
    if (data.skills) score += 20;
    if (data.experience) score += 10;
    if (data.right_to_work === "Yes") score += 10;
    if (data.criminal_record === "No") score += 5;
    return Math.min(score, 100);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === "dob") updated.age = calcAge(value);
    updated.score = calculateScore(updated);
    setForm(updated);
  }

  async function uploadCV(file) {
    if (!file) return "";
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("cvs").upload(fileName, file);
    if (error) return "";
    const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function submitApplication() {
    setLoading(true);
    const file = document.getElementById("cvFile")?.files?.[0];
    const cvUrl = file ? await uploadCV(file) : "";
    const payload = { ...form, cv_url: cvUrl, score: calculateScore(form) };
    const { error } = await supabase.from("applications").insert(payload);
    setLoading(false);

    if (error) {
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
    const rows = [["Name","Email","Qualification","Institution","Score","Status"]];
    filteredApps.forEach((a) => {
      rows.push([a.full_name,a.email,a.qualification,a.institution,a.score,a.status]);
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

  const s = {
    page:{background:"#f8fafc",minHeight:"100vh",fontFamily:"Arial,sans-serif",color:"#0f172a"},
    wrap:{maxWidth:"1200px",margin:"0 auto",padding:"0 16px"},
    nav:{background:"#0f172a",color:"#fff",position:"sticky",top:0,zIndex:20},
    navInner:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",padding:"14px 0"},
    brand:{fontSize:"clamp(20px,2vw,26px)",fontWeight:"bold"},
    navBtns:{display:"flex",gap:8,flexWrap:"wrap"},
    btn:{padding:"10px 14px",border:"none",borderRadius:10,background:"#f59e0b",fontWeight:"bold",cursor:"pointer"},
    btnGhost:{padding:"10px 14px",border:"1px solid #cbd5e1",borderRadius:10,background:"#fff",cursor:"pointer"},
    hero:{
      marginTop:20,borderRadius:20,padding:"clamp(40px,7vw,90px) 24px",
      background:"linear-gradient(rgba(15,23,42,.78),rgba(30,64,175,.75)),url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80') center/cover",
      color:"#fff",textAlign:"center"
    },
    heroTitle:{fontSize:"clamp(30px,6vw,52px)",fontWeight:800,lineHeight:1.1},
    heroText:{maxWidth:760,margin:"14px auto 24px",lineHeight:1.6,fontSize:"clamp(15px,2vw,18px)"},
    section:{padding:"28px 0"},
    grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16},
    card:{background:"#fff",padding:18,borderRadius:16,boxShadow:"0 8px 24px rgba(15,23,42,.08)"},
    input:{width:"100%",padding:11,border:"1px solid #dbe2ea",borderRadius:10,boxSizing:"border-box"},
    grid2:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12},
    footer:{marginTop:30,background:"#0f172a",color:"#fff",padding:"24px 0",textAlign:"center"},
    tag:{display:"inline-block",padding:"4px 10px",background:"#e0f2fe",borderRadius:999,fontSize:12}
  };

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <div style={s.wrap}>
          <div style={s.navInner}>
            <div style={s.brand}>Chilanga Cement PLC Careers</div>
            <div style={s.navBtns}>
              <button style={s.btnGhost} onClick={()=>setTab("home")}>Home</button>
              <button style={s.btnGhost} onClick={()=>setTab("jobs")}>Jobs</button>
              <button style={s.btnGhost} onClick={()=>setTab("dashboard")}>Dashboard</button>
              <button style={s.btn} onClick={()=>setTab("apply")}>Apply Now</button>
            </div>
          </div>
        </div>
      </div>

      <div style={s.wrap}>
        {tab === "home" && (
          <>
            <div style={s.hero}>
              <div style={s.heroTitle}>Chilanga Cement Step Up Program 2026</div>
              <div style={s.heroText}>
                Launch your career with Zambia’s leading cement manufacturer.
                Join our Graduate Trainee & Internship Program and gain real industry experience.
              </div>
              <button style={s.btn} onClick={()=>setTab("apply")}>Start Application</button>
            </div>

            <div style={s.section}>
              <h2>Why Join Us</h2>
              <div style={s.grid}>
                <div style={s.card}>12-month structured development program</div>
                <div style={s.card}>Mentorship from experienced professionals</div>
                <div style={s.card}>Real work experience in industry</div>
                <div style={s.card}>Career growth opportunities</div>
                <div style={s.card}>Professional skills development</div>
                <div style={s.card}>Exposure to a leading manufacturing business</div>
              </div>
            </div>

            <div style={s.section}>
              <h2>Fields We Recruit</h2>
              <div style={s.grid}>
                {departments.map((d) => <div key={d} style={s.card}>{d}</div>)}
              </div>
            </div>
          </>
        )}

        {tab === "jobs" && (
          <div style={s.section}>
            <h2>Open Opportunities</h2>
            <div style={s.grid}>
              {jobs.map((j) => (
                <div key={j.id} style={s.card}>
                  <span style={s.tag}>Open</span>
                  <h3>{j.title}</h3>
                  <small>{j.location}</small>
                  <p>{j.description}</p>
                  <button style={s.btn} onClick={()=>setTab("apply")}>Apply</button>
                </div>
              ))}
            </div>
          </div>
        )}

       {tab === "apply" && (
  <div style={s.section}>
    <div style={s.card}>
      <h2 style={{ marginTop: 0 }}>Enterprise Application Form</h2>

      {/* PERSONAL DETAILS */}
      <h3>Personal Details</h3>
      <div style={s.grid2}>
        <input name="full_name" placeholder="Full Name" style={s.input} onChange={handleChange} />
        <input name="nrc" placeholder="NRC / Passport" style={s.input} onChange={handleChange} />
        <input name="dob" type="date" style={s.input} onChange={handleChange} />
        <input name="age" value={form.age} readOnly placeholder="Age" style={s.input} />
        <select name="gender" style={s.input} onChange={handleChange}>
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>
        <input name="nationality" placeholder="Nationality" style={s.input} onChange={handleChange} />

        <input name="address" placeholder="Residential Address" style={s.input} onChange={handleChange} />
        <input name="town" placeholder="Town / City" style={s.input} onChange={handleChange} />
        <input name="province" placeholder="Province" style={s.input} onChange={handleChange} />
      </div>

      {/* CONTACT */}
      <h3 style={{ marginTop: 25 }}>Contact Information</h3>
      <div style={s.grid2}>
        <input name="email" placeholder="Email" style={s.input} onChange={handleChange} />
        <input name="phone" placeholder="Phone Number" style={s.input} onChange={handleChange} />
        <input name="alt_phone" placeholder="Alternative Phone" style={s.input} onChange={handleChange} />
      </div>

      {/* EDUCATION */}
      <h3 style={{ marginTop: 25 }}>Education</h3>
      <div style={s.grid2}>
        <select name="qualification" style={s.input} onChange={handleChange}>
          <option value="">Highest Qualification</option>
          {qualifications.map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>

        <input name="degree_title" placeholder="Degree Title" style={s.input} onChange={handleChange} />
        <input name="field_of_study" placeholder="Field of Study" style={s.input} onChange={handleChange} />

        <select name="institution" style={s.input} onChange={handleChange}>
          <option value="">Institution</option>
          {institutions.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>

        <input name="graduation_year" placeholder="Graduation Year" style={s.input} onChange={handleChange} />
        <input name="gpa" placeholder="Grade / GPA" style={s.input} onChange={handleChange} />
      </div>

      {/* INTERNSHIP FIT */}
      <h3 style={{ marginTop: 25 }}>Internship Fit</h3>
      <div style={s.grid2}>
        <select name="department" style={s.input} onChange={handleChange}>
          <option value="">Preferred Department</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <input name="start_date" type="date" style={s.input} onChange={handleChange} />

        <select name="relocate" style={s.input} onChange={handleChange}>
          <option value="">Willing to Relocate?</option>
          <option>Yes</option>
          <option>No</option>
        </select>
      </div>

      <textarea
        name="motivation"
        placeholder="Why do you want to join the Step Up Program?"
        rows="4"
        style={{ ...s.input, marginTop: 10 }}
        onChange={handleChange}
      />

      {/* EXPERIENCE */}
      <h3 style={{ marginTop: 25 }}>Experience</h3>
      <div style={s.grid2}>
        <input name="experience" placeholder="Previous Internship / Work Experience" style={s.input} onChange={handleChange} />
        <input name="certifications" placeholder="Certifications" style={s.input} onChange={handleChange} />
        <input name="skills" placeholder="Technical Skills" style={s.input} onChange={handleChange} />
        <input name="languages" placeholder="Languages Spoken" style={s.input} onChange={handleChange} />
      </div>

      {/* COMPLIANCE */}
      <h3 style={{ marginTop: 25 }}>Compliance Questions</h3>
      <div style={s.grid2}>
        <select name="age_confirm" style={s.input} onChange={handleChange}>
          <option value="">Are you 25 years or below?</option>
          <option>Yes</option>
          <option>No</option>
        </select>

        <select name="right_to_work" style={s.input} onChange={handleChange}>
          <option value="">Do you have right to work in Zambia?</option>
          <option>Yes</option>
          <option>No</option>
        </select>

        <select name="criminal_record" style={s.input} onChange={handleChange}>
          <option value="">Any criminal record?</option>
          <option>No</option>
          <option>Yes</option>
        </select>
      </div>

      {/* UPLOADS */}
      <h3 style={{ marginTop: 25 }}>Uploads</h3>
      <div style={s.grid2}>
        <div>
          <label>CV</label>
          <input id="cvFile" type="file" style={s.input} />
        </div>

        <div>
          <label>Cover Letter</label>
          <input type="file" style={s.input} />
        </div>

        <div>
          <label>Academic Results</label>
          <input type="file" style={s.input} />
        </div>

        <div>
          <label>NRC Copy</label>
          <input type="file" style={s.input} />
        </div>
      </div>

      {/* SCORE */}
      <div style={{ marginTop: 20 }}>
        <input
          value={`Auto Candidate Score: ${form.score}%`}
          readOnly
          style={s.input}
        />
      </div>

      {/* SUBMIT */}
      <div style={{ marginTop: 20 }}>
        <button
          style={s.btn}
          disabled={loading}
          onClick={submitApplication}
        >
          {loading ? "Submitting..." : "Submit Enterprise Application"}
        </button>
      </div>
    </div>
  </div>
)}
{tab === "dashboard" && (
  <div style={s.section}>
    <h2>Recruiter Dashboard</h2>

    {/* top controls */}
    <div style={{ ...s.card, marginBottom: 16 }}>
      <div style={s.grid2}>
        <input
          placeholder="Search applicant..."
          style={s.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={s.input}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>New</option>
          <option>Shortlisted</option>
          <option>Rejected</option>
          <option>Hired</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <button style={s.btn} onClick={exportCSV}>
          Export CSV
        </button>
      </div>
    </div>

    {/* KPI cards */}
    <div style={s.grid}>
      <div style={s.card}>
        <strong>Total Applicants</strong>
        <h1>{apps.length}</h1>
      </div>

      <div style={s.card}>
        <strong>Shortlisted</strong>
        <h1>{apps.filter(a => a.status === "Shortlisted").length}</h1>
      </div>

      <div style={s.card}>
        <strong>Hired</strong>
        <h1>{apps.filter(a => a.status === "Hired").length}</h1>
      </div>

      <div style={s.card}>
        <strong>Rejected</strong>
        <h1>{apps.filter(a => a.status === "Rejected").length}</h1>
      </div>
    </div>

    {/* candidates list */}
    <div style={{ marginTop: 20 }}>
      {filteredApps.map((a) => (
        <div
          key={a.id}
          style={{
            ...s.card,
            marginBottom: 14,
            cursor: "pointer"
          }}
          onClick={() => setSelectedApplicant(a)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 10,
              alignItems: "center"
            }}
          >
            <div>
              <strong>{a.full_name}</strong><br />
              <small>{a.email}</small>
            </div>

            <div>{a.qualification || "-"}</div>

            <div>Score: {a.score || 0}%</div>

            <div>
              <span style={s.tag}>{a.status || "New"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* drawer modal */}
    {selectedApplicant && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.45)",
          zIndex: 999,
          display: "flex",
          justifyContent: "flex-end"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#fff",
            height: "100vh",
            overflowY: "auto",
            padding: 20,
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18
            }}
          >
            <h2 style={{ margin: 0 }}>Candidate Profile</h2>

            <button
              style={s.btnGhost}
              onClick={() => setSelectedApplicant(null)}
            >
              Close
            </button>
          </div>

          {/* personal */}
          <div style={s.card}>
            <h3>Personal Details</h3>
            <p><strong>Name:</strong> {selectedApplicant.full_name}</p>
            <p><strong>NRC:</strong> {selectedApplicant.nrc || "-"}</p>
            <p><strong>Gender:</strong> {selectedApplicant.gender || "-"}</p>
            <p><strong>Age:</strong> {selectedApplicant.age || "-"}</p>
            <p><strong>Nationality:</strong> {selectedApplicant.nationality || "-"}</p>
            <p><strong>Phone:</strong> {selectedApplicant.phone || "-"}</p>
            <p><strong>Email:</strong> {selectedApplicant.email || "-"}</p>
            <p><strong>Address:</strong> {selectedApplicant.address || "-"}</p>
          </div>

          {/* education */}
          <div style={{ ...s.card, marginTop: 14 }}>
            <h3>Education</h3>
            <p><strong>Qualification:</strong> {selectedApplicant.qualification || "-"}</p>
            <p><strong>Degree:</strong> {selectedApplicant.degree_title || "-"}</p>
            <p><strong>Field:</strong> {selectedApplicant.field_of_study || "-"}</p>
            <p><strong>Institution:</strong> {selectedApplicant.institution || "-"}</p>
            <p><strong>Year:</strong> {selectedApplicant.graduation_year || "-"}</p>
            <p><strong>GPA:</strong> {selectedApplicant.gpa || "-"}</p>
          </div>

          {/* experience */}
          <div style={{ ...s.card, marginTop: 14 }}>
            <h3>Experience</h3>
            <p><strong>Experience:</strong> {selectedApplicant.experience || "-"}</p>
            <p><strong>Certifications:</strong> {selectedApplicant.certifications || "-"}</p>
            <p><strong>Skills:</strong> {selectedApplicant.skills || "-"}</p>
            <p><strong>Languages:</strong> {selectedApplicant.languages || "-"}</p>
          </div>

          {/* compliance */}
          <div style={{ ...s.card, marginTop: 14 }}>
            <h3>Compliance</h3>
            <p><strong>Age ≤ 25:</strong> {selectedApplicant.age_confirm || "-"}</p>
            <p><strong>Right to Work:</strong> {selectedApplicant.right_to_work || "-"}</p>
            <p><strong>Criminal Record:</strong> {selectedApplicant.criminal_record || "-"}</p>
          </div>

          {/* documents */}
          <div style={{ ...s.card, marginTop: 14 }}>
            <h3>Documents</h3>

            {selectedApplicant.cv_url ? (
              <p>
                <a
                  href={selectedApplicant.cv_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View CV
                </a>
              </p>
            ) : <p>No CV uploaded</p>}
          </div>

          {/* actions */}
          <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              style={s.btnGhost}
              onClick={() => updateStatus(selectedApplicant.id, "Shortlisted")}
            >
              Shortlist
            </button>

            <button
              style={s.btnGhost}
              onClick={() => updateStatus(selectedApplicant.id, "Rejected")}
            >
              Reject
            </button>

            <button
              style={s.btn}
              onClick={() => updateStatus(selectedApplicant.id, "Hired")}
            >
              Hire
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}
        
      </div>

      <div style={s.footer}>
        © 2026 Chilanga Cement PLC • Careers Portal
      </div>
    </div>
  );
}
