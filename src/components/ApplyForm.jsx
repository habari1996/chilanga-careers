import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ApplyForm({ onSuccess, refreshData }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    alt_phone: "",
    dob: "",
    age: "",
    gender: "",
    nationality: "Zambian",
    qualification: "",
    institution: "",
    field_of_study: "",
    graduation_year: "",
    skills: "",
    experience: "",
  });

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Lists (same as before)
  const qualifications = ["Grade 12 Certificate", "Certificate", "Diploma", "Advanced Diploma", "Bachelor's Degree", "Bachelor of Engineering", "Bachelor of Science", "Bachelor of Commerce", "Bachelor of Business Administration", "Master's Degree", "Other"];

  const institutions = ["University of Zambia (UNZA)", "Copperbelt University (CBU)", "Mulungushi University", "University of Lusaka (UNILUS)", "Zambia Open University (ZAOU)", "Kwame Nkrumah University", "Mukuba University", "Chalimbana University", "Levy Mwanawasa Medical University", "ZCAS University", "Cavendish University Zambia", "Eden University", "Lusaka Apex Medical University", "DMI-St. Eugene University", "Other (Please Specify)"];

  const fieldsOfStudy = ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Mining Engineering", "Chemical Engineering", "Computer Science", "Information Technology", "Business Administration", "Accounting", "Finance", "Marketing", "Human Resource Management", "Other"];

  const commonSkills = ["AutoCAD", "Microsoft Excel", "Project Management", "Python", "Data Analysis", "MATLAB", "SolidWorks", "SAP", "Power BI", "SQL", "Leadership", "Communication"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === "dob" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setForm(prev => ({ ...prev, age: age.toString() }));
    }
  };

  const addSkill = (skill) => {
    const current = form.skills ? form.skills.split(", ").filter(Boolean) : [];
    if (!current.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...current, skill].join(", ") }));
    }
  };

  const submitApplication = async () => { /* your existing submit logic */ };

  return (
    <div style={{ maxWidth: "820px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{
        background: "#ffffff",
        padding: "48px 40px",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
        border: "1px solid #f1f5f9"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "32px", fontSize: "28px", color: "#1e2937" }}>
          Graduate Trainee Application — Step Up Program 2026
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={label}>Full Name *</label>
            <input name="full_name" style={input} value={form.full_name} onChange={handleChange} />
          </div>
          <div>
            <label style={label}>Email Address *</label>
            <input name="email" type="email" style={input} value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label style={label}>Phone Number *</label>
            <input name="phone" style={input} value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label style={label}>Alternative Phone</label>
            <input name="alt_phone" style={input} value={form.alt_phone} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
          <div>
            <label style={label}>Date of Birth</label>
            <input name="dob" type="date" style={input} value={form.dob} onChange={handleChange} />
          </div>
          <div>
            <label style={label}>Age</label>
            <input name="age" style={input} value={form.age} readOnly />
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <label style={label}>Highest Qualification *</label>
          <select name="qualification" style={input} value={form.qualification} onChange={handleChange}>
            <option value="">Select Qualification</option>
            {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>

        <div style={{ marginTop: "24px" }}>
          <label style={label}>Institution / University *</label>
          <select name="institution" style={input} value={form.institution} onChange={handleChange}>
            <option value="">Select Institution</option>
            {institutions.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
          <div>
            <label style={label}>Field of Study</label>
            <select name="field_of_study" style={input} value={form.field_of_study} onChange={handleChange}>
              <option value="">Select Field of Study</option>
              {fieldsOfStudy.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Graduation Year</label>
            <select name="graduation_year" style={input} value={form.graduation_year} onChange={handleChange}>
              <option value="">Select Year</option>
              {Array.from({ length: 37 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <label style={label}>Key Skills</label>
          <input name="skills" style={input} value={form.skills} onChange={handleChange} placeholder="AutoCAD, Excel, Python..." />
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {commonSkills.map(skill => (
              <button key={skill} type="button" onClick={() => addSkill(skill)} style={skillBtn}>+ {skill}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <label style={label}>Upload CV (PDF or Word) *</label>
          <input id="cvFile" type="file" accept=".pdf,.doc,.docx" style={input} />
        </div>

        <div style={{ margin: "32px 0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span style={{ fontSize: "15px", color: "#475569" }}>
              I confirm that the information provided is accurate and I agree to the Terms & Conditions.
            </span>
          </label>
        </div>

        <button onClick={submitApplication} disabled={loading || !agreed} style={submitBtn}>
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

// Refined Styles
const label = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
  color: "#374151",
  fontSize: "15px"
};

const input = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "15px",
  transition: "all 0.2s"
};

const skillBtn = {
  padding: "6px 14px",
  fontSize: "13px",
  border: "1px solid #e2e8f0",
  borderRadius: "9999px",
  background: "#f8fafc",
  cursor: "pointer",
  transition: "all 0.2s"
};

const submitBtn = {
  width: "100%",
  padding: "16px",
  marginTop: "20px",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontSize: "17px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s"
};
