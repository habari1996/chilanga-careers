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

  const [files, setFiles] = useState({ nrc: null, cv: null, qualifications: null, tertiary: null });

  // Grade 12 Results State (Zambian 1-9 numeric system)
  const [grade12Subjects, setGrade12Subjects] = useState([
    { subject: "", points: "" }
  ]);

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Graduate Trainee Application — Step Up Program 2026");

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

  // Grade 12 Subject Handlers (Zambian numeric system)
  const addGrade12Subject = () => {
    setGrade12Subjects([...grade12Subjects, { subject: "", points: "" }]);
  };

  const removeGrade12Subject = (index) => {
    if (grade12Subjects.length === 1) return;
    const updated = grade12Subjects.filter((_, i) => i !== index);
    setGrade12Subjects(updated);
  };

  const updateGrade12Subject = (index, field, value) => {
    const updated = [...grade12Subjects];
    updated[index][field] = value;
    setGrade12Subjects(updated);
  };

  // File upload helper
  const uploadFile = async (file, subfolder = "uploads") => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${subfolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error(`Failed to upload file: ${uploadError.message}`);

    // Store the object path (not a public URL) so the bucket can stay private.
    // HR generates a short-lived signed URL from this path when viewing.
    return filePath;
  };

  // Main Submit Function
  const submitApplication = async () => {
    if (!agreed) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    // Validate Grade 12 points (1-9 only)
    for (let subj of grade12Subjects) {
      if (subj.subject && subj.points) {
        const p = parseInt(subj.points);
        if (isNaN(p) || p < 1 || p > 9) {
          alert("Grade 12 points must be between 1 and 9");
          return;
        }
      }
    }

    setLoading(true);

    try {
      // 1. Upload files
      let cvUrl = null;
      let nrcUrl = null;
      let qualificationsUrl = null;
      let tertiaryUrl = null;

      if (files.cv) cvUrl = await uploadFile(files.cv, "cvs");
      if (files.nrc) nrcUrl = await uploadFile(files.nrc, "nrc");
      if (files.qualifications) qualificationsUrl = await uploadFile(files.qualifications, "qualifications");
      if (files.tertiary) tertiaryUrl = await uploadFile(files.tertiary, "tertiary");

      // 2. Prepare application data
      const qualificationValue = form.qualification === "Other" ? form.other_qualification : form.qualification;
      const institutionValue = form.institution === "Other" ? form.other_institution : form.institution;
      const fieldValue = form.field_of_study === "Other" ? form.other_field : form.field_of_study;

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
        tertiary_certificate_url: tertiaryUrl,
        cv_text: form.cv_text || null,
        job_id: form.job_id || null,
        status: "New",
      };

      // 3. Insert Application via SECURITY DEFINER RPC.
      // The applications table has no anon SELECT policy (to protect
      // applicant PII), so a direct .insert().select() would fail on the
      // RETURNING clause. submit_application inserts server-side and
      // returns only the new row id.
      const { data: newId, error: appError } = await supabase
        .rpc("submit_application", { p: applicationData });

      if (appError) throw appError;
      const appData = { id: newId };

      // 4. Insert Grade 12 Results (Zambian numeric system)
      const grade12Rows = grade12Subjects
        .filter(s => s.subject && s.points)
        .map(s => ({
          application_id: appData.id,
          subject: s.subject,
          grade: s.points,           // Store the numeric value as grade
          points: parseInt(s.points)
        }));

      if (grade12Rows.length > 0) {
        const { error: gradeError } = await supabase
          .from("grade12_results")
          .insert(grade12Rows);

        if (gradeError) throw gradeError;
      }

      // 5. Success
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

        {/* Personal Information */}
        <div style={twoCol}>
          <div><label style={label}>Full Name *</label><input name="full_name" style={input} value={form.full_name} onChange={handleChange} required /></div>
          <div><label style={label}>Email Address *</label><input name="email" type="email" style={input} value={form.email} onChange={handleChange} required /></div>
          <div><label style={label}>Phone Number *</label><input name="phone" style={input} value={form.phone} onChange={handleChange} placeholder="0977 123 456" required /></div>
          <div><label style={label}>Alternative Phone</label><input name="alt_phone" style={input} value={form.alt_phone} onChange={handleChange} /></div>
        </div>

        <div style={{ ...twoCol, marginTop: "32px" }}>
          <div><label style={label}>Date of Birth</label><input name="dob" type="date" style={input} value={form.dob} onChange={handleChange} /></div>
          <div><label style={label}>Age</label><input name="age" style={{ ...input, background: "#f8fafc" }} value={form.age} readOnly /></div>
        </div>

        <div style={{ ...twoCol, marginTop: "32px" }}>
          <div><label style={label}>Gender</label><select name="gender" style={input} value={form.gender} onChange={handleChange}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Prefer not to say">Prefer not to say</option></select></div>
          <div><label style={label}>Nationality</label><input name="nationality" style={input} value={form.nationality} onChange={handleChange} /></div>
        </div>

        {/* Qualification & Institution */}
        <div style={{ marginTop: "32px" }}>
          <label style={label}>Highest Qualification *</label>
          <select name="qualification" style={input} value={form.qualification} onChange={handleChange} required>
            <option value="">Select Qualification</option>
            {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
            <option value="Other">Other (Please specify)</option>
          </select>
          {form.qualification === "Other" && <input type="text" placeholder="Enter qualification" style={{...input, marginTop: "12px"}} value={form.other_qualification} onChange={(e) => handleOtherChange("other_qualification", e.target.value)} required />}
        </div>

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Institution / University *</label>
          <select name="institution" style={input} value={form.institution} onChange={handleChange} required>
            <option value="">Select Institution</option>
            {institutions.map(i => <option key={i} value={i}>{i}</option>)}
            <option value="Other">Other (Please specify)</option>
          </select>
          {form.institution === "Other" && <input type="text" placeholder="Enter institution" style={{...input, marginTop: "12px"}} value={form.other_institution} onChange={(e) => handleOtherChange("other_institution", e.target.value)} required />}
        </div>

        <div style={{ marginTop: "32px" }}>
          <label style={label}>Field of Study</label>
          <select name="field_of_study" style={input} value={form.field_of_study} onChange={handleChange}>
            <option value="">Select Field of Study</option>
            {fieldsOfStudy.map(f => <option key={f} value={f}>{f}</option>)}
            <option value="Other">Other (Please specify)</option>
          </select>
          {form.field_of_study === "Other" && <input type="text" placeholder="Enter field of study" style={{...input, marginTop: "12px"}} value={form.other_field} onChange={(e) => handleOtherChange("other_field", e.target.value)} />}
        </div>

        {/* Grade 12 Results Section - Zambian Numeric System (1-9) */}
        <div style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <label style={label}>Grade 12 Results</label>
              <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#64748b" }}>
                Enter subject and points (1 = Best, 9 = Worst). Lower total = Stronger candidate.
              </p>
            </div>
            <button type="button" onClick={addGrade12Subject} style={{ padding: "6px 14px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontSize: "0.9rem", cursor: "pointer" }}>+ Add Subject</button>
          </div>

          {grade12Subjects.map((item, index) => (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
              <input
                placeholder="Subject (e.g. Mathematics)"
                value={item.subject}
                onChange={(e) => updateGrade12Subject(index, "subject", e.target.value)}
                style={input}
              />
              <input
                type="number"
                min="1"
                max="9"
                placeholder="Points (1-9)"
                value={item.points}
                onChange={(e) => updateGrade12Subject(index, "points", e.target.value)}
                style={input}
              />
              <button type="button" onClick={() => removeGrade12Subject(index)} style={{ color: "#ef4444", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
          ))}

          <div style={{ marginTop: "8px", fontWeight: 600, color: "#0f172a", fontSize: "1.1rem" }}>
            Total Points: <span style={{ fontSize: "1.4rem", color: totalPoints <= 20 ? "#16a34a" : totalPoints <= 35 ? "#ca8a04" : "#ef4444" }}>{totalPoints}</span>
            <span style={{ fontSize: "0.9rem", color: "#64748b", marginLeft: "12px" }}>(Lower is better)</span>
          </div>
        </div>

        {/* Documents Upload */}
        <div style={{ marginTop: "40px" }}>
          <label style={label}>Upload Required Documents</label>
          <div style={{ display: "grid", gap: "20px", marginTop: "12px" }}>
            <div><label style={label}>National Registration Card (NRC) *</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("nrc", e)} style={input} /></div>
            <div><label style={label}>Curriculum Vitae (CV / Resume) *</label><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange("cv", e)} style={input} /></div>
            <div><label style={label}>Academic Qualifications / Certificates</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("qualifications", e)} style={input} /></div>
            <div><label style={label}>Tertiary Education Certificate</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange("tertiary", e)} style={input} /></div>
          </div>
        </div>

        {/* AI Coming Soon */}
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 14, padding: "20px 24px", marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ fontSize: 28, marginTop: 2 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <strong style={{ fontSize: "1.05rem", color: "#0c4a6e" }}>AI-Powered CV Screening</strong>
                <span style={{ background: "#bae6fd", color: "#0369a1", fontSize: "0.75rem", padding: "2px 10px", borderRadius: 9999, fontWeight: 600 }}>COMING SOON</span>
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

// Styles
const label = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" };
const input = { width: "100%", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "1rem", boxSizing: "border-box" };
const twoCol = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" };
const skillBtn = { padding: "8px 16px", fontSize: "0.9rem", border: "1px solid #e2e8f0", borderRadius: "9999px", background: "#f8fafc", cursor: "pointer" };
const submitBtn = { width: "100%", padding: "18px", marginTop: "40px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "600", cursor: "pointer" };
