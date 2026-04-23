import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

export default function App() {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    skills: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("*");

    const { data: appData, error: appError } = await supabase
      .from("applications")
      .select("*");

    if (jobsError) console.error(jobsError);
    if (appError) console.error(appError);

    setJobs(jobsData || []);
    setApps(appData || []);
  }

  async function submitApplication() {
    const { error } = await supabase.from("applications").insert(form);

    if (error) {
      alert("Error submitting application");
      console.error(error);
      return;
    }

    alert("Application Submitted Successfully");

    setForm({
      full_name: "",
      email: "",
      phone: "",
      qualification: "",
      skills: ""
    });

    loadData();
    setTab("dashboard");
  }

  const styles = {
    page: {
      fontFamily: "Arial, sans-serif",
      padding: "30px",
      background: "#f4f6f8",
      minHeight: "100vh"
    },
    topbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
      flexWrap: "wrap",
      gap: "10px"
    },
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "#1f2937"
    },
    buttons: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap"
    },
    btn: {
      padding: "10px 16px",
      border: "none",
      borderRadius: "8px",
      background: "#2563eb",
      color: "white",
      cursor: "pointer"
    },
    btnSecondary: {
      padding: "10px 16px",
      border: "1px solid #2563eb",
      borderRadius: "8px",
      background: "white",
      color: "#2563eb",
      cursor: "pointer"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "16px"
    },
    card: {
      background: "white",
      padding: "18px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    },
    input: {
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
      borderRadius: "8px",
      border: "1px solid #d1d5db"
    },
    sectionTitle: {
      fontSize: "22px",
      fontWeight: "bold",
      marginBottom: "15px"
    },
    badge: {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "999px",
      background: "#e0e7ff",
      color: "#3730a3",
      fontSize: "12px",
      marginTop: "8px"
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.title}>Chilanga Cement PLC Careers</div>

        <div style={styles.buttons}>
          <button style={styles.btn} onClick={() => setTab("jobs")}>
            Jobs
          </button>
          <button style={styles.btnSecondary} onClick={() => setTab("apply")}>
            Apply
          </button>
          <button style={styles.btnSecondary} onClick={() => setTab("dashboard")}>
            HR Dashboard
          </button>
        </div>
      </div>

      {tab === "jobs" && (
        <div>
          <div style={styles.sectionTitle}>Open Positions</div>

          <div style={styles.grid}>
            {jobs.map((job) => (
              <div key={job.id} style={styles.card}>
                <h3>{job.title}</h3>
                <p><strong>Location:</strong> {job.location}</p>
                <p>{job.description}</p>
                <span style={styles.badge}>Open</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "apply" && (
        <div style={{ ...styles.card, maxWidth: "650px" }}>
          <div style={styles.sectionTitle}>Application Form</div>

          <input
            style={styles.input}
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({ ...form, full_name: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Qualification"
            value={form.qualification}
            onChange={(e) =>
              setForm({ ...form, qualification: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Skills"
            value={form.skills}
            onChange={(e) =>
              setForm({ ...form, skills: e.target.value })
            }
          />

          <input type="file" style={styles.input} />

          <button style={styles.btn} onClick={submitApplication}>
            Submit Application
          </button>
        </div>
      )}

      {tab === "dashboard" && (
        <div>
          <div style={styles.sectionTitle}>HR Dashboard</div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <h3>Total Applications</h3>
              <h1>{apps.length}</h1>
            </div>

            <div style={styles.card}>
              <h3>Recent Applicants</h3>

              {apps.length === 0 && <p>No applications yet.</p>}

              {apps.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <strong>{a.full_name}</strong><br />
                  {a.email}<br />
                  <small>{a.qualification}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
