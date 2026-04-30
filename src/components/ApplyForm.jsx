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
  });

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const qualifications = [
    "Grade 12 Certificate", "Certificate", "Diploma", "Advanced Diploma",
    "Bachelor's Degree", "Bachelor of Engineering", "Bachelor of Science",
    "Bachelor of Commerce", "Bachelor of Business Administration",
    "Bachelor of Laws (LLB)", "Bachelor of Medicine & Surgery",
    "Master's Degree", "Doctorate (PhD)", "Other"
  ];

  const institutions = [
    "University of Zambia (UNZA)", "Copperbelt University (CBU)", "Mulungushi University",
    "University of Lusaka (UNILUS)", "Zambia Open University (ZAOU)", "Kwame Nkrumah University",
    "Mukuba University", "Chalimbana University", "Levy Mwanawasa Medical University",
    "ZCAS University", "Cavendish University Zambia", "Eden University",
    "Lusaka Apex Medical University", "Northrise University", "Copperstone University",
    "Rusangu University", "Chreso University", "Zambia Catholic University",
    "Africa Christian University", "Gideon Robert University", "DMI-St. Eugene University",
    "DMI-St. John the Baptist University", "St. Bonaventure University",
    "The University of Barotseland", "Zambia Adventist University",
    "Livingstone International University", "Evelyn Hone College",
    "Northern Technical College (NORTEC)", "Southern Technical College",
    "David Livingstone College of Education", "Kitwe College of Education",
    "Luanshya Technical and Business College", "Mansa College of Education",
    "Other (Please Specify)"
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

  const uploadCV = async (file) => {
    if (!file) return null;
    const fileName = `cvs/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("cvs").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const submitApplication = async () => { /* same as before */ };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">
          Graduate Trainee Application — Step Up Program 2026
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
            <input name="full_name" required value={form.full_name} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
            <input name="phone" required value={form.phone} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Alternative Phone</label>
            <input name="alt_phone" value={form.alt_phone} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
            <input name="dob" type="date" value={form.dob} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
            <input name="age" value={form.age} readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-gray-50" />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Highest Qualification *</label>
          <select name="qualification" required value={form.qualification} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
            <option value="">Select Qualification</option>
            {qualifications.map((q, i) => <option key={i} value={q}>{q}</option>)}
          </select>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Institution / University *</label>
          <select name="institution" required value={form.institution} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
            <option value="">Select Institution</option>
            {institutions.map((inst, i) => <option key={i} value={inst}>{inst}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Field of Study</label>
            <select name="field_of_study" value={form.field_of_study} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
              <option value="">Select Field of Study</option>
              {fieldsOfStudy.map((f, i) => <option key={i} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Graduation Year</label>
            <select name="graduation_year" value={form.graduation_year} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
              <option value="">Select Year</option>
              {Array.from({ length: 37 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Key Skills</label>
          <input name="skills" value={form.skills} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" 
            placeholder="AutoCAD, Excel, Python..." />
          <div className="flex flex-wrap gap-2 mt-3">
            {commonSkills.map(skill => (
              <button key={skill} type="button" onClick={() => addSkill(skill)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                + {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload CV (PDF or Word) *</label>
          <input id="cvFile" type="file" accept=".pdf,.doc,.docx" 
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:bg-orange-500 file:text-white" />
        </div>

        <div className="mt-8 flex items-start gap-3">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
          <span className="text-sm text-gray-600">
            I confirm that the information provided is accurate and I agree to the Terms & Conditions.
          </span>
        </div>

        <button 
          onClick={submitApplication} 
          disabled={loading || !agreed}
          className="w-full mt-10 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
        >
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
