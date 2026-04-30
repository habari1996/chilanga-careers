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
    start_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const qualifications = [
    "Grade 12 Certificate", "Certificate", "Diploma", "Advanced Diploma",
    "Bachelor's Degree", "Bachelor of Engineering", "Bachelor of Science",
    "Bachelor of Commerce", "Bachelor of Business Administration",
    "Bachelor of Laws (LLB)", "Bachelor of Medicine & Surgery",
    "Master's Degree", "Doctorate (PhD)", "Other"
  ];

  const institutions = [
    "University of Zambia (UNZA)", "Copperbelt University (CBU)", "Mulungushi University",
    "University of Lusaka (UNILUS)", "Zambia Open University (ZAOU)", "Kwame Nkrumah University",
    "Mukuba University", "Chalimbana University", "Levy Mwanawasa Medical University",
    "ZCAS University", "Cavendish University Zambia", "Eden University",
    "Lusaka Apex Medical University", "Northrise University", "Copperstone University",
    "Rusangu University", "Chreso University", "Zambia Catholic University",
    "Africa Christian University", "Gideon Robert University", "DMI-St. Eugene University",
    "DMI-St. John the Baptist University", "St. Bonaventure University",
    "The University of Barotseland", "Zambia Adventist University",
    "Livingstone International University", "Evelyn Hone College",
    "Northern Technical College (NORTEC)", "Southern Technical College",
    "David Livingstone College of Education", "Kitwe College of Education",
    "Luanshya Technical and Business College", "Mansa College of Education",
    "Other (Please Specify)"
  ];

  const fieldsOfStudy = [
    "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Mining Engineering",
    "Chemical Engineering", "Computer Science", "Information Technology", "Business Administration",
    "Accounting", "Finance", "Marketing", "Human Resource Management", "Other"
  ];

  const commonSkills = [
    "AutoCAD", "Microsoft Excel", "Project Management", "Python", "Data Analysis",
    "MATLAB", "SolidWorks", "SAP", "Power BI", "SQL", "Leadership", "Communication"
  ];

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
      setForm(prev => ({
        ...prev,
        skills: [...current, skill].join(", ")
      }));
    }
  };

  const uploadCV = async (file) => {
    if (!file) return null;
    const fileName = `cvs/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("cvs").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const submitApplication = async () => {
    if (!form.full_name || !form.email || !form.phone || !form.qualification || !form.institution) {
      alert("Please fill all required fields (*)");
      return;
    }
    if (!agreed) {
      alert("You must agree to the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const file = document.getElementById("cvFile")?.files[0];
      const cv_url = file ? await uploadCV(file) : null;

      const payload = { 
        ...form, 
        cv_url, 
        status: "New", 
        score: 0,
        dob: form.dob || null 
      };

      const { error } = await supabase.from("applications").insert([payload]);
      if (error) throw error;

      alert("✅ Application submitted successfully!");
      onSuccess();

      setForm({
        full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "",
        gender: "", nationality: "Zambian", qualification: "", institution: "",
        field_of_study: "", graduation_year: "", skills: "", experience: "", start_date: ""
      });
      setAgreed(false);
      document.getElementById("cvFile").value = "";
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ background: "white", padding: 40, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center", marginBottom: 30 }}>Graduate Trainee Application — Step Up Program 2026</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label htmlFor="full_name" style={labelStyle}>Full Name *</label>
            <input id="full_name" name="full_name" required style={inputStyle} value={form.full_name} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="email" style={labelStyle}>Email Address *</label>
            <input id="email" name="email" type="email" required style={inputStyle} value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="phone" style={labelStyle}>Phone Number *</label>
            <input id="phone" name="phone" required style={inputStyle} value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="alt_phone" style={labelStyle}>Alternative Phone</label>
            <input id="alt_phone" name="alt_phone" style={inputStyle} value={form.alt_phone} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div>
            <label htmlFor="dob" style={labelStyle}>Date of Birth</label>
            <input id="dob" name="dob" type="date" style={inputStyle} value={form.dob} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="age" style={labelStyle}>Age</label>
            <input id="age" name="age" style={inputStyle} value={form.age} readOnly />
          </div>
        </div>

        <div style={{ marginTop: 25 }}>
          <label htmlFor="qualification" style={labelStyle}>Highest Qualification *</label>
          <select id="qualification" name="qualification" required style={inputStyle} value={form.qualification} onChange={handleChange}>
            <option value="">Select Qualification</option>
            {qualifications.map((q, i) => <option key={i} value={q}>{q}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 20 }}>
          <label htmlFor="institution" style={labelStyle}>Institution / University *</label>
          <select id="institution" name="institution" required style={inputStyle} value={form.institution} onChange={handleChange}>
            <option value="">Select Institution</option>
            {institutions.map((inst, i) => <option key={i} value={inst}>{inst}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div>
            <label htmlFor="field_of_study" style={labelStyle}>Field of Study</label>
            <select id="field_of_study" name="field_of_study" style={inputStyle} value={form.field_of_study} onChange={handleChange}>
              <option value="">Select Field of Study</option>
              {fieldsOfStudy.map((f, i) => <option key={i} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="graduation_year" style={labelStyle}>Graduation Year</label>
            <select id="graduation_year" name="graduation_year" style={inputStyle} value={form.graduation_year} onChange={handleChange}>
              <option value="">Select Year</option>
              {Array.from({ length: 37 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label htmlFor="experience" style={labelStyle}>Work Experience (if any)</label>
          <textarea id="experience" name="experience" style={{ ...inputStyle, minHeight: "80px" }} value={form.experience} onChange={handleChange} placeholder="e.g. 1 year internship..." />
        </div>

        <div style={{ marginTop: 20 }}>
          <label htmlFor="skills" style={labelStyle}>Key Skills</label>
          <input id="skills" name="skills" style={inputStyle} value={form.skills} onChange={handleChange} placeholder="AutoCAD, Excel, Python..." />
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {commonSkills.map(skill => (
              <button key={skill} type="button" onClick={() => addSkill(skill)} style={skillBtn}>+ {skill}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 25 }}>
          <label htmlFor="cvFile" style={labelStyle}>Upload CV (PDF or Word) *</label>
          <input id="cvFile" type="file" accept=".pdf,.doc,.docx" style={inputStyle} />
        </div>

        <div style={{ marginTop: 30 }}>
          <label>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span style={{ marginLeft: 8 }}>I confirm that the information provided is accurate and I agree to the Terms & Conditions.</span>
          </label>
        </div>

        <button onClick={submitApplication} disabled={loading || !agreed} style={submitBtn}>
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600, color: "#374151" };
const inputStyle = { width: "100%", padding: "14px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "15px" };
const skillBtn = { padding: "6px 12px", fontSize: "13px", border: "1px solid #ddd", borderRadius: 20, background: "#f8fafc", cursor: "pointer" };
const submitBtn = { width: "100%", padding: "16px", marginTop: 30, background: "#f59e0b", color: "white", border: "none", borderRadius: 12, fontSize: "17px", fontWeight: 600, cursor: "pointer" };
