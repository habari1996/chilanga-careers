import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wpynkjowoosxcegtvzvq.supabase.co",
  "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM"
);

export default function ApplyForm({ onSuccess, refreshData }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", qualification: "",
    institution: "", skills: "", start_date: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadCV = async (file) => {
    const fileName = `cvs/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("cvs").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const submitApplication = async () => {
    if (!form.full_name || !form.email || !form.phone) {
      alert("Please fill in Name, Email and Phone");
      return;
    }

    setLoading(true);
    try {
      const file = document.getElementById("cvFile")?.files[0];
      const cv_url = file ? await uploadCV(file) : null;

      const payload = { ...form, cv_url, status: "New", score: 0 };

      const { error } = await supabase.from("applications").insert([payload]);
      if (error) throw error;

      alert("✅ Application submitted successfully!");
      onSuccess();
      refreshData();

      // Reset form
      setForm({ full_name: "", email: "", phone: "", qualification: "", institution: "", skills: "", start_date: "" });
      document.getElementById("cvFile").value = "";
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <div style={{ background: "white", padding: 32, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
        <h2>Graduate Trainee Application — Step Up Program 2026</h2>

        <input name="full_name" placeholder="Full Name *" style={input} onChange={handleChange} value={form.full_name} />
        <input name="email" type="email" placeholder="Email Address *" style={input} onChange={handleChange} value={form.email} />
        <input name="phone" placeholder="Phone Number *" style={input} onChange={handleChange} value={form.phone} />
        <input name="qualification" placeholder="Highest Qualification" style={input} onChange={handleChange} value={form.qualification} />
        <input name="institution" placeholder="Institution / University" style={input} onChange={handleChange} value={form.institution} />
        <input name="skills" placeholder="Skills (e.g. AutoCAD, Excel, Python)" style={input} onChange={handleChange} value={form.skills} />
        <input name="start_date" type="date" style={input} onChange={handleChange} value={form.start_date} />

        <label style={{ display: "block", margin: "15px 0 8px", fontWeight: 600 }}>
          Upload CV (PDF or Word)
        </label>
        <input id="cvFile" type="file" accept=".pdf,.doc,.docx" style={input} />

        <button onClick={submitApplication} disabled={loading} style={{ ...primaryBtn, width: "100%", padding: "14px", marginTop: 20 }}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

const input = { width: "100%", padding: "12px", marginBottom: 14, border: "1px solid #cbd5e1", borderRadius: 10 };
const primaryBtn = { background: "#f59e0b", color: "white", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" };
