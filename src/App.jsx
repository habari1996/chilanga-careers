Yes, you are definitely using **Supabase** as your database. 

I can tell because your code imports `createClient` from `@supabase/supabase-js` and initializes it with a specific Supabase URL (`wpynkjowoosxcegtvzvq.supabase.co`).

I have updated your code below to fix the **`available_date`** error by aligning the frontend state and input names with your actual database column name (**`start_date`**). I also cleaned up the `submitApplication` logic to ensure the payload is clean.

### Updated App.js

```javascript
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initializing Supabase Connection
const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

export default function App() {
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // FIX: Changed available_date to start_date to match your SQL schema
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    institution: "",
    skills: "",
    age: "",
    start_date: "", 
    score: 0,
    status: "New",
    cv_url: ""
  });

  useEffect(() => {
    loadData();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData() {
    const { data: jobsData } = await supabase.from("jobs").select("*").order("id");
    const { data: appData } = await supabase.from("applications").select("*").order("id", { ascending: false });
    setJobs(jobsData || []);
    setApps(appData || []);
  }

  function calculateScore(data) {
    let score = 0;
    if (data.qualification?.includes("Bachelor")) score += 30;
    if (data.skills) score += 20;
    return Math.min(score, 100);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
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

    // The payload now correctly uses start_date from the form state
    const payload = { ...form, cv_url: cvUrl, score: calculateScore(form) };

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("email", form.email)
      .limit(1);

    if (existing && existing.length > 0) {
      setLoading(false);
      alert("An application with this email address already exists.");
      return;
    }

    const { error } = await supabase.from("applications").insert(payload);
    setLoading(false);

    if (error) {
      alert("Submission failed: " + error.message);
      return;
    }

    setSubmitted(true);
    setTab("confirmation");
    loadData();
  }

  async function updateStatus(id, status) {
    await supabase.from("applications").update({ status }).eq("id", id);
    loadData();
  }

  async function signUp() {
    setAuthMessage("");
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { data: { full_name: authName } }
    });
    if (error) { setAuthMessage(error.message); return; }
    setAuthMessage("Account created successfully.");
    setAuthMode("login");
  }

  async function signIn() {
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword
    });
    if (error) { setAuthMessage(error.message); return; }
    setTab("home");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setTab("home");
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
        (a.email || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" ? true : a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const isHR =
    session?.user?.email === "hr@chilanga.com" ||
    session?.user?.email?.endsWith("@chilanga.com");

  const s = {
    page:{background:"#f8fafc",minHeight:"100vh",fontFamily:"Arial,sans-serif"},
    wrap:{maxWidth:"1200px",margin:"0 auto",padding:"0 16px"},
    nav:{background:"#0f172a",color:"#fff"},
    navInner:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",padding:"14px 0"},
    navBtns:{display:"flex",gap:8,flexWrap:"wrap"},
    btn:{padding:"10px 14px",border:"none",borderRadius:10,background:"#f59e0b",fontWeight:"bold",cursor:"pointer"},
    btnGhost:{padding:"10px 14px",border:"1px solid #cbd5e1",borderRadius:10,background:"#fff",cursor:"pointer"},
    card:{background:"#fff",padding:18,borderRadius:16,boxShadow:"0 8px 24px rgba(15,23,42,.08)"},
    input:{width:"100%",padding:11,border:"1px solid #dbe2ea",borderRadius:10,boxSizing:"border-box",marginBottom:10},
    label:{display:"block",marginBottom:4,fontWeight:"600",fontSize:14,color:"#374151"},
    section:{padding:"28px 0"},
    grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16},
    footer:{marginTop:30,background:"#0f172a",color:"#fff",padding:"24px 0",textAlign:"center"}
  };

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <div style={s.wrap}>
          <div style={s.navInner}>
            <strong>Chilanga Cement PLC Careers</strong>
            <div style={s.navBtns}>
              <button style={s.btnGhost} onClick={() => setTab("home")}>Home</button>
              <button style={s.btnGhost} onClick={() => setTab("jobs")}>Jobs</button>
              <button style={s.btn} onClick={() => setTab("apply")}>Apply Now</button>
              {!session && (
                <button style={s.btnGhost} onClick={() => setTab("auth")}>Login</button>
              )}
              {session && isHR && (
                <button style={s.btnGhost} onClick={() => setTab("dashboard")}>Dashboard</button>
              )}
              {session && (
                <button style={s.btnGhost} onClick={signOut}>Logout</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={s.wrap}>
        {tab === "home" && (
          <div style={s.section}>
            <div style={s.card}>
              <h1>Chilanga Cement Step Up Program 2026</h1>
              <p>Launch your career with Zambia's leading cement manufacturer. Join our Graduate Trainee &amp; Internship Program and gain real industry experience.</p>
              <button style={s.btn} onClick={() => setTab("apply")}>Start Application</button>
            </div>
          </div>
        )}

        {tab === "jobs" && (
          <div style={s.section}>
            <h2>Open Opportunities</h2>
            <div style={s.grid}>
              {jobs.map((j) => (
                <div key={j.id} style={s.card}>
                  <h3>{j.title}</h3>
                  <p>{j.location}</p>
                  <p>{j.description}</p>
                  <button style={s.btn} onClick={() => setTab("apply")}>Apply</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "apply" && (
          <div style={s.section}>
            <div style={s.card}>
              <h2>Graduate Trainee Application — Step Up Program 2026</h2>

              <label style={s.label}>Full Name</label>
              <input name="full_name" placeholder="Full Name" style={s.input} onChange={handleChange} />

              <label style={s.label}>Email Address</label>
              <input name="email" placeholder="Email" style={s.input} onChange={handleChange} />

              <label style={s.label}>Phone Number</label>
              <input name="phone" placeholder="Phone" style={s.input} onChange={handleChange} />

              <label style={s.label}>Highest Qualification</label>
              <input name="qualification" placeholder="e.g. Bachelor of Engineering" style={s.input} onChange={handleChange} />

              <label style={s.label}>Institution</label>
              <input name="institution" placeholder="University / College" style={s.input} onChange={handleChange} />

              <label style={s.label}>Technical Skills</label>
              <input name="skills" placeholder="e.g. AutoCAD, Excel, Python" style={s.input} onChange={handleChange} />

              <label style={s.label}>Available Start Date</label>
              {/* FIX: name property changed to start_date */}
              <input name="start_date" type="date" style={s.input} onChange={handleChange} />

              <label style={s.label}>Upload CV (PDF or Word)</label>
              <input id="cvFile" type="file" accept=".pdf,.doc,.docx" style={s.input} />

              <button style={s.btn} disabled={loading} onClick={submitApplication}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        )}

        {tab === "confirmation" && (
          <div style={s.section}>
            <div style={{...s.card, maxWidth:560, margin:"0 auto", textAlign:"center"}}>
              <div style={{fontSize:64, marginBottom:16}}>&#x2705;</div>
              <h2 style={{color:"#16a34a"}}>Application Submitted!</h2>
              <p style={{marginBottom:8}}>Thank you for applying to the <strong>Chilanga Cement Step Up Program 2026</strong>.</p>
              <p style={{marginBottom:24, color:"#6b7280"}}>
                Your application has been received. Our HR team will review it and contact you at the email address you provided.
              </p>
              <button style={s.btn} onClick={() => setTab("home")}>Back to Home</button>
            </div>
          </div>
        )}

        {tab === "auth" && (
          <div style={s.section}>
            <div style={{...s.card, maxWidth:420, margin:"0 auto"}}>
              <h2>{authMode === "login" ? "HR Login" : "Create Account"}</h2>
              {authMode === "signup" && (
                <input style={s.input} placeholder="Full Name" value={authName} onChange={(e)=>setAuthName(e.target.value)} />
              )}
              <input style={s.input} placeholder="Email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} />
              <input style={s.input} type="password" placeholder="Password" value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} />
              <button style={s.btn} onClick={authMode === "login" ? signIn : signUp}>
                {authMode === "login" ? "Login" : "Create Account"}
              </button>
              <div style={{marginTop:10}}>
                <button style={s.btnGhost} onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                  {authMode === "login" ? "Need an account?" : "Already have an account?"}
                </button>
              </div>
              {authMessage && <p style={{color: authMessage.includes("success") ? "green" : "red", marginTop:10}}>{authMessage}</p>}
            </div>
          </div>
        )}

        {tab === "dashboard" && session && isHR && (
          <div style={s.section}>
            <div style={s.card}>
              <h2>Recruiter Dashboard</h2>
              <input style={s.input} placeholder="Search applicant..." value={search} onChange={(e)=>setSearch(e.target.value)} />
              <button style={s.btn} onClick={exportCSV}>Export CSV</button>

              <div style={{display:"flex",gap:8,marginTop:12,marginBottom:12,flexWrap:"wrap"}}>
                {["All","New","Shortlisted","Rejected","Hired"].map(st => (
                  <button
                    key={st}
                    style={{...s.btnGhost, background: statusFilter===st?"#0f172a":"#fff", color: statusFilter===st?"#fff":"#000"}}
                    onClick={() => setStatusFilter(st)}
                  >{st} ({apps.filter(a => st==="All" ? true : a.status===st).length})</button>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
                {[
                  {label:"Total", value:apps.length},
                  {label:"Shortlisted", value:apps.filter(a=>a.status==="Shortlisted").length},
                  {label:"Hired", value:apps.filter(a=>a.status==="Hired").length},
                  {label:"Rejected", value:apps.filter(a=>a.status==="Rejected").length},
                ].map(stat => (
                  <div key={stat.label} style={{...s.card, textAlign:"center"}}>
                    <div style={{fontSize:28, fontWeight:"bold"}}>{stat.value}</div>
                    <div style={{fontSize:13, color:"#6b7280"}}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:20}}>
                {filteredApps.map((a) => (
                  <div
                    key={a.id}
                    style={{...s.card, marginBottom:12, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}}
                    onClick={() => setSelectedApplicant(a)}
                  >
                    <div>
                      <strong>{a.full_name}</strong><br />
                      <span style={{fontSize:13, color:"#6b7280"}}>{a.email}</span>
                    </div>
                    <div style={{textAlign:"right", fontSize:13}}>
                      <div>{a.qualification}</div>
                      <div>Score: {a.score}%</div>
                      <div style={{background: a.status==="Hired"?"#dcfce7":a.status==="Rejected"?"#fee2e2":a.status==="Shortlisted"?"#dbeafe":"#f3f4f6", padding:"2px 8px", borderRadius:8, display:"inline-block", marginTop:4}}>{a.status}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedApplicant && (
                <div style={{position:"fixed",top:0,right:0,width:400,height:"100vh",background:"#fff",boxShadow:"-4px 0 20px rgba(0,0,0,.15)",overflowY:"auto",padding:24,zIndex:1000}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{margin:0}}>Candidate Profile</h3>
                    <button style={s.btnGhost} onClick={() => setSelectedApplicant(null)}>Close</button>
                  </div>
                  <div style={{...s.card, marginBottom:12}}>
                    <h4 style={{margin:"0 0 8px"}}>Personal Details</h4>
                    <p><strong>Name:</strong> {selectedApplicant.full_name}</p>
                    <p><strong>Email:</strong> {selectedApplicant.email}</p>
                    <p><strong>Phone:</strong> {selectedApplicant.phone || "-"}</p>
                  </div>
                  <div style={{...s.card, marginBottom:12}}>
                    <h4 style={{margin:"0 0 8px"}}>Education</h4>
                    <p><strong>Qualification:</strong> {selectedApplicant.qualification || "-"}</p>
                    <p><strong>Institution:</strong> {selectedApplicant.institution || "-"}</p>
                  </div>
                  <div style={{...s.card, marginBottom:12}}>
                    <h4 style={{margin:"0 0 8px"}}>Skills &amp; Score</h4>
                    <p><strong>Skills:</strong> {selectedApplicant.skills || "-"}</p>
                    <p><strong>Score:</strong> {selectedApplicant.score}%</p>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:16}}>
                    <button style={s.btnGhost} onClick={() => updateStatus(selectedApplicant.id,"Shortlisted")}>Shortlist</button>
                    <button style={s.btnGhost} onClick={() => updateStatus(selectedApplicant.id,"Rejected")}>Reject</button>
                    <button style={s.btn} onClick={() => updateStatus(selectedApplicant.id,"Hired")}>Hire</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "dashboard" && (!session || !isHR) && (
          <div style={s.section}>
            <div style={{...s.card, maxWidth:420, margin:"0 auto", textAlign:"center"}}>
              <h2>&#x1F512; Restricted Access</h2>
              <p>The Recruiter Dashboard is only accessible to authorised HR staff.</p>
              <button style={s.btn} onClick={() => setTab("auth")}>Login as HR</button>
            </div>
          </div>
        )}
      </div>

      <div style={s.footer}>
        &#169; 2026 Chilanga Cement PLC &#x2022; Careers Portal
      </div>
    </div>
  );
}
```
