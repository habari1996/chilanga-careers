import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function ApplyForm({ onSuccess, refreshData, initialJobId }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", alt_phone: "", dob: "", age: "",
    gender: "", nationality: "Zambian", qualification: "", institution: "",
    field_of_study: "", graduation_year: "", skills: "", experience: "",
    cv_text: "", job_id: null,
    other_institution: "", other_qualification: "", other_field: ""
  });

  const [files, setFiles] = useState({ nrc: null, cv: null, qualifications: null });
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Graduate Trainee Application — Step Up Program 2026");

  // Job ID
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

  const handleOtherChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addSkill = (skill) => {
    const current = form.skills ? form.skills.split(", ").filter(Boolean) : [];
    if (!current.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...current, skill].join(", ") }));
    }
  };

  // File upload helper - uses existing 'cvs' bucket with organized subfolders
  const uploadFile = async (file, subfolder = "uploads") => {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${subfolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from("cvs").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Placeholder for future AI review feature
  const reviewWithAI = () => {
    alert("AI CV review feature coming soon!");
  };

  // ==================== MAIN SUBMIT FUNCTION ====================
  const submitApplication = async () => {
    if (!agreed) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload files using the existing 'cvs' bucket
      let cvUrl = null;
      let nrcUrl = null;
      let qualificationsUrl = null;

      if (files.cv) {
        cvUrl = await uploadFile(files.cv, "cvs");
      }
      if (files.nrc) {
        nrcUrl = await uploadFile(files.nrc, "nrc");
      }
      if (files.qualifications) {
        qualificationsUrl = await uploadFile(files.qualifications, "qualifications");
      }

      // 2. Prepare data matching the applications table schema
      const qualificationValue =
        form.qualification === "Other" ? form.other_qualification : form.qualification;

      const institutionValue =
        form.institution === "Other" ? form.other_institution : form.institution;

      const fieldValue =
        form.field_of_study === "Other" ? form.other_field : form.field_of_study;

      const applicationData = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        alt_phone: form.alt_phone || null,
        dob: form.dob || null,
        age: form.age || null,
        gender: form.gender || null,
        nationality: form.nationality || "Zambian",
        qualification: qualificationValue || null,
        institution: institutionValue,
        field_of_study: fieldValue || null,
        graduation_year: form.graduation_year || null,
        skills: form.skills || null,
        experience: form.experience || null,
        cv_url: cvUrl,
        nrc_url: nrcUrl,
        qualifications_url: qualificationsUrl,
        cv_text: form.cv_text || null,
        job_id: form.job_id || null,
        status: "New",
      };

      // 3. Insert into Supabase
      const { data, error } = await supabase
        .from("applications")
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Application submitted successfully:", data);

      // 4. Success
      if (onSuccess) onSuccess();
      if (refreshData) refreshData();

    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to submit application: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const qualifications = ["Grade 12 Certificate", "Certificate", "Diploma", "Advanced Diploma", "Bachelor's Degree", "Bachelor of Engineering", "Bachelor of Science", "Bachelor of Commerce", "Bachelor of Business Administration", "Master's Degree", "Other"];

  const institutions = ["University of Zambia (UNZA)", "Copperbelt University (CBU)", "Mulungushi University", "University of Lusaka (UNILUS)", "Zambia Open University (ZAOU)", "Kwame Nkrumah University", "Mukuba University", "Chalimbana University", "Levy Mwanawasa Medical University", "ZCAS University", "Cavendish University Zambia", "Eden University", "Lusaka Apex Medical University", "DMI-St. Eugene University", "Other"];

  const fieldsOfStudy = ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Mining Engineering", "Chemical Engineering", "Computer Science", "Information Technology", "Business Administration", "Accounting", "Finance", "Marketing", "Human Resource Management", "Other"];

  const commonSkills = ["AutoCAD", "Microsoft Excel", "Project Management", "Python", "Data Analysis", "MATLAB", "SolidWorks", "SAP", "Power BI", "SQL", "Leadership", "Communication"];

  return (
    <div style={{ maxWidth: "920px", margin: "40px auto", padding: "0 16px" }}>
      <div style={{ background: "#ffffff", padding: "48px 40px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "2.4rem", fontWeight: 700, color: "#0f172a" }}>{jobTitle}</h2>
          <p style={{ color: "#64748b" }}>Chilanga Cement PLC • Step Up Program 2026</p>
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
            <label style={label}>Age</label>
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

        {/* Qualification with Other */}
        <div style={{ marginTop: "32px" }}>
          <label style={label}>Highest Qualification *</label>
          <select name="qualification" style={input} value={form.qualification} onChange={handleChange} required>
            <option value="">Select Qualification</option>
            {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
            <option value="Other">Other (Please specify)</option>
          </select>
          {form.qualification === "Other" && <input type="text" placeholder="Enter qualification" style={{...input, marginTop: "12px"}} value={form.other_qualification} onChange={(e) => handleOtherChange("other_qualification", e.target.value)} required />}
        </div>

        {/* Institution with Other */}
        <div style={{ marginTop: "32px" }}>
          <label style={label}>Institution / University *</label>
          <select name="institution" style={input} value={form.institution} onChange={handleChange} required>
            <option value="">Select Institution</option>
            {institutions.map(i => <option key={i} value={i}>{i}</option>)}
            <option value="Other">Other (Please specify)</option>
          </select>
          {form.institution === "Other" && <input type="text" placeholder="Enter institution" style={{...input, marginTop: "12px"}} value={form.other_institution} onChange={(e) => handleOtherChange("other_institution", e.target.value)} required />}
        </div>

        {/* Field of Study with Other */}
        <div style={{ marginTop: "32px" }}>
          <label style={label}>Field of Study</label>
          <select name="field_of_study" style={input} value={form.field_of_study} onChange={handleChange}>
            <option value="">Select Field of Study</option>
            {fieldsOfStudy.map(f => <option key={f} value={f}>{f}</option>)}
            <option value="Other">Other (Please specify)</option>
          </select>
          {form.field_of_study === "Other" && <input type="text" placeholder="Enter field of study" style={{...input, marginTop: "12px"}} value={form.other_field} onChange={(e) => handleOtherChange("other_field", e.target.value)} />}
        </div>

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Key Skills</label>
          <input name="skills" style={input} value={form.skills} onChange={handleChange} placeholder="AutoCAD, Excel, Python..." />
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {commonSkills.map(skill => <button key={skill} type="button" onClick={() => addSkill(skill)} style={skillBtn}>+ {skill}</button>)}
          </div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Work Experience / Background</label>
          <textarea name="experience" value={form.experience} onChange={handleChange} style={{ ...input, minHeight: "110px" }} placeholder="Briefly describe any internships..." />
        </div>

        {/* Documents */}
        <div style={{ marginTop: "40px" }}>
          <label style={label}>Upload Required Documents</label>
          <p style={{ color: "#64748b", marginBottom: "16px" }}>NRC, CV, and Academic Qualifications</p>
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label style={label}>National Registration Card (NRC) *</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("nrc", e)} style={input} />
            </div>
            <div>
              <label style={label}>Curriculum Vitae (CV / Resume) *</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange("cv", e)} style={input} />
            </div>
            <div>
              <label style={label}>Academic Qualifications / Certificates</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("qualifications", e)} style={input} />
            </div>
          </div>
        </div>

        {/* AI Coming Soon Feature */}
        <div style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 14,
          padding: "20px 24px",
          marginTop: 40
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ fontSize: 28, marginTop: 2 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <strong style={{ fontSize: "1.05rem", color: "#0c4a6e" }}>AI-Powered CV Screening</strong>
                <span style={{
                  background: "#bae6fd",
                  color: "#0369a1",
                  fontSize: "0.75rem",
                  padding: "2px 10px",
                  borderRadius: 9999,
                  fontWeight: 600
                }}>
                  COMING SOON
                </span>
              </div>
              <p style={{ margin: 0, color: "#334155", fontSize: "0.97rem", lineHeight: 1.5 }}>
                Our AI will automatically analyze CVs, extract key skills and experience, and provide recruiters with an instant fit score and summary.
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "40px" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 4 }} />
            <span>I confirm that the information provided is accurate and I agree to the Terms &amp; Conditions of the Step Up Program 2026.</span>
          </label>
        </div>

        <button onClick={submitApplication} disabled={loading || !agreed} style={submitBtn}>
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

// ====================== STYLES ======================
const label = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" };
const input = { width: "100%", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "1rem", boxSizing: "border-box" };
const twoCol = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" };
const skillBtn = { padding: "8px 16px", fontSize: "0.9rem", border: "1px solid #e2e8f0", borderRadius: "9999px", background: "#f8fafc", cursor: "pointer" };
const submitBtn = { width: "100%", padding: "18px", marginTop: "40px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "600", cursor: "pointer" };
