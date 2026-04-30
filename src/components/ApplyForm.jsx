import React, { useState, useEffect } from "react";
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
    cv_text: "",
    job_id: null,
  });

  const [cvOption, setCvOption] = useState("upload");
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Graduate Trainee Application — Step Up Program 2026");

  // Get job from URL if applying for specific position
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job");
    if (jobId) {
      setForm(prev => ({ ...prev, job_id: jobId }));
      setJobTitle(`Application for Specific Job #${jobId}`);
    }
  }, []);

  const qualifications = [
    "Grade 12 Certificate", "Certificate", "Diploma", "Advanced Diploma",
    "Bachelor's Degree", "Bachelor of Engineering", "Bachelor of Science",
    "Bachelor of Commerce", "Bachelor of Business Administration", "Master's Degree", "Other"
  ];

  const institutions = [
    "University of Zambia (UNZA)", "Copperbelt University (CBU)", "Mulungushi University",
    "University of Lusaka (UNILUS)", "Zambia Open University (ZAOU)", "Kwame Nkrumah University",
    "Mukuba University", "Chalimbana University", "Levy Mwanawasa Medical University",
    "ZCAS University", "Cavendish University Zambia", "Eden University",
    "Lusaka Apex Medical University", "DMI-St. Eugene University", "Other (Please Specify)"
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
      setForm(prev => ({ ...prev, skills: [...current, skill].join(", ") }));
    }
  };

  // Improved AI Review with Zambian Context
  const reviewWithAI = async () => {
    if (!form.cv_text || form.cv_text.trim().length < 50) {
      alert("Please paste at least 50 characters of your CV content.");
      return;
    }

    setAiLoading(true);

    setTimeout(() => {
      const text = form.cv_text.toLowerCase();
      let score = 62;

      // Zambian Context
      const zambianKeywords = ["unza", "cbu", "mulungushi", "lusaka", "kitwe", "copperbelt", "mining", "cement", "zambia"];
      zambianKeywords.forEach(kw => { if (text.includes(kw)) score += 6; });

      // Education
      if (text.includes("bachelor") || text.includes("beng") || text.includes("bsc")) score += 18;
      if (text.includes("master") || text.includes("msc")) score += 12;
      if (text.includes("engineering")) score += 15;

      // Skills
      const techSkills = ["python", "autocad", "excel", "matlab", "solidworks", "sap", "power bi", "sql"];
      techSkills.forEach(skill => { if (text.includes(skill)) score += 7; });

      // Experience
      if (text.includes("internship") || text.includes("trainee") || text.includes("experience")) score += 14;
      if (text.includes("led") || text.includes("managed") || text.includes("team")) score += 10;

      score = Math.min(98, Math.max(58, Math.floor(score)));

      const review = {
        score,
        summary: `Overall ${score >= 80 ? "strong" : "solid"} candidate with good potential for Chilanga Cement.`,
        recommendation: score >= 82 ? "Strong Candidate - Highly Recommend Shortlisting" : score >= 72 ? "Good Candidate - Consider for Shortlist" : "Average Profile",
        strengths: [
          score > 80 ? "Strong academic background" : "",
          (text.includes("python") || text.includes("excel")) ? "Relevant technical skills" : "",
          text.includes("internship") ? "Practical experience" : ""
        ].filter(Boolean)
      };

      setAiReview(review);

      // Auto-save AI score
      if (form.email) {
        supabase.from("applications").update({ score: review.score }).eq("email", form.email);
      }

      alert(`🧠 AI Review Complete! Score: ${score}%`);
      setAiLoading(false);
    }, 1300);
  };

  const submitApplication = async () => {
    if (!form.full_name || !form.email || !form.phone || !form.qualification || !form.institution) {
      alert("Please fill all required fields (*)");
      return;
    }
    if (!agreed) {
      alert("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const file = document.getElementById("cvFile")?.files[0];
      let cv_url = null;

      if (file) {
        const fileName = `cvs/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("cvs").upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
        cv_url = data.publicUrl;
      }

      const payload = {
        ...form,
        cv_url,
        status: "New",
        score: aiReview?.score || 0,
        dob: form.dob || null
      };

      const { error } = await supabase.from("applications").insert([payload]);
      if (error) throw error;

      alert("✅ Application submitted successfully!");
      onSuccess();

      // Reset form
      setForm({
        full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "",
        gender: "", nationality: "Zambian", qualification: "", institution: "",
        field_of_study: "", graduation_year: "", skills: "", experience: "", cv_text: ""
      });
      setAgreed(false);
      setAiReview(null);
      document.getElementById("cvFile").value = "";
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 16px" }}>
      <div style={{ background: "#ffffff", padding: "40px 28px", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "8px", fontSize: "28px" }}>
          {jobTitle}
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: "32px" }}>Step Up Program 2026</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", md: "1fr 1fr", gap: "20px" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr", md: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
          <div>
            <label style={label}>Date of Birth</label>
            <input name="dob" type="date" style={input} value={form.dob} onChange={handleChange} />
          </div>
          <div>
            <label style={label}>Age</label>
            <input name="age" style={input} value={form.age} readOnly />
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr", md: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
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

        <div style={{ marginTop: "24px" }}>
          <label style={label}>Key Skills</label>
          <input name="skills" style={input} value={form.skills} onChange={handleChange} placeholder="AutoCAD, Excel, Python..." />
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {commonSkills.map(skill => (
              <button key={skill} type="button" onClick={() => addSkill(skill)} style={skillBtn}>+ {skill}</button>
            ))}
          </div>
        </div>

        {/* CV Section */}
        <div style={{ marginTop: "28px" }}>
          <label style={label}>How would you like to provide your CV?</label>
          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button onClick={() => setCvOption("upload")} style={{ ...optionBtn, background: cvOption === "upload" ? "#f59e0b" : "#f1f5f9", color: cvOption === "upload" ? "#fff" : "#000" }}>
              Upload CV File
            </button>
            <button onClick={() => setCvOption("type")} style={{ ...optionBtn, background: cvOption === "type" ? "#f59e0b" : "#f1f5f9", color: cvOption === "type" ? "#fff" : "#000" }}>
              Type / Paste CV
            </button>
          </div>
        </div>

        {cvOption === "upload" && (
          <div style={{ marginTop: "20px" }}>
            <label style={label}>Upload CV (PDF or Word) *</label>
            <input id="cvFile" type="file" accept=".pdf,.doc,.docx" style={input} />
          </div>
        )}

        {cvOption === "type" && (
          <div style={{ marginTop: "20px" }}>
            <label style={label}>Paste Your CV Content *</label>
            <textarea name="cv_text" value={form.cv_text} onChange={handleChange} style={{ ...input, minHeight: "160px" }} placeholder="Paste your full CV here..." />
            <button onClick={reviewWithAI} disabled={aiLoading || !form.cv_text} style={aiBtn}>
              {aiLoading ? "Analyzing..." : "Review with AI Agent"}
            </button>

            {aiReview && (
              <div style={aiCard}>
                <h4>🧠 AI Review — Score: {aiReview.score}%</h4>
                <p><strong>Summary:</strong> {aiReview.summary}</p>
                <p><strong>Recommendation:</strong> {aiReview.recommendation}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: "32px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I confirm that the information provided is accurate and I agree to the Terms & Conditions.</span>
          </label>
        </div>

        <button onClick={submitApplication} disabled={loading || !agreed} style={submitBtn}>
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

// Styles
const label = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" };
const input = { width: "100%", padding: "14px 16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px" };
const skillBtn = { padding: "6px 14px", fontSize: "13px", border: "1px solid #e2e8f0", borderRadius: "9999px", background: "#f8fafc", cursor: "pointer" };
const optionBtn = { padding: "12px 24px", borderRadius: "12px", border: "none", fontWeight: "500", cursor: "pointer" };
const aiBtn = { marginTop: "12px", padding: "12px 24px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" };
const aiCard = { marginTop: "20px", padding: "20px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #86efac" };
const submitBtn = { width: "100%", padding: "16px", marginTop: "30px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: "600", cursor: "pointer" };
