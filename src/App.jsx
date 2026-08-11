import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import ApplyForm from "./components/ApplyForm";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import JobList from "./components/JobList";
import Confirmation from "./components/Confirmation";
import TrackApplication from "./components/TrackApplication";
import { getPermissions } from "./roles";

export default function App() {
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const permissions = getPermissions(session?.user?.email);
  const isHR = !!permissions?.canViewDashboard;

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
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    const pageSize = 1000;
    let allApps = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) break;
      allApps = allApps.concat(data || []);
      if (!data || data.length < pageSize) break;
    }
    setJobs(jobsData || []);
    setApps(allApps);
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
          <div style={{ textAlign: "center", padding: "100px 20px 80px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <h1 style={{
                fontSize: "3.6rem",
                fontWeight: 700,
                marginBottom: 24,
                color: "#0f172a",
                lineHeight: 1.1
              }}>
                Chilanga Cement<br />
                Job Application Portal
              </h1>
              <p style={{
                fontSize: "1.35rem",
                color: "#475569",
                maxWidth: "680px",
                margin: "0 auto 50px",
                lineHeight: 1.6
              }}>
                Join one of Zambia’s most respected and established companies.
                At Chilanga Cement, we build more than infrastructure — we build careers and futures.
              </p>
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                flexWrap: "wrap",
                marginBottom: "70px"
              }}>
                <button
                  onClick={() => handleSetTab("jobs")}
                  style={{
                    padding: "18px 48px",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    background: "#0f172a",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.15)"
                  }}
                >
                  Browse Open Positions
                </button>
                <button
                  onClick={() => handleSetTab("apply")}
                  style={{
                    padding: "18px 48px",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    background: "#b45309",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 8px 25px rgba(245, 158, 11, 0.25)"
                  }}
                >
                  Start Your Application
                </button>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "50px",
                flexWrap: "wrap",
                padding: "40px 0",
                borderTop: "1px solid #e2e8f0",
                borderBottom: "1px solid #e2e8f0"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}>60+</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>Years of Excellence</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}>500+</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>Employees Nationwide</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}>4</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>Manufacturing Plants</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}>100%</div>
                  <div style={{ color: "#64748b", marginTop: 6 }}>Zambian Owned</div>
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

        {tab === "dashboard" && isHR && (
          <Dashboard
            apps={apps}
            refreshData={loadData}
            userEmail={session?.user?.email}
            permissions={permissions}
          />
        )}

        {tab === "dashboard" && !isHR && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <h2>🔒 Restricted Access</h2>
            <p>This dashboard is only for authorized HR staff.</p>
            <button onClick={() => handleSetTab("auth")} style={primaryBtn}>
              Go to HR Login
            </button>
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
  background: "#b45309",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer"
};
