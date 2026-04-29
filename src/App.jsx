import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import Navbar from "./components/Navbar";
import ApplyForm from "./components/ApplyForm";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import JobList from "./components/JobList";
import Confirmation from "./components/Confirmation";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

export default function App() {
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);

  const isHR = session?.user?.email?.endsWith("@chilanga.com");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    loadData();

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadData() {
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
        onSignOut={() => supabase.auth.signOut().then(() => setTab("home"))} 
      />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 16px" }}>
        {tab === "home" && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <h1 style={{ fontSize: "3rem", marginBottom: 16 }}>Chilanga Cement Step Up Program 2026</h1>
            <p style={{ fontSize: "1.4rem", maxWidth: 700, margin: "0 auto 40px" }}>
              Launch your career with Zambia's leading cement manufacturer.
            </p>
            <button 
              onClick={() => setTab("apply")}
              style={primaryBtn}
            >
              Start Your Application
            </button>
          </div>
        )}

        {tab === "jobs" && <JobList jobs={jobs} />}
        {tab === "apply" && <ApplyForm onSuccess={() => setTab("confirmation")} refreshData={loadData} />}
        {tab === "confirmation" && <Confirmation onBack={() => setTab("home")} />}
        {tab === "auth" && <AuthForm setTab={setTab} />}
        
        {tab === "dashboard" && (session && isHR) && (
          <Dashboard apps={apps} refreshData={loadData} />
        )}

        {tab === "dashboard" && (!session || !isHR) && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
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
