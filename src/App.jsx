import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    institution: "",
    skills: "",
    age: "",
    score: 0,
    status: "New",
    cv_url: ""
  });

  useEffect(() => {
    loadData();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_e, session) => {
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

    const payload = {
      ...form,
      cv_url: cvUrl,
      score: calculateScore(form)
    };

    const { error } = await supabase.from("applications").insert(payload);

    setLoading(false);

    if (error) {
      alert("Submission failed");
      return;
    }

    alert("Application submitted successfully");
    setTab("home");
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
      options: {
        data: { full_name: authName }
      }
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Account created successfully.");
    setAuthMode("login");
  }

  async function signIn() {
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

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

      const matchesStatus =
        statusFilter === "All" ? true : a.status === statusFilter;

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
              <button style={s.btn} onClick={() => setTab("apply")}>Apply</button>

              {!session && (
                <button style={s.btnGhost} onClick={() => setTab("auth")}>
                  Login
                </button>
              )}

              {session && isHR && (
                <button style={s.btnGhost} onClick={() => setTab("dashboard")}>
                  Dashboard
                </button>
              )}

              {session && (
                <button style={s.btnGhost} onClick={signOut}>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={s.wrap}>
        {tab === "home" && (
          <div style={s.section}>
            <div style={s.card}>
              <h1>Step Up Program 2026</h1>
              <p>Graduate trainee and internship opportunities.</p>
            </div>
          </div>
        )}

        {tab === "jobs" && (
          <div style={s.section}>
            <div style={s.grid}>
              {jobs.map((j) => (
                <div key={j.id} style={s.card}>
                  <h3>{j.title}</h3>
                  <p>{j.location}</p>
                  <p>{j.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "apply" && (
          <div style={s.section}>
            <div style={s.card}>
              <h2>Apply Now</h2>

              <input name="full_name" placeholder="Full Name" style={s.input} onChange={handleChange} />
              <input name="email" placeholder="Email" style={s.input} onChange={handleChange} />
              <input name="phone" placeholder="Phone" style={s.input} onChange={handleChange} />
              <input name="qualification" placeholder="Qualification" style={s.input} onChange={handleChange} />
              <input name="institution" placeholder="Institution" style={s.input} onChange={handleChange} />
              <input name="skills" placeholder="Skills" style={s.input} onChange={handleChange} />
              <input id="cvFile" type="file" style={s.input} />

              <button style={s.btn} disabled={loading} onClick={submitApplication}>
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {tab === "auth" && (
          <div style={s.section}>
            <div style={{ ...s.card, maxWidth: 420, margin: "0 auto" }}>
              <h2>{authMode === "login" ? "Login" : "Create Account"}</h2>

              {authMode === "signup" && (
                <input style={s.input} placeholder="Full Name" value={authName} onChange={(e)=>setAuthName(e.target.value)} />
              )}

              <input style={s.input} placeholder="Email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} />
              <input style={s.input} type="password" placeholder="Password" value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} />

              <button style={s.btn} onClick={authMode === "login" ? signIn : signUp}>
                {authMode === "login" ? "Login" : "Create Account"}
              </button>

              <div style={{ marginTop: 10 }}>
                <button style={s.btnGhost} onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                  {authMode === "login" ? "Need an account?" : "Already have an account?"}
                </button>
              </div>

              {authMessage && <p>{authMessage}</p>}
            </div>
          </div>
        )}

        {tab === "dashboard" && session && isHR && (
          <div style={s.section}>
            <div style={s.card}>
              <h2>Recruiter Dashboard</h2>

              <input style={s.input} placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} />

              <button style={s.btn} onClick={exportCSV}>Export CSV</button>

              <div style={{ marginTop: 20 }}>
                {filteredApps.map((a) => (
                  <div
                    key={a.id}
                    style={{ ...s.card, marginBottom: 12, cursor: "pointer" }}
                    onClick={() => setSelectedApplicant(a)}
                  >
                    <strong>{a.full_name}</strong><br />
                    {a.email}<br />
                    Status: {a.status}
                  </div>
                ))}
              </div>

              {selectedApplicant && (
                <div style={{ marginTop: 20, ...s.card }}>
                  <h3>{selectedApplicant.full_name}</h3>
                  <p>{selectedApplicant.email}</p>
                  <p>{selectedApplicant.qualification}</p>

                  <button style={s.btnGhost} onClick={() => updateStatus(selectedApplicant.id,"Shortlisted")}>
                    Shortlist
                  </button>

                  <button style={s.btnGhost} onClick={() => updateStatus(selectedApplicant.id,"Rejected")}>
                    Reject
                  </button>

                  <button style={s.btn} onClick={() => updateStatus(selectedApplicant.id,"Hired")}>
                    Hire
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={s.footer}>
        © 2026 Chilanga Cement PLC • Careers Portal
      </div>
    </div>
  );
}
