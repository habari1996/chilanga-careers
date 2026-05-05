import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function ApplyForm({ onSuccess, refreshData, initialJobId }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "",
    gender: "", nationality: "Zambian", qualification: "", institution: "",
    field_of_study: "", graduation_year: "", skills: "", experience: "",
    cv_text: "", job_id: null,
  });

  const [files, setFiles] = useState({
    nrc: null,
    cv: null,
    qualifications: null,
  });

  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Graduate Trainee Application — Step Up Program 2026");

  // Job ID handling (unchanged)
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

  const handleFileChange = (type, e) => {
    setFiles(prev => ({ ...prev, [type]: e.target.files[0] }));
  };

  const handleChange = (e) => { /* your existing handleChange */ 
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

  // ... keep your addSkill, reviewWithAI, and submitApplication functions

  const submitApplication = async () => {
    // ... your existing validation

    setLoading(true);
    try {
      let cv_url = null;
      let nrc_url = null;
      let quals_url = null;

      // Upload NRC
      if (files.nrc) {
        const fileName = `documents/nrc/${Date.now()}_${files.nrc.name}`;
        await supabase.storage.from("cvs").upload(fileName, files.nrc);
        const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
        nrc_url = data.publicUrl;
      }

      // Upload CV
      if (files.cv) {
        const fileName = `documents/cv/${Date.now()}_${files.cv.name}`;
        await supabase.storage.from("cvs").upload(fileName, files.cv);
        const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
        cv_url = data.publicUrl;
      }

      // Upload Qualifications
      if (files.qualifications) {
        const fileName = `documents/qualifications/${Date.now()}_${files.qualifications.name}`;
        await supabase.storage.from("cvs").upload(fileName, files.qualifications);
        const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
        quals_url = data.publicUrl;
      }

      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        cv_url,
        nrc_url,           // Add these new fields to your Supabase table
        qualifications_url: quals_url,
        status: "New",
        score: 0,
        dob: form.dob || null
      };

      // ... rest of your submit logic (insert, AI score update, etc.)

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
          <h2 style={{ fontSize: "2.4rem", fontWeight: 700, color: "#0f172a" }}>{jobTitle}</h2>
          <p style={{ color: "#64748b" }}>Chilanga Cement PLC • Step Up Program 2026</p>
        </div>

        {/* Rest of form fields remain the same... */}

        {/* === NEW DOCUMENTS UPLOAD SECTION === */}
        <div style={{ marginTop: "40px" }}>
          <label style={label}>Upload Required Documents</label>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "16px" }}>
            Please upload your NRC, CV, and academic qualifications (PDF or scanned images)
          </p>

          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label style={label}>National Registration Card (NRC) *</label>
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={(e) => handleFileChange("nrc", e)}
                style={input} 
              />
            </div>

            <div>
              <label style={label}>Curriculum Vitae (CV / Resume) *</label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                onChange={(e) => handleFileChange("cv", e)}
                style={input} 
              />
            </div>

            <div>
              <label style={label}>Academic Qualifications / Certificates</label>
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={(e) => handleFileChange("qualifications", e)}
                style={input} 
              />
              <small style={{ color: "#64748b" }}>Grade 12, Diploma, Degree certificates, etc.</small>
            </div>
          </div>
        </div>

        {/* Agreement & Submit Button */}
        <div style={{ marginTop: "40px" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
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

// Styles (add these at the bottom)
const label = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" };
const input = { width: "100%", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "1rem" };
const submitBtn = { width: "100%", padding: "18px", marginTop: "40px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "600" };
