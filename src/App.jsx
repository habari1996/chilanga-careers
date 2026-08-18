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
        if (event === "SIGNED_IN") {
          setTab("dashboard");
          loadData();
        }
        if (event === "SIGNED_OUT") {
          setApps([]);
          setTab("home");
        }
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
      setApps([]);
      setTab("home");
    } catch (err) {
      console.error("Sign out error:", err);
      alert("Failed to sign out. Please try again.");
    }
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <Navbar tab={tab} setTab={handleSetTab} session={session} isHR={isHR} onSignOut={handleSignOut} />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "16px 12px" : "32px 20px" }}>
        {tab === "home" && (
          <div style={{ textAlign: "center", padding: isMobile ? "32px 8px" : "60px 20px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <h1 style={{
                fontSize: isMobile ? "2rem" : "3.2rem",
                fontWeight: 800,
                marginBottom: isMobile ? 16 : 24,
                color: "#0f172a",
                lineHeight: 1.2,
              }}>
                Chilanga Cement<br />
                Careers
              </h1>
              <p style={{
                fontSize: isMobile ? "1.05rem" : "1.35rem",
                color: "#475569",
                maxWidth: "700px",
                margin: "0 auto",
                marginBottom: isMobile ? 28 : 40,
                lineHeight: 1.6,
              }}>
                Join Chilanga Cement and help build Zambia's infrastructure and your career.
              </p>
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: isMobile ? "12px" : "20px",
                flexWrap: "wrap",
              }}>
                <button onClick={() => handleSetTab("jobs")} style={primaryBtn}>View Open Roles</button>
                <button onClick={() => handleSetTab("apply")} style={{ ...primaryBtn, background: "#0f172a" }}>
                  Apply Now
                </button>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: isMobile ? 16 : 32,
                marginTop: isMobile ? 40 : 64,
                maxWidth: 700,
                marginLeft: "auto",
                marginRight: "auto",
              }}>
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
