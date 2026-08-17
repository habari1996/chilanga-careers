import React, { useEffect, useState } from "react";
import useIsMobile from "./hooks/useIsMobile";
import Navbar from "./components/Navbar";
import ApplyForm from "./components/ApplyForm";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import JobList from "./components/JobList";
import Confirmation from "./components/Confirmation";
import TrackApplication from "./components/TrackApplication";
import { getPermissions } from "./roles";

export default function App() {
  const isMobile = useIsMobile();
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
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "12px 12px" : "20px 16px" }}>
        {tab === "home" && (
          <div style={{ textAlign: "center", padding: isMobile ? "40px 16px 48px" : "100px 20px 80px" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <h1 style={{
                fontSize: isMobile ? "1.85rem" : "3.6rem",
                fontWeight: 700,
                marginBottom: isMobile ? 16 : 24,
                color: "#0f172a",
                lineHeight: 1.2,
              }}>
                Chilanga Cement<br />
                Job Application Portal
              </h1>
              <p style={{
                fontSize: isMobile ? "1.05rem" : "1.35rem",
                color: "#475569",
                maxWidth: "680px",
                margin: isMobile ? "0 auto 28px" : "0 auto 50px",
                lineHeight: 1.6
              }}>
                Join one of Zambia’s most respected and established companies.
                At Chilanga Cement, we build more than infrastructure — we build careers and futures.
              </p>
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: isMobile ? "12px" : "20px",
                flexWrap: "wrap",
                marginBottom: isMobile ? "40px" : "70px"
              }}>
                <button
                  onClick={() => handleSetTab("jobs")}
                  style={{
                    padding: isMobile ? "14px 24px" : "18px 48px",
                    fontSize: isMobile ? "1rem" : "1.15rem",
                    fontWeight: 600,
                    background: "#0f172a",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.15)",
                    width: isMobile ? "100%" : undefined,
                    maxWidth: isMobile ? "320px" : undefined
                  }}
                >
                  Browse Open Positions
                </button>
                <button
                  onClick={() => handleSetTab("apply")}
                  style={{
                    padding: isMobile ? "14px 24px" : "18px 48px",
                    fontSize: isMobile ? "1rem" : "1.15rem",
                    fontWeight: 600,
                    background: "#b45309",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 8px 25px rgba(245, 158, 11, 0.25)",
                    width: isMobile ? "100%" : undefined,
                    maxWidth: isMobile ? "320px" : undefined
                  }}
                >
                  Start Your Application
                </button>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: isMobile ? "24px" : "50px",
                flexWrap: "wrap",
                padding: isMobile ? "24px 0" : "40px 0",
                borderTop: "1px solid #e2e8f0",
                borderBottom: "1px solid #e2e8f0"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: isMobile ? "1.8rem" : "2.5rem", fontWeight: 700, color: "#0f172a" }}>60+</div>
                  <div style={{ color: "#64748b", marginTop: 6, fontSize: isMobile ? "0.85rem" : undefined }}>Years of Excellence</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: isMobile ? "1.8rem" : "2.5rem", fontWeight: 700, color: "#0f172a" }}>500+</div>
                  <div style={{ color: "#64748b", marginTop: 6, fontSize: isMobile ? "0.85rem" : undefined }}>Employees Nationwide</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: isMobile ? "1.8rem" : "2.5rem", fontWeight: 700, color: "#0f172a" }}>4</div>
                  <div style={{ color: "#64748b", marginTop: 6, fontSize: isMobile ? "0.85rem" : undefined }}>Manufacturing Plants</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: isMobile ? "1.8rem" : "2.5rem", fontWeight: 700, color: "#0f172a" }}>100%</div>
                  <div style={{ color: "#64748b", marginTop: 6, fontSize: isMobile ? "0.85rem" : undefined }}>Zambian Owned</div>
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
          <div style={{ textAlign: "center", padding: isMobile ? "48px 16px" : "100px 20px" }}>
            <h2>🔒 Restricted Access</h2>
            <p>This dashboard is only for authorized HR staff.</p>
            <button onClick={() => handleSetTab("auth")} style={primaryBtn}>
              Go to HR Login
            </button>
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: isMobile ? "28px 16px" : "40px", background: "#0f172a", color: "#ccc", marginTop: isMobile ? 40 : 80 }}>
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
