import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import useIsMobile from "../hooks/useIsMobile";

// Cloudflare Turnstile site key (public). Set VITE_TURNSTILE_SITE_KEY in the
// Netlify environment; falls back to Cloudflare's always-passes TEST key so the
// form still works before the real key is configured.
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export default function ApplyForm({ onSuccess, refreshData, initialJobId }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "",
    gender: "", nationality: "Zambian", qualification: "", institution: "",
    field_of_study: "", graduation_year: "", skills: "", experience: "",
    cv_text: "", job_id: null,
    other_institution: "", other_qualification: "", other_field: ""
  });
  const [files, setFiles] = useState({ nrc: null, cv: null, qualifications: null, tertiary: null });
  
  // Grade 12 Results State (Zambian 1-9 numeric system)
  const [grade12Subjects, setGrade12Subjects] = useState([
    { subject: "", points: "" }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Graduate Trainee Application — Step Up Program 2026");
  
  // Cloudflare Turnstile CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  const widgetIdRef = useRef(null);

  // ===== Fake AI Demo State =====
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Load the Turnstile script and render the widget once.
  useEffect(() => {
    if (!agreed) return;

    const renderWidget = () => {
      if (window.turnstile && captchaRef.current && widgetIdRef.current === null) {
        widgetIdRef.current = window.turnstile.render(captchaRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(""),
          "error-callback": () => setCaptchaToken(""),
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      let script = document.querySelector(`script[src="${src}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
    }

    return () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        try { window.turnstile.remove(widgetIdRef.current); } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [agreed]);

  // Calculate total points (lower = better in Zambian system)
  const totalPoints = grade12Subjects.reduce((sum, item) => {
    const p = parseInt(item.points);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

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

  const handleFileChange = (type, e) => setFiles(prev => ({ ...prev, [type]: e.target.files[0] }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "dob" && value ? { age: String(new Date().getFullYear() - new Date(value).getFullYear()) } : {})
    }));
  };

  const handleOtherChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addGrade12Subject = () => {
    if (grade12Subjects.length < 12) {
      setGrade12Subjects(prev => [...prev, { subject: "", points: "" }]);
    }
  };

  const removeGrade12Subject = (index) => {
    if (grade12Subjects.length > 1) {
      setGrade12Subjects(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateGrade12 = (index, field, value) => {
    setGrade12Subjects(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const runFakeAI = async () => {
    setAiAnalyzing(true);
    setAiResult(null);
    await new Promise(r => setTimeout(r, 1800 + Math.random() * 1200));
    const skillsPool = ["Problem Solving", "Team Leadership", "Data Analysis", "Process Improvement", "Safety Compliance", "AutoCAD", "Microsoft Office", "Communication", "Project Management", "Quality Control", "Mechanical Systems", "Financial Analysis"];
    const shuffled = [...skillsPool].sort(() => Math.random() - 0.5).slice(0, 4 + Math.floor(Math.random() * 3));
    const summaries = [
      "Strong academic foundation with practical exposure. Recommended for interview stage.",
      "Solid candidate profile. Technical skills align well with graduate trainee requirements.",
      "Competitive application. Demonstrates relevant coursework and extracurricular involvement.",
      "Promising profile. Further assessment of soft skills recommended during interview."
    ];
    setAiResult({
      score: 68 + Math.floor(Math.random() * 25),
      skills: shuffled,
      summary: summaries[Math.floor(Math.random() * summaries.length)]
    });
    setAiAnalyzing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { alert("Please accept the terms and conditions."); return; }
    if (!captchaToken) { alert("Please complete the CAPTCHA verification."); return; }
    if (!files.cv) { alert("Please upload your CV."); return; }
    if (!files.nrc) { alert("Please upload a copy of your NRC."); return; }
    if (!form.full_name || !form.email || !form.phone || !form.dob || !form.gender || !form.qualification) {
      alert("Please fill in all required personal and qualification fields.");
      return;
    }

    setLoading(true);
    try {
      const { supabase: sb } = await import("../supabaseClient");
      // Upload files
      const upload = async (file, folder) => {
        if (!file) return null;
        const ext = file.name.split(".").pop();
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await sb.storage.from("cvs").upload(path, file, { upsert: false });
        if (error) throw error;
        return path;
      };

      const [cv_url, nrc_url, qualifications_url, tertiary_certificate_url] = await Promise.all([
        upload(files.cv, "cv"),
        upload(files.nrc, "nrc"),
        upload(files.qualifications, "qualifications"),
        upload(files.tertiary, "tertiary")
      ]);

      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        alt_phone: form.alt_phone?.trim() || null,
        dob: form.dob,
        age: parseInt(form.age) || null,
        gender: form.gender,
        nationality: form.nationality || "Zambian",
        qualification: form.qualification === "Other" ? form.other_qualification : form.qualification,
        institution: form.institution === "Other" ? form.other_institution : form.institution,
        field_of_study: form.field_of_study === "Other" ? form.other_field : form.field_of_study,
        graduation_year: form.graduation_year || null,
        skills: form.skills || null,
        experience: form.experience || null,
        cv_url,
        nrc_url,
        qualifications_url,
        tertiary_certificate_url,
        job_id: form.job_id || null,
        status: "New",
        captcha_token: captchaToken
      };

      const { data: app, error } = await sb.from("applications").insert(payload).select("id").single();
      if (error) throw error;

      // Insert Grade 12 results
      const gradeRows = grade12Subjects
        .filter(s => s.subject && s.points)
        .map(s => ({
          application_id: app.id,
          subject: s.subject.trim(),
          points: parseInt(s.points)
        }));
      if (gradeRows.length) {
        await sb.from("grade12_results").insert(gradeRows);
      }

      if (refreshData) await refreshData();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "920px", margin: isMobile ? "16px auto" : "40px auto", padding: "0 12px" }}>
      <div style={{ background: "#ffffff", padding: isMobile ? "24px 16px" : "48px 40px", borderRadius: isMobile ? "14px" : "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? "24px" : "40px" }}>
          <h2 style={{ fontSize: isMobile ? "1.45rem" : "2.4rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.25, wordBreak: "break-word" }}>{jobTitle}</h2>
          <p style={{ color: "#64748b", fontSize: isMobile ? "0.9rem" : undefined }}>Chilanga Cement PLC • Step Up Program 2026</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", marginBottom: 16, borderBottom: "2px solid #f1f5f9", paddingBottom: 8 }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 20 }}>
              <div>
                <label style={label}>Full Name *</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required style={input} placeholder="As on NRC" />
              </div>
              <div>
                <label style={label}>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required style={input} />
              </div>
              <div>
                <label style={label}>Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required style={input} placeholder="+260..." />
              </div>
              <div>
                <label style={label}>Alternative Phone</label>
                <input name="alt_phone" value={form.alt_phone} onChange={handleChange} style={input} />
              </div>
              <div>
                <label style={label}>Date of Birth *</label>
                <input name="dob" type="date" value={form.dob} onChange={handleChange} required style={input} />
              </div>
              <div>
                <label style={label}>Age</label>
                <input name="age" value={form.age} readOnly style={{ ...input, background: "#f8fafc" }} />
              </div>
              <div>
                <label style={label}>Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange} required style={input}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label style={label}>Nationality</label>
                <input name="nationality" value={form.nationality} onChange={handleChange} style={input} />
              </div>
            </div>
          </section>

          {/* Qualification */}
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", marginBottom: 16, borderBottom: "2px solid #f1f5f9", paddingBottom: 8 }}>Qualification & Institution</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 20 }}>
              <div>
                <label style={label}>Highest Qualification *</label>
                <select name="qualification" value={form.qualification} onChange={handleChange} required style={input}>
                  <option value="">Select</option>
                  <option value="Grade 12 Certificate">Grade 12 Certificate</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Advanced Diploma">Advanced Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Bachelor of Engineering">Bachelor of Engineering</option>
                  <option value="Bachelor of Science">Bachelor of Science</option>
                  <option value="Bachelor of Commerce">Bachelor of Commerce</option>
                  <option value="Bachelor of Business Administration">Bachelor of Business Administration</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Other">Other</option>
                </select>
                {form.qualification === "Other" && (
                  <input value={form.other_qualification} onChange={(e) => handleOtherChange("other_qualification", e.target.value)} required style={{ ...input, marginTop: 8 }} placeholder="Specify qualification" />
                )}
              </div>
              <div>
                <label style={label}>Institution</label>
                <input name="institution" value={form.institution} onChange={handleChange} style={input} list="institutions" />
                <datalist id="institutions">
                  <option value="University of Zambia" /><option value="Copperbelt University" /><option value="Mulungushi University" />
                  <option value="Zambia Catholic University" /><option value="Cavendish University" /><option value="Other" />
                </datalist>
                {form.institution === "Other" && (
                  <input value={form.other_institution} onChange={(e) => handleOtherChange("other_institution", e.target.value)} style={{ ...input, marginTop: 8 }} placeholder="Specify institution" />
                )}
              </div>
              <div>
                <label style={label}>Field of Study</label>
                <input name="field_of_study" value={form.field_of_study} onChange={handleChange} style={input} />
                {form.field_of_study === "Other" && (
                  <input value={form.other_field} onChange={(e) => handleOtherChange("other_field", e.target.value)} style={{ ...input, marginTop: 8 }} placeholder="Specify field" />
                )}
              </div>
              <div>
                <label style={label}>Graduation Year</label>
                <input name="graduation_year" value={form.graduation_year} onChange={handleChange} style={input} placeholder="e.g. 2025" />
              </div>
            </div>
          </section>

          {/* Grade 12 Results */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 8, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>Grade 12 Results (ECZ points)</h3>
              <button type="button" onClick={addGrade12Subject} style={{ padding: "6px 14px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontSize: "0.9rem", cursor: "pointer", alignSelf: isMobile ? "stretch" : undefined }}>+ Add Subject</button>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 12 }}>Lower points = better (Zambian system). Enter main subjects.</p>
            {grade12Subjects.map((item, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 80px auto" : "2fr 1fr auto", gap: isMobile ? "8px" : "12px", marginBottom: "12px", alignItems: "center" }}>
                <input value={item.subject} onChange={(e) => updateGrade12(index, "subject", e.target.value)} placeholder="Subject e.g. Mathematics" style={input} />
                <input type="number" min="1" max="9" value={item.points} onChange={(e) => updateGrade12(index, "points", e.target.value)} placeholder="Pts" style={input} />
                <button type="button" onClick={() => removeGrade12Subject(index)} disabled={grade12Subjects.length === 1} style={{ padding: "10px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, cursor: "pointer" }}>✕</button>
              </div>
            ))}
            {totalPoints > 0 && <p style={{ fontWeight: 600, color: "#0f172a" }}>Total points: {totalPoints}</p>}
          </section>

          {/* Skills & Experience */}
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", marginBottom: 16, borderBottom: "2px solid #f1f5f9", paddingBottom: 8 }}>Skills & Experience</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Key Skills</label>
              <textarea name="skills" value={form.skills} onChange={handleChange} rows={3} style={input} placeholder="e.g. AutoCAD, Excel, Leadership..." />
            </div>
            <div>
              <label style={label}>Relevant Experience / Internships</label>
              <textarea name="experience" value={form.experience} onChange={handleChange} rows={3} style={input} />
            </div>
          </section>

          {/* Documents */}
          <section style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", marginBottom: 16, borderBottom: "2px solid #f1f5f9", paddingBottom: 8 }}>Documents</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16 }}>
              <div>
                <label style={label}>CV / Resume * (PDF preferred)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange("cv", e)} required style={{ width: "100%" }} />
              </div>
              <div>
                <label style={label}>NRC Copy *</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("nrc", e)} required style={{ width: "100%" }} />
              </div>
              <div>
                <label style={label}>Grade 12 / Qualifications</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("qualifications", e)} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={label}>Tertiary Certificate / Transcript</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("tertiary", e)} style={{ width: "100%" }} />
              </div>
            </div>
          </section>

          {/* AI Demo + Terms + CAPTCHA */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <button type="button" onClick={runFakeAI} disabled={aiAnalyzing} style={{ padding: "10px 18px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                {aiAnalyzing ? "Analyzing profile..." : "Run AI Profile Review (Demo)"}
              </button>
              {aiResult && (
                <div style={{ marginTop: 12, fontSize: "0.95rem" }}>
                  <p><strong>Score:</strong> {aiResult.score}/100</p>
                  <p><strong>Detected skills:</strong> {aiResult.skills.join(", ")}</p>
                  <p style={{ color: "#475569" }}>{aiResult.summary}</p>
                </div>
              )}
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 16 }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 4 }} />
              <span style={{ fontSize: "0.95rem", color: "#334155" }}>I confirm that the information provided is true and accurate. I consent to Chilanga Cement processing my data for recruitment purposes.</span>
            </label>

            {agreed && (
              <div ref={captchaRef} style={{ marginBottom: 16 }} />
            )}
          </section>

          <button type="submit" disabled={loading || !agreed} style={submitBtn}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

const label = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" };
const input = { width: "100%", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "1rem", boxSizing: "border-box" };
const submitBtn = { width: "100%", padding: "18px", marginTop: "40px", background: "#b45309", color: "white", border: "none", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "600", cursor: "pointer" };
