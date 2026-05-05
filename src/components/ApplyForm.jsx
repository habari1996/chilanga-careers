import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function ApplyForm({ onSuccess, refreshData, initialJobId }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "",
    gender: "", nationality: "Zambian", qualification: "", institution: "",
    field_of_study: "", graduation_year: "", skills: "", experience: "",
    cv_text: "", job_id: null,
  });

  const [cvOption, setCvOption] = useState("upload");
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Graduate Trainee Application — Step Up Program 2026");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Job ID handling
  useEffect(() => {
    let jobId = initialJobId;
    if (!jobId) {
      const params = new URLSearchParams(window.location.search);
      jobId = params.get("job");
    }
    if (jobId) {
      setForm(prev => ({ ...prev, job_id: jobId }));
      supabase.from("jobs").select("title").eq("id", jobId).single().then(({ data }) => {
        if (data?.title) setJobTitle(`Application for: ${data.title}`);
        else setJobTitle(`Application for Job #${jobId}`);
      });
    }
  }, [initialJobId]);

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
      setForm(prev => ({ ...prev, dob: value, age: age.toString() }));
    }
  };

  const addSkill = (skill) => {
    const current = form.skills ? form.skills.split(", ").filter(Boolean) : [];
    if (!current.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...current, skill].join(", ") }));
    }
  };

  const reviewWithAI = () => { /* Your existing AI function - unchanged */ 
    if (!form.cv_text || form.cv_text.trim().length < 50) {
      alert("Please paste at least 50 characters of your CV content.");
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      const text = form.cv_text.toLowerCase();
      let score = 62;
      ["unza","cbu","mulungushi","lusaka","kitwe","copperbelt","mining","cement","zambia"]
        .forEach(kw => { if (text.includes(kw)) score += 6; });
      if (text.includes("bachelor") || text.includes("beng") || text.includes("bsc")) score += 18;
      if (text.includes("master") || text.includes("msc")) score += 12;
      if (text.includes("engineering")) score += 15;
      ["python","autocad","excel","matlab","solidworks","sap","power bi","sql"]
        .forEach(s => { if (text.includes(s)) score += 7; });
      if (text.includes("internship") || text.includes("trainee") || text.includes("experience")) score += 14;
      if (text.includes("led") || text.includes("managed") || text.includes("team")) score += 10;
      score = Math.min(98, Math.max(58, Math.floor(score)));

      setAiReview({
        score,
        summary: `Overall ${score >= 80 ? "strong" : "solid"} candidate with good potential for Chilanga Cement.`,
        recommendation: score >= 82 ? "Strong Candidate — Highly Recommend Shortlisting"
          : score >= 72 ? "Good Candidate — Consider for Shortlist" : "Average Profile",
        strengths: [
          score > 80 ? "Strong academic background" : "",
          (text.includes("python") || text.includes("excel")) ? "Relevant technical skills" : "",
          text.includes("internship") ? "Practical experience" : ""
        ].filter(Boolean)
      });
      alert(`🧠 AI Review Complete! Score: ${score}%`);
      setAiLoading(false);
    }, 1300);
  };

  const submitApplication = async () => { /* Your full submit function - unchanged */ 
    if (!form.full_name || !form.email || !form.phone || !form.qualification || !form.institution) {
      alert("Please fill all required fields (*)");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!/^(\+?260|0)[0-9]{9}$/.test(form.phone.replace(/\s/g, ""))) {
      alert("Please enter a valid Zambian phone number (e.g. 0977123456 or +260977123456).");
      return;
    }
    if (form.age && parseInt(form.age) < 18) {
      alert("Applicants must be 18 years or older to apply.");
      return;
    }
    if (!agreed) {
      alert("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("email", form.email.trim().toLowerCase())
        .limit(1);

      if (existing && existing.length > 0) {
        alert("An application with this email address already exists.\n\nUse 'Track Application' to check your status.");
        setLoading(false);
        return;
      }

      let cv_url = null;
      if (cvOption === "upload") {
        const fileEl = document.getElementById("cvFile");
        const file = fileEl?.files[0];
        if (file) {
          const fileName = `cvs/${Date.now()}_${file.name}`;
          const { error: uploadErr } = await supabase.storage.from("cvs").upload(fileName, file);
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(fileName);
          cv_url = urlData.publicUrl;
        }
      }

      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        cv_url,
        status: "New",
        score: 0,
        dob: form.dob || null
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("applications")
        .insert([payload])
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      if (aiReview?.score && inserted?.id) {
        await supabase.from("applications").update({ score: aiReview.score }).eq("id", inserted.id);
      }

      alert("✅ Application submitted successfully!");
      onSuccess();

      setForm({ full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "", gender: "", nationality: "Zambian", qualification: "", institution: "", field_of_study: "", graduation_year: "", skills: "", experience: "", cv_text: "", job_id: null });
      setAgreed(false);
      setAiReview(null);

      const fileEl = document.getElementById("cvFile");
      if (fileEl) fileEl.value = "";
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "920px", margin: "40px auto", padding: "0 16px" }}>
      <div style={{
        background: "#ffffff",
        padding: "48px 40px",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        border: "1px solid #f1f5f9"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "2.4rem", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {jobTitle}
          </h2>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Chilanga Cement PLC • Step Up Program 2026</p>
        </div>

        <div style={twoCol}>
          <div>
            <label style={label}>Full Name *</label>
            <input name="full_name" style={input} value={form.full_name} onChange={handleChange} required />
          </div>
          <div>
            <label style={label}>Email Address *</label>
            <input name="email" type="email" style={input} value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label style={label}>Phone Number *</label>
            <input name="phone" style={input} value={form.phone} onChange={handleChange} placeholder="0977 123 456" required />
          </div>
          <div>
            <label style={label}>Alternative Phone</label>
            <input name="alt_phone" style={input} value={form.alt_phone} onChange={handleChange} />
          </div>
        </div>

        <div style={{ ...twoCol, marginTop: "32px" }}>
          <div>
            <label style={label}>Date of Birth</label>
            <input name="dob" type="date" style={input} value={form.dob} onChange={handleChange} />
          </div>
          <div>
            <label style={label}>
              Age {form.age && parseInt(form.age) < 18 && <span style={{ color: "#ef4444", fontSize: "0.9rem" }}> (Must be 18+)</span>}
            </label>
            <input name="age" style={{ ...input, background: "#f8fafc" }} value={form.age} readOnly />
          </div>
        </div>

        <div style={{ ...twoCol, marginTop: "32px" }}>
          <div>
            <label style={label}>Gender</label>
            <select name="gender" style={input} value={form.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label style={label}>Nationality</label>
            <input name="nationality" style={input} value={form.nationality} onChange={handleChange} />
          </div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Highest Qualification *</label>
          <select name="qualification" style={input} value={form.qualification} onChange={handleChange} required>
            <option value="">Select Qualification</option>
            {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Institution / University *</label>
          <select name="institution" style={input} value={form.institution} onChange={handleChange} required>
            <option value="">Select Institution</option>
            {institutions.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div style={{ ...twoCol, marginTop: "32px" }}>
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

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Key Skills</label>
          <input name="skills" style={input} value={form.skills} onChange={handleChange} placeholder="AutoCAD, Excel, Python..." />
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {commonSkills.map(skill => (
              <button key={skill} type="button" onClick={() => addSkill(skill)} style={skillBtn}>+ {skill}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Work Experience / Background</label>
          <textarea
            name="experience"
            value={form.experience}
            onChange={handleChange}
            style={{ ...input, minHeight: "110px" }}
            placeholder="Briefly describe any internships, work experience, or relevant projects..."
          />
        </div>

        {/* CV Section */}
        <div style={{ marginTop: "40px" }}>
          <label style={label}>How would you like to provide your CV?</label>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
            <button onClick={() => setCvOption("upload")} style={{ ...optionBtn, background: cvOption === "upload" ? "#f59e0b" : "#f1f5f9", color: cvOption === "upload" ? "#fff" : "#1e2937" }}>
              📎 Upload CV File
            </button>
            <button onClick={() => setCvOption("type")} style={{ ...optionBtn, background: cvOption === "type" ? "#f59e0b" : "#f1f5f9", color: cvOption === "type" ? "#fff" : "#1e2937" }}>
              📝 Paste CV Content
            </button>
          </div>
        </div>

        {cvOption === "upload" && (
          <div style={{ marginTop: "24px" }}>
            <label style={label}>Upload CV (PDF or Word)</label>
            <input id="cvFile" type="file" accept=".pdf,.doc,.docx" style={input} />
          </div>
        )}

        {cvOption === "type" && (
          <div style={{ marginTop: "24px" }}>
            <label style={label}>Paste Your CV Content</label>
            <textarea name="cv_text" value={form.cv_text} onChange={handleChange} style={{ ...input, minHeight: "160px" }} placeholder="Paste your full CV here..." />
            <button onClick={reviewWithAI} disabled={aiLoading || !form.cv_text} style={aiBtn}>
              {aiLoading ? "Analyzing with AI..." : "Review with AI Agent"}
            </button>
            {aiReview && <div style={aiCard}> {/* Your AI review display */} </div>}
          </div>
        )}

        <div style={{ marginTop: "40px" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", fontSize: "1.02rem" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 5 }} />
            <span>I confirm that the information provided is accurate and I agree to the Terms & Conditions of the Chilanga Cement Step Up Program 2026.</span>
          </label>
        </div>

        <button
          onClick={submitApplication}
          disabled={loading || !agreed}
          style={submitBtn}
        >
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

// ====================== PROFESSIONAL STYLES ======================
const label = { 
  display: "block", 
  marginBottom: "8px", 
  fontWeight: "600", 
  color: "#374151",
  fontSize: "0.98rem" 
};

const input = { 
  width: "100%", 
  padding: "16px", 
  border: "1px solid #e2e8f0", 
  borderRadius: "12px", 
  fontSize: "1rem", 
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};

const twoCol = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
  gap: "24px" 
};

const skillBtn = { 
  padding: "8px 16px", 
  fontSize: "0.9rem", 
  border: "1px solid #e2e8f0", 
  borderRadius: "9999px", 
  background: "#f8fafc", 
  cursor: "pointer" 
};

const optionBtn = { 
  padding: "14px 32px", 
  borderRadius: "12px", 
  border: "none", 
  fontWeight: "600", 
  cursor: "pointer",
  transition: "all 0.3s ease"
};

const aiBtn = { 
  marginTop: "16px", 
  padding: "14px 32px", 
  background: "#10b981", 
  color: "white", 
  border: "none", 
  borderRadius: "12px", 
  cursor: "pointer",
  fontWeight: "600"
};

const aiCard = { 
  marginTop: "20px", 
  padding: "24px", 
  background: "#f0fdf4", 
  borderRadius: "16px", 
  border: "1px solid #86efac" 
};

const submitBtn = { 
  width: "100%", 
  padding: "18px", 
  marginTop: "40px", 
  background: "#f59e0b", 
  color: "white", 
  border: "none", 
  borderRadius: "12px", 
  fontSize: "1.1rem", 
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.3s ease"
};
