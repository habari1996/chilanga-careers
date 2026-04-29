import React, { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import ApplyForm from "./components/ApplyForm";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import JobList from "./components/JobList";
import Confirmation from "./components/Confirmation";

export default function App() {
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);

  // ✅ Improved HR Check
  const isHR = session?.user?.email && (
    session.user.email.toLowerCase().includes("@huaxin.com") ||
    session.user.email.toLowerCase().includes("@huaxincem.com") ||
    session.user.email.toLowerCase().includes("@chilangacement.co.zm") ||
    session.user.email === "kudzanai.siame@huaxincem.com"
  );

  useEffect(() => {
    const checkSession = async () => {
      const { supabase } = await import("./supabaseClient");
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth Event:", event); // For debugging
      setSession(newSession);
      if (event === 'SIGNED_IN') {
        setTab("dashboard");
      }
    });

    return () => listener.subscription.unsubscribe();
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

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <Navbar 
        tab={tab} 
        setTab={setTab} 
        session={session} 
        isHR={isHR} 
        onSignOut={() => {
          const { supabase } = import("./supabaseClient");
          supabase.auth.signOut();
          setTab("home");
        }} 
      />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 16px" }}>
        {tab === "home" && ( /* your home content */ )}
        {tab === "jobs" && <JobList jobs={jobs} />}
        {tab === "apply" && <ApplyForm onSuccess={() => setTab("confirmation")} refreshData={loadData} />}
        {tab === "confirmation" && <Confirmation onBack={() => setTab("home")} />}
        {tab === "auth" && <AuthForm setTab={setTab} />}
        
        {tab === "dashboard" && isHR && <Dashboard apps={apps} refreshData={loadData} />}
        
        {tab === "dashboard" && !isHR && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <h2>🔒 Restricted Access</h2>
            <p>This dashboard is only for authorized HR staff.</p>
            <button onClick={() => setTab("auth")} style={primaryBtn}>Go to HR Login</button>
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
