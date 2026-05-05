import React, { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import ApplyForm from "./components/ApplyForm";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import JobList from "./components/JobList";
import Confirmation from "./components/Confirmation";
import TrackApplication from "./components/TrackApplication";

export default function App() {
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const isHR = session?.user?.email && (
    session.user.email.toLowerCase().includes("@huaxin.com") ||
    session.user.email.toLowerCase().includes("@huaxincem.com") ||
    session.user.email.toLowerCase().includes("@chilangacement.co.zm") ||
    session.user.email === "kudzanai.siame@huaxincem.com"
  );

  useEffect(() => {
    const initialize = async () => {
      const { supabase } = await import("./supabaseClient");
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      supabase.auth.onAuthStateChange((event, newSession) => {
        setSession(newSession);
        if (event === "SIGNED_IN") setTab("dashboard");
        if (event === "SIGNED_OUT") setTab("home");
      });
    };

    initialize();
    loadData();
  }, []);

  async function loadData() {
    const { supabase } = await import("./supabaseClient");
    const [{ data: jobsData }, { data: appsData }] = await Promise.all([
      supabase.from("jobs").select("*").order("id"),
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
    ]);
    setJobs(jobsData || []);
    setApps(appsData || []);
  }

  const handleSetTab = (newTab, jobId = null) => {
    if (newTab !== "apply") {
      setSelectedJobId(null);
    } else {
      setSelectedJobId(jobId);
    }
    setTab(newTab);
  };

  const handleSignOut = async () => {
    try {
      const { supabase } = await import("./supabaseClient");
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setSession(null);
      setSelectedJobId(null);
      setTab("home");
      
      alert("✅ You have been logged out successfully.");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <Navbar
        tab={tab}
        setTab={handleSetTab}
        session={session}
        isHR={isHR}
        onSignOut={handleSignOut}
      />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 16px" }}>
        {tab === "home" && (
          <div style={{
            textAlign: "center",
            padding: "120px 20px 100px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e2937 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
            margin: "-20px -16px 40px -16px"   // Full width hero
          }}>
            {/* Background accent */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)",
              zIndex: 1
            }} />

            <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto" }}>
              <h1 style={{
                fontSize: "3.8rem",
                fontWeight: 800,
                marginBottom: 24,
                lineHeight: 1.1,
                background: "linear-gradient(90deg, #ffffff, #fcd34d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                Chilanga Cement<br />Job Application Portal
              </h1>

              <p style={{
                fontSize: "1.4rem",
                maxWidth: "720px",
                margin: "0 auto 50px",
                opacity: 0.95,
                lineHeight: 1.6
              }}>
                Build your future with Zambia’s leading cement manufacturer. 
                We’re looking for talented, ambitious individuals to help shape the infrastructure of tomorrow.
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginBottom: 80 }}>
                <button 
                  onClick={() => handleSetTab("jobs")}
                  style={{
                    padding: "18px 42px",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    background: "white",
                    color: "#0f172a",
                    border: "none",
                    borderRadius: 9999,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                  }}
                  onMouseOver={(e) => e.target.style.transform = "translateY(-4px)"}
                  onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
                >
                  Browse Open Positions
                </button>

                <button 
                  onClick={() => handleSetTab("apply")}
                  style={{
                    padding: "18px 42px",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    background: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: 9999,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 10px 30px rgba(245, 158, 11, 0.4)"
                  }}
                  onMouseOver={(e) => e.target.style.transform = "translateY(-4px)"}
                  onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
                >
                  Start Your Application
                </button>
              </div>

              {/* Stats */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "60px",
                flexWrap: "wrap"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.8rem", fontWeight: 700, color: "#f59e0b" }}>60+</div>
                  <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>Years of Excellence</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.8rem", fontWeight: 700, color: "#f59e0b" }}>500+</div>
                  <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>Dedicated Employees</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.8rem", fontWeight: 700, color: "#f59e0b" }}>4</div>
                  <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>Manufacturing Plants</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.8rem", fontWeight: 700, color: "#f59e0b" }}>∞</div>
                  <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>Growth Opportunities</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "jobs" && <JobList jobs={jobs} setTab={handleSetTab} />}
        {tab === "apply" && (
          <ApplyForm
            onSuccess={() => setTab("confirmation")}
            refreshData={loadData}
            initialJobId={selectedJobId}
          />
        )}
        {tab === "confirmation" && <Confirmation onBack={() => setTab("home")} />}
        {tab === "auth" && <AuthForm setTab={handleSetTab} />}
        {tab === "track" && <TrackApplication />}
        {tab === "dashboard" && isHR && <Dashboard apps={apps} refreshData={loadData} />}
        {tab === "dashboard" && !isHR && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <h2>🔒 Restricted Access</h2>
            <p>This dashboard is only for authorized HR staff.</p>
            <button onClick={() => handleSetTab("auth")} style={primaryBtn}>Go to HR Login</button>
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "40px", background: "#0f172a", color: "#ccc", marginTop: 80 }}>
        © 2026 Chilanga Cement PLC • Careers Portal
      </footer>
    </div>
  );
}

const primaryBtn = {
  padding: "14px 32px", 
  fontSize: "1.1rem", 
  background: "#f59e0b",
  color: "white", 
  border: "none", 
  borderRadius: 12, 
  cursor: "pointer"
};
