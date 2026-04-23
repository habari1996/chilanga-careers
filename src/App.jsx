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
  const [tab, setTab] = useState("home");
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
    if (data.qualification.includes("Master")) score += 30;
    if (data.skills) score += 20;
    if (data.experience) score += 10;
    if (data.right_to_work === "Yes") score += 10;
    if (data.criminal_record === "No") score += 5;

    return Math.min(score, 100);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };

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

    const payload = {
      ...form,
      cv_url: cvUrl,
      score: calculateScore(form)
    };

    const { error } = await supabase.from("applications").insert(payload);

    setLoading(false);

    if (error) {
      alert("Submission failed");
      console.error(error);
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

  const s = {
    page:{fontFamily:"Arial",background:"#f4f6f8",minHeight:"100vh"},
    nav:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",background:"#111827",color:"#fff",flexWrap:"wrap",gap:10},
    brand:{fontSize:24,fontWeight:"bold"},
    navBtns:{display:"flex",gap:8,flexWrap:"wrap"},
    btn:{padding:"10px 14px",borderRadius:8,border:"none",background:"#f59e0b",color:"#111",cursor:"pointer",fontWeight:"bold"},
    btn2:{padding:"10px 14px",borderRadius:8,border:"1px solid #fff",background:"transparent",color:"#fff",cursor:"pointer"},
    hero:{padding:"70px 24px",background:"linear-gradient(135deg,#111827,#1d4ed8)",color:"#fff",textAlign:"center"},
    heroTitle:{fontSize:42,fontWeight:"bold",marginBottom:10},
    heroText:{fontSize:18,maxWidth:800,margin:"0 auto 20px"},
    section:{padding:"32px 24px"},
    grid3:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16},
    card:{background:"#fff",padding:18,borderRadius:14,boxShadow:"0 2px 8px rgba(0,0,0,.08)"},
    input:{width:"100%",padding:10,borderRadius:8,border:"1px solid #d1d5db"},
    grid2:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12},
    footer:{padding:24,textAlign:"center",background:"#111827",color:"#fff",marginTop:30}
  };

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <div style={s.brand}>Chilanga Cement PLC Careers</div>
        <div style={s.navBtns}>
          <button style={s.btn2} onClick={()=>setTab("home")}>Home</button>
          <button style={s.btn2} onClick={()=>setTab("jobs")}>Jobs</button>
          <button style={s.btn2} onClick={()=>setTab("dashboard")}>Dashboard</button>
          <button style={s.btn} onClick={()=>setTab("apply")}>Apply Now</button>
        </div>
      </div>

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
            <div style={s.grid3}>
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
            <div style={s.grid3}>
              {departments.map((d) => (
                <div key={d} style={s.card}>{d}</div>
              ))}
            </div>
          </div>

          <div style={s.section}>
            <h2>Application Process</h2>
            <div style={s.grid3}>
              <div style={s.card}>1. Apply Online</div>
              <div style={s.card}>2. Screening</div>
              <div style={s.card}>3. Shortlisting</div>
              <div style={s.card}>4. Interview</div>
              <div style={s.card}>5. Offer</div>
            </div>
          </div>
        </>
      )}

      {tab === "jobs" && (
        <div style={s.section}>
          <h2>Open Opportunities</h2>
          <div style={s.grid3}>
            {jobs.map((j)=>(
              <div key={j.id} style={s.card}>
                <strong>{j.title}</strong><br />
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
            <h2>Application Form</h2>
            <div style={s.grid2}>
              <input name="full_name" placeholder="Full Name" style={s.input} onChange={handleChange}/>
              <input name="email" placeholder="Email" style={s.input} onChange={handleChange}/>
              <input name="phone" placeholder="Phone" style={s.input} onChange={handleChange}/>
              <input name="dob" type="date" style={s.input} onChange={handleChange}/>
              <input name="age" value={form.age} readOnly placeholder="Age" style={s.input}/>
              <select name="qualification" style={s.input} onChange={handleChange}>
                <option value="">Qualification</option>
                {qualifications.map(q => <option key={q}>{q}</option>)}
              </select>
              <select name="institution" style={s.input} onChange={handleChange}>
                <option value="">Institution</option>
                {institutions.map(i => <option key={i}>{i}</option>)}
              </select>
              <select name="department" style={s.input} onChange={handleChange}>
                <option value="">Preferred Department</option>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
              <input name="skills" placeholder="Technical Skills" style={s.input} onChange={handleChange}/>
              <input id="cvFile" type="file" style={s.input}/>
              <input value={`Auto Score: ${form.score}%`} readOnly style={s.input}/>
            </div>

            <div style={{marginTop:16}}>
              <button style={s.btn} disabled={loading} onClick={submitApplication}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "dashboard" && (
        <div style={s.section}>
          <h2>Recruiter Dashboard</h2>

          <div style={{...s.card,marginBottom:16}}>
            <div style={s.grid2}>
              <input placeholder="Search applicant..." style={s.input} value={search} onChange={(e)=>setSearch(e.target.value)} />
              <select style={s.input} value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                <option>All</option>
                <option>New</option>
                <option>Shortlisted</option>
                <option>Rejected</option>
                <option>Hired</option>
              </select>
            </div>
            <div style={{marginTop:12}}>
              <button style={s.btn} onClick={exportCSV}>Export CSV</button>
            </div>
          </div>

          <div style={s.card}>
            {filteredApps.map((a)=>(
              <div key={a.id} style={{padding:"12px 0",borderBottom:"1px solid #eee"}}>
                <strong>{a.full_name}</strong> - {a.email}<br />
                {a.qualification} | {a.institution} | Score: {a.score || 0}%<br />
                Status: {a.status}
                <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
                  {a.cv_url && <a href={a.cv_url} target="_blank" rel="noreferrer">View CV</a>}
                  <button style={s.btn2} onClick={()=>updateStatus(a.id,"Shortlisted")}>Shortlist</button>
                  <button style={s.btn2} onClick={()=>updateStatus(a.id,"Rejected")}>Reject</button>
                  <button style={s.btn2} onClick={()=>updateStatus(a.id,"Hired")}>Hire</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.footer}>
        © 2026 Chilanga Cement PLC • Careers Portal
      </div>
    </div>
  );
}
