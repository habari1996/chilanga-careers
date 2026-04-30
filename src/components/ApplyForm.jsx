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
  });

  const [cvOption, setCvOption] = useState("upload");
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("General Graduate Trainee Application");

  // Get job ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job");
    if (jobId) {
      // Optional: You can fetch job title here if needed
      setJobTitle(`Application for Job #${jobId}`);
      // Save job_id in form (we'll send it to DB)
      setForm(prev => ({ ...prev, job_id: jobId }));
    }
  }, []);

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

  const reviewWithAI = async () => { /* Keep your improved AI logic from before */ };

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
        const { error: uploadError } = await supabase.storage.from("cvs").upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
        cv_url = data.publicUrl;
      }

      const payload = {
        ...form,
        cv_url,
        status: "New",
        score: aiReview?.score || 0,
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
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: "32px" }}>
          Step Up Program 2026
        </p>

        {/* Rest of your form fields (Full Name, Email, Phone, DOB, Qualification, Institution, etc.) */}
        {/* Use the responsive version I sent earlier */}

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

        {/* CV Upload / Paste Section - Keep as before */}

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
const optionBtn = { padding: "12px 24px", borderRadius: "12px", border: "none", fontWeight: "500", cursor: "pointer" };
const submitBtn = { width: "100%", padding: "16px", marginTop: "30px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: "600", cursor: "pointer" };
