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
    cv_text: "",           // New: Typed CV content
  });

  const [cvOption, setCvOption] = useState("upload"); // "upload" or "type"
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

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
      alert("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      let cv_url = null;

      if (cvOption === "upload") {
        const file = document.getElementById("cvFile")?.files[0];
        cv_url = file ? await uploadCV(file) : null;
      }

      const payload = { 
        ...form, 
        cv_url, 
        cv_text: cvOption === "type" ? form.cv_text : null,
        status: "New", 
        score: 0 
      };

      const { error } = await supabase.from("applications").insert([payload]);
      if (error) throw error;

      alert("✅ Application submitted successfully!");
      onSuccess();

      // Reset
      setForm({
        full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "",
        gender: "", nationality: "Zambian", qualification: "", institution: "",
        field_of_study: "", graduation_year: "", skills: "", experience: "", cv_text: ""
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
    <div style={{ maxWidth: "820px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ background: "#ffffff", padding: "48px 40px", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "32px", fontSize: "28px" }}>
          Graduate Trainee Application — Step Up Program 2026
        </h2>

        {/* ... Personal Info, Qualification, Institution fields same as before ... */}

        {/* CV Option Selection */}
        <div style={{ marginTop: "28px" }}>
          <label style={label}>How would you like to provide your CV?</label>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button 
              type="button"
              onClick={() => setCvOption("upload")}
              style={{ ...optionBtn, background: cvOption === "upload" ? "#f59e0b" : "#f1f5f9", color: cvOption === "upload" ? "white" : "#000" }}
            >
              Upload CV File
            </button>
            <button 
              type="button"
              onClick={() => setCvOption("type")}
              style={{ ...optionBtn, background: cvOption === "type" ? "#f59e0b" : "#f1f5f9", color: cvOption === "type" ? "white" : "#000" }}
            >
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
            <label style={label}>Paste Your CV Content / Experience *</label>
            <textarea 
              name="cv_text" 
              value={form.cv_text} 
              onChange={handleChange}
              style={{ ...input, minHeight: "180px", resize: "vertical" }}
              placeholder="Paste your full CV, experience, education, and skills here..."
            />
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

const label = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" };
const input = { width: "100%", padding: "14px 16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px" };
const optionBtn = { padding: "12px 24px", borderRadius: "12px", border: "none", fontWeight: "500", cursor: "pointer" };
const submitBtn = { width: "100%", padding: "16px", marginTop: "30px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: "600", cursor: "pointer" };
