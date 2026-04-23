import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

const qualifications = [
  "Certificate",
  "Diploma",
  "Advanced Diploma",
  "Bachelor's Degree",
  "Postgraduate Diploma",
  "Master's Degree",
  "PhD",
  "Professional Qualification",
  "Other"
];

const institutions = [
  "University of Zambia (UNZA)",
  "Copperbelt University (CBU)",
  "Mulungushi University",
  "Kwame Nkrumah University",
  "Mukuba University",
  "Chalimbana University",
  "ZCAS University",
  "Cavendish University Zambia",
  "Lusaka Apex Medical University",
  "Texila American University Zambia",
  "Rockview University",
  "DMI St Eugene University",
  "Northrise University",
  "Eden University",
  "Information and Communications University",
  "Zambia Catholic University",
  "Rusangu University",
  "Justo Mwale University",
  "Zambia Open University",
  "Other"
];

export default function App() {
  const [tab, setTab] = useState("apply");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);

  const [form, setForm] = useState({
    full_name: "",
    nrc: "",
    dob: "",
    age: "",
    gender: "",
    nationality: "Zambian",
    address: "",
    town: "",
    province: "",
    email: "",
    phone: "",
    alt_phone: "",
    qualification: "",
    degree_title: "",
    field_of_study: "",
    institution: "",
    graduation_year: "",
    gpa: "",
    department: "",
    motivation: "",
    start_date: "",
    relocate: "",
    experience: "",
    certifications: "",
    skills: "",
    languages: "",
    right_to_work: "",
    criminal_record: "",
    age_confirm: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: jobsData } = await supabase.from("jobs").select("*");
    const { data: appData } = await supabase.from("applications").select("*");
    setJobs(jobsData || []);
    setApps(appData || []);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submitApplication() {
    const { error } = await supabase.from("applications").insert(form);

    if (error) {
      alert("Submission failed");
      console.error(error);
      return;
    }

    alert("Application submitted successfully");
    loadData();
    setTab("dashboard");
  }

  const styles = {
    page: {
      fontFamily: "Arial, sans-serif",
      padding: "24px",
      background: "#f4f6f8",
      minHeight: "100vh"
    },
    top: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
      marginBottom: "20px"
    },
    title: {
      fontSize: "34px",
      fontWeight: "bold"
    },
    nav: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap"
    },
    btn: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #2563eb",
      background: "#2563eb",
      color: "#fff",
      cursor: "pointer"
    },
    btnLight: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #2563eb",
      background: "#fff",
      color: "#2563eb",
      cursor: "pointer"
    },
    card: {
      background: "#fff",
      padding: "18px",
      borderRadius: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      marginBottom: "16px"
    },
    section: {
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "12px"
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
      gap: "12px"
    },
    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #d1d5db"
    },
    textarea: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      minHeight: "90px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    th: {
      textAlign: "left",
      padding: "10px",
      background: "#eef2ff"
    },
    td: {
      padding: "10px",
      borderBottom: "1px solid #eee"
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.top}>
        <div style={styles.title}>Chilanga Cement PLC Careers</div>

        <div style={styles.nav}>
          <button style={styles.btnLight} onClick={() => setTab("jobs")}>
            Jobs
          </button>
          <button style={styles.btn} onClick={() => setTab("apply")}>
            Apply
          </button>
          <button style={styles.btnLight} onClick={() => setTab("dashboard")}>
            Recruiter Dashboard
          </button>
        </div>
      </div>

      {tab === "jobs" && (
        <div style={styles.card}>
          <h2>Open Positions</h2>
          {jobs.map((j) => (
            <div key={j.id} style={{ marginBottom: "12px" }}>
              <strong>{j.title}</strong><br />
              {j.location}<br />
              {j.description}
            </div>
          ))}
        </div>
      )}

      {tab === "apply" && (
        <div>
          <div style={styles.card}>
            <div style={styles.section}>Personal Details</div>
            <div style={styles.grid2}>
              <input name="full_name" placeholder="Full Name" style={styles.input} onChange={handleChange} />
              <input name="nrc" placeholder="NRC / ID / Passport" style={styles.input} onChange={handleChange} />
              <input name="dob" type="date" style={styles.input} onChange={handleChange} />
              <input name="age" placeholder="Age" style={styles.input} onChange={handleChange} />

              <select name="gender" style={styles.input} onChange={handleChange}>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>

              <input name="nationality" placeholder="Nationality" style={styles.input} onChange={handleChange} />
              <input name="address" placeholder="Address" style={styles.input} onChange={handleChange} />
              <input name="town" placeholder="Town / City" style={styles.input} onChange={handleChange} />
              <input name="province" placeholder="Province" style={styles.input} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.section}>Contact</div>
            <div style={styles.grid2}>
              <input name="email" placeholder="Email" style={styles.input} onChange={handleChange} />
              <input name="phone" placeholder="Phone" style={styles.input} onChange={handleChange} />
              <input name="alt_phone" placeholder="Alternative Phone" style={styles.input} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.section}>Education</div>
            <div style={styles.grid2}>
              <select name="qualification" style={styles.input} onChange={handleChange}>
                <option value="">Highest Qualification</option>
                {qualifications.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>

              <input name="degree_title" placeholder="Degree Title" style={styles.input} onChange={handleChange} />
              <input name="field_of_study" placeholder="Field of Study" style={styles.input} onChange={handleChange} />

              <select name="institution" style={styles.input} onChange={handleChange}>
                <option value="">Institution</option>
                {institutions.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>

              <input name="graduation_year" placeholder="Graduation Year" style={styles.input} onChange={handleChange} />
              <input name="gpa" placeholder="Grade / GPA" style={styles.input} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.section}>Internship Fit</div>
            <div style={styles.grid2}>
              <input name="department" placeholder="Preferred Department" style={styles.input} onChange={handleChange} />
              <input name="start_date" type="date" style={styles.input} onChange={handleChange} />

              <select name="relocate" style={styles.input} onChange={handleChange}>
                <option value="">Willing to Relocate?</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <textarea
              name="motivation"
              placeholder="Why do you want to join?"
              style={styles.textarea}
              onChange={handleChange}
            />
          </div>

          <div style={styles.card}>
            <div style={styles.section}>Experience</div>
            <div style={styles.grid2}>
              <input name="experience" placeholder="Previous Internship / Work Experience" style={styles.input} onChange={handleChange} />
              <input name="certifications" placeholder="Certifications" style={styles.input} onChange={handleChange} />
              <input name="skills" placeholder="Technical Skills" style={styles.input} onChange={handleChange} />
              <input name="languages" placeholder="Languages" style={styles.input} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.section}>Compliance Questions</div>
            <div style={styles.grid2}>
              <select name="age_confirm" style={styles.input} onChange={handleChange}>
                <option value="">Are you 25 or below?</option>
                <option>Yes</option>
                <option>No</option>
              </select>

              <select name="right_to_work" style={styles.input} onChange={handleChange}>
                <option value="">Right to Work in Zambia?</option>
                <option>Yes</option>
                <option>No</option>
              </select>

              <select name="criminal_record" style={styles.input} onChange={handleChange}>
                <option value="">Criminal Record?</option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.section}>Uploads</div>
            <div style={styles.grid2}>
              <input type="file" style={styles.input} />
              <input type="file" style={styles.input} />
              <input type="file" style={styles.input} />
              <input type="file" style={styles.input} />
            </div>
          </div>

          <button style={styles.btn} onClick={submitApplication}>
            Submit Application
          </button>
        </div>
      )}

      {tab === "dashboard" && (
        <div style={styles.card}>
          <h2>Recruiter Dashboard</h2>
          <p>Total Applications: {apps.length}</p>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Qualification</th>
                <th style={styles.th}>Institution</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td style={styles.td}>{a.full_name}</td>
                  <td style={styles.td}>{a.email}</td>
                  <td style={styles.td}>{a.qualification}</td>
                  <td style={styles.td}>{a.institution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
