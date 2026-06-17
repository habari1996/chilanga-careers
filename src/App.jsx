import React, { useState } from "react";
import ApplyForm from "./components/ApplyForm";
import Dashboard from "./components/Dashboard";
import PlantCarousel from "./components/PlantCarousel";
import { supabase } from "./supabaseClient";

export default function App() {
  const [currentView, setCurrentView] = useState("landing"); // landing | apply | dashboard
  const [user, setUser] = useState(null);

  // Simple auth check (you can improve this later)
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const handleApplyClick = () => setCurrentView("apply");
  const handleDashboardClick = () => setCurrentView("dashboard");
  const goBack = () => setCurrentView("landing");

  // LANDING PAGE WITH CAROUSEL
  if (currentView === "landing") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        {/* Top Navigation */}
        <nav style={{ 
          background: "white", 
          borderBottom: "1px solid #e2e8f0", 
          padding: "16px 40px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0f172a" }}>Chilanga Cement</div>
            <div style={{ fontSize: "0.95rem", color: "#64748b" }}>Step Up Program 2026</div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={handleApplyClick}
              style={{ 
                padding: "10px 22px", 
                background: "#f59e0b", 
                color: "white", 
                border: "none", 
                borderRadius: "10px", 
                fontWeight: 600, 
                cursor: "pointer" 
              }}
            >
              Apply Now
            </button>
            <button 
              onClick={handleDashboardClick}
              style={{ 
                padding: "10px 22px", 
                background: "white", 
                color: "#0f172a", 
                border: "1px solid #cbd5e1", 
                borderRadius: "10px", 
                fontWeight: 600, 
                cursor: "pointer" 
              }}
            >
              HR Dashboard
            </button>
          </div>
        </nav>

        {/* Hero Section with Carousel */}
        <div style={{ padding: "60px 40px 40px", textAlign: "center", maxWidth: "1100px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "3.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>
            Shape the Future of Cement in Zambia
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#475569", maxWidth: "700px", margin: "0 auto 40px" }}>
            Join Chilanga Cement's Step Up Graduate Trainee Program 2026 and build your career in one of Zambia's leading industrial companies.
          </p>

          <div style={{ marginBottom: "60px" }}>
            <button 
              onClick={handleApplyClick}
              style={{ 
                padding: "16px 40px", 
                background: "#f59e0b", 
                color: "white", 
                border: "none", 
                borderRadius: "12px", 
                fontSize: "1.1rem", 
                fontWeight: 600, 
                cursor: "pointer" 
              }}
            >
              Start Your Application
            </button>
          </div>

          {/* Plant Image Carousel */}
          <PlantCarousel />
        </div>

        {/* Simple footer info */}
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontSize: "0.95rem" }}>
          Chilanga Cement PLC • A Huaxin Cement Company • Kafue Road, Lusaka
        </div>
      </div>
    );
  }

  // APPLY FORM VIEW
  if (currentView === "apply") {
    return (
      <div>
        <div style={{ padding: "20px 40px", borderBottom: "1px solid #e2e8f0", background: "white" }}>
          <button onClick={goBack} style={{ background: "none", border: "none", fontSize: "1rem", cursor: "pointer", color: "#0f172a" }}>
            ← Back to Home
          </button>
        </div>
        <ApplyForm onSuccess={() => setCurrentView("landing")} />
      </div>
    );
  }

  // DASHBOARD VIEW
  if (currentView === "dashboard") {
    return (
      <div>
        <div style={{ padding: "20px 40px", borderBottom: "1px solid #e2e8f0", background: "white", display: "flex", justifyContent: "space-between" }}>
          <button onClick={goBack} style={{ background: "none", border: "none", fontSize: "1rem", cursor: "pointer", color: "#0f172a" }}>
            ← Back to Home
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
            Logout
          </button>
        </div>
        <Dashboard apps={[]} refreshData={() => {}} />
      </div>
    );
  }

  return null;
}
