import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import useIsMobile from "../hooks/useIsMobile";

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
  const [grade12Subjects, setGrade12Subjects] = useState([{ subject: "", points: "" }]);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Job Application — Chilanga Cement");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  const widgetIdRef = useRef(null);

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

  const totalPoints = grade12Subjects.reduce((sum, item) => {
    const p = parseInt(item.points, 10);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  useEffect(() => {
    const jobId = initialJobId;
    if (!jobId) return;
    (async () => {
      const { data } = await supabase.from("jobs").select("id, title").eq("id", jobId).maybeSingle();
      if (data) {
        setForm((prev) => ({ ...prev, job_id: data.id }));
        setJobTitle(data.title || "Job Application — Chilanga Cement");
      }
    })();
  }, [initialJobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleOtherChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const handleFileChange = (key, e) => {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const addGrade12Subject = () => {
    if (grade12Subjects.length >= 12) return;
    setGrade12Subjects((prev) => [...prev, { subject: "", points: "" }]);
  };
  const removeGrade12Subject = (index) => {
    if (grade12Subjects.length <= 1) return;
    setGrade12Subjects((prev) => prev.filter((_, i) => i !== index));
  };
  const updateGrade12 = (index, field, value) => {
    setGrade12Subjects((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { alert("Please accept the terms and conditions."); return; }
    if (!captchaToken) { alert("Please complete the CAPTCHA verification."); return; }
    if (!files.cv) { alert("Please upload your CV."); return; }
    if (!files.nrc) { alert("Please upload a copy of your NRC."); return; }

    const MAX_BYTES = 5 * 1024 * 1024;
    const ALLOWED = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    const checkFile = (file, label) => {
      if (!file) return null;
      if (file.size > MAX_BYTES) return `${label} must be under 5 MB.`;
      if (file.type && !ALLOWED.includes(file.type)) {
        return `${label} must be PDF, Word, JPG, or PNG.`;
      }
      return null;
    };
    for (const [key, label] of [
      ["cv", "CV"],
      ["nrc", "NRC"],
      ["qualifications", "Results / transcript"],
      ["tertiary", "Tertiary certificate"],
    ]) {
      const errMsg = checkFile(files[key], label);
      if (errMsg) { alert(errMsg); return; }
    }

    setLoading(true);
    try {
      const sb = supabase;
      const upload = async (file, folder) => {
        if (!file) return null;
        const ext = file.name.split(".").pop();
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await sb.storage.from("cvs").upload(path, file, { upsert: false });
        if (error) throw error;
        return path;
      };

      const [cvPath, nrcPath, qualPath, tertPath] = await Promise.all([
        upload(files.cv, "cv"),
        upload(files.nrc, "nrc"),
        upload(files.qualifications, "qualifications"),
        upload(files.tertiary, "tertiary"),
      ]);

      const application = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        alt_phone: form.alt_phone || null,
        dob: form.dob || null,
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        nationality: form.nationality || "Zambian",
        qualification: form.qualification === "Other" ? form.other_qualification : form.qualification,
        institution: form.institution === "Other" ? form.other_institution : form.institution,
        field_of_study: form.field_of_study === "Other" ? form.other_field : form.field_of_study,
        graduation_year: form.graduation_year || null,
        skills: form.skills || null,
        experience: form.experience || null,
        cv_url: cvPath,
        nrc_url: nrcPath,
        qualifications_url: qualPath,
        tertiary_certificate_url: tertPath,
        job_id: form.job_id || null,
      };

      const grade12 = grade12Subjects
        .filter((s) => s.subject && s.points !== "")
        .map((s) => ({ subject: s.subject, grade: String(s.points), points: parseInt(s.points, 10) || 0 }));

      const res = await fetch("/.netlify/functions/submit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captchaToken, application, grade12 }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || "Submission failed");
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
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "8px 0" : "0" }}>
      <div style={{ background: "white", borderRadius: 16, padding: isMobile ? 16 : 32, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        <h2 style={{ marginTop: 0, fontSize: isMobile ? "1.35rem" : "1.75rem" }}>{jobTitle}</h2>
        <p style={{ color: "#64748b", marginBottom: 24 }}>Complete all required fields and upload your documents.</p>
        <form onSubmit={handleSubmit}>
          <section style={{ marginBottom: 32 }}>
            <h3 style={sectionH}>Personal details</h3>
            <div style={grid2}>
              <div><label style={label}>Full name *</label><input name="full_name" value={form.full_name} onChange={handleChange} required style={input} /></div>
              <div><label style={label}>Email *</label><input name="email" type="email" value={form.email} onChange={handleChange} required style={input} /></div>
              <div><label style={label}>Phone *</label><input name="phone" value={form.phone} onChange={handleChange} required style={input} /></div>
              <div><label style={label}>Alt phone</label><input name="alt_phone" value={form.alt_phone} onChange={handleChange} style={input} /></div>
              <div><label style={label}>Date of birth</label><input name="dob" type="date" value={form.dob} onChange={handleChange} style={input} /></div>
              <div><label style={label}>Age</label><input name="age" type="number" value={form.age} onChange={handleChange} style={input} /></div>
              <div>
                <label style={label}>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} style={input}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div><label style={label}>Nationality</label><input name="nationality" value={form.nationality} onChange={handleChange} style={input} /></div>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h3 style={sectionH}>Education</h3>
            <div style={grid2}>
              <div>
                <label style={label}>Qualification</label>
                <select name="qualification" value={form.qualification} onChange={handleChange} style={input}>
                  <option value="">Select</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Bachelor of Engineering">Bachelor of Engineering</option>
                  <option value="Bachelor of Science">Bachelor of Science</option>
                  <option value="Bachelor of Arts">Bachelor of Arts</option>
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
                  <input value={form.other_institution} onChange={(e) => handleOtherChange("other_institution", e.target.value)} required style={{ ...input, marginTop: 8 }} placeholder="Specify institution" />
                )}
              </div>
              <div>
                <label style={label}>Field of study</label>
                <input name="field_of_study" value={form.field_of_study} onChange={handleChange} style={input} />
              </div>
              <div>
                <label style={label}>Graduation year</label>
                <input name="graduation_year" value={form.graduation_year} onChange={handleChange} style={input} placeholder="e.g. 2024" />
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h3 style={sectionH}>Grade 12 results (optional)</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Enter subjects and points (1–9 scale). Total: {totalPoints}</p>
            {grade12Subjects.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <input placeholder="Subject" value={item.subject} onChange={(e) => updateGrade12(index, "subject", e.target.value)} style={{ ...input, flex: 2, minWidth: 140 }} />
                <input placeholder="Points" type="number" min="1" max="9" value={item.points} onChange={(e) => updateGrade12(index, "points", e.target.value)} style={{ ...input, flex: 1, minWidth: 80 }} />
                <button type="button" onClick={() => removeGrade12Subject(index)} disabled={grade12Subjects.length === 1} style={{ padding: "10px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 8, cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addGrade12Subject} style={{ marginTop: 8, padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer" }}>+ Add subject</button>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h3 style={sectionH}>Skills & experience</h3>
            <div><label style={label}>Skills</label><input name="skills" value={form.skills} onChange={handleChange} style={input} placeholder="e.g. AutoCAD, Excel, Leadership..." /></div>
            <div style={{ marginTop: 12 }}><label style={label}>Relevant experience / internships</label><textarea name="experience" value={form.experience} onChange={handleChange} rows={3} style={input} /></div>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h3 style={sectionH}>Documents</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16 }}>
              <div><label style={label}>CV / Resume * (PDF preferred)</label><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange("cv", e)} required style={{ width: "100%" }} /></div>
              <div><label style={label}>NRC copy *</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("nrc", e)} required style={{ width: "100%" }} /></div>
              <div><label style={label}>Grade 12 / qualifications</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("qualifications", e)} style={{ width: "100%" }} /></div>
              <div><label style={label}>Tertiary certificate / transcript</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("tertiary", e)} style={{ width: "100%" }} /></div>
            </div>
          </section>

          <div style={{ marginTop: 24 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 16, lineHeight: 1.5 }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ color: "#374151", fontSize: "0.95rem" }}>
                I confirm that the information provided is true and complete. I understand that false information may lead to disqualification.
              </span>
            </label>
            {agreed && <div ref={captchaRef} style={{ marginBottom: 16 }} />}
          </div>

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
const sectionH = { fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", marginBottom: 16, borderBottom: "2px solid #f1f5f9", paddingBottom: 8 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16 };
