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
    cv_text: "",
  });

  const [cvOption, setCvOption] = useState("upload");
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const qualifications = [ /* your list */ ];
  const institutions = [ /* your list */ ];
  const fieldsOfStudy = [ /* your list */ ];

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

  // ==================== IMPROVED AI REVIEW ====================
  const reviewWithAI = async () => {
    if (!form.cv_text || form.cv_text.trim().length < 50) {
      alert("Please paste at least 50 characters of your CV.");
      return;
    }

    setAiLoading(true);

    setTimeout(() => {
      const text = form.cv_text.toLowerCase();
      let score = 62;

      // Zambian Context Keywords
      const zambianKeywords = ["unza", "cbu", "mulungushi", "zambia", "lusaka", "kitwe", "ndola", "copperbelt", "mining", "cement"];
      zambianKeywords.forEach(kw => { if (text.includes(kw)) score += 6; });

      // Education
      if (text.includes("bachelor") || text.includes("beng") || text.includes("bsc")) score += 18;
      if (text.includes("master") || text.includes("msc")) score += 12;
      if (text.includes("engineering")) score += 15;

      // Technical Skills
      const techSkills = ["python", "autocad", "excel", "matlab", "solidworks", "sap", "power bi", "sql"];
      techSkills.forEach(skill => { if (text.includes(skill)) score += 7; });

      // Experience & Soft Skills
      if (text.includes("internship") || text.includes("trainee")) score += 14;
      if (text.includes("led") || text.includes("managed") || text.includes("team")) score += 10;

      score = Math.min(98, Math.max(58, Math.floor(score)));

      const review = {
        score,
        strengths: [
          score > 80 ? "Strong academic background" : "",
          text.includes("python") || text.includes("excel") ? "Relevant technical skills" : "",
          text.includes("internship") ? "Practical experience" : "",
          text.includes("leadership") ? "Leadership potential" : ""
        ].filter(Boolean),
        weaknesses: score < 75 ? ["Limited work experience"] : [],
        recommendation: score >= 82 ? "Strong Candidate - Highly Recommend Shortlisting" :
                       score >= 72 ? "Good Candidate - Consider for Shortlist" : "Average Profile",
        summary: `Overall ${score >= 80 ? "strong" : "solid"} candidate with good potential for Chilanga Cement's Graduate Trainee Program.`
      };

      setAiReview(review);

      // Save AI Review to Database
      saveAIReview(review);

      alert(`🧠 AI Review Complete!\nScore: ${score}%`);
      setAiLoading(false);
    }, 1350);
  };

  // Save AI Review to Database
  const saveAIReview = async (review) => {
    try {
      await supabase.from("applications").update({
        score: review.score,
        // You can add a new column later for full review text if needed
      }).eq("email", form.email);
    } catch (e) {
      console.log("AI score save skipped");
    }
  };

  const submitApplication = async () => { /* your existing logic */ };

  return (
    <div style={{ maxWidth: "820px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ background: "#ffffff", padding: "48px 40px", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
        {/* ... Personal fields same as before ... */}

        {cvOption === "type" && (
          <div style={{ marginTop: "20px" }}>
            <label style={label}>Paste Your CV Content *</label>
            <textarea name="cv_text" value={form.cv_text} onChange={handleChange} style={{ ...input, minHeight: "180px" }} placeholder="Paste your full CV here..." />

            <button onClick={reviewWithAI} disabled={aiLoading || !form.cv_text} style={aiBtn}>
              {aiLoading ? "Analyzing with AI..." : "Review with AI Agent"}
            </button>

            {aiReview && (
              <div style={aiCard}>
                <h4>🧠 AI Review Result — Score: {aiReview.score}%</h4>
                <p><strong>Summary:</strong> {aiReview.summary}</p>
                <p><strong>Recommendation:</strong> {aiReview.recommendation}</p>
                {aiReview.strengths.length > 0 && (
                  <p><strong>Strengths:</strong> {aiReview.strengths.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
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
const aiBtn = { marginTop: "12px", padding: "12px 24px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" };
const aiCard = { marginTop: "20px", padding: "20px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #86efac" };
const submitBtn = { width: "100%", padding: "16px", marginTop: "30px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: "600", cursor: "pointer" };
