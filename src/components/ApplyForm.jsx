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

  const qualifications = ["Grade 12 Certificate", "Certificate", "Diploma", "Advanced Diploma", "Bachelor's Degree", "Bachelor of Engineering", "Bachelor of Science", "Bachelor of Commerce", "Bachelor of Business Administration", "Master's Degree", "Other"];

  const institutions = ["University of Zambia (UNZA)", "Copperbelt University (CBU)", "Mulungushi University", "University of Lusaka (UNILUS)", "Zambia Open University (ZAOU)", "Kwame Nkrumah University", "Mukuba University", "Chalimbana University", "Levy Mwanawasa Medical University", "ZCAS University", "Cavendish University Zambia", "Eden University", "Lusaka Apex Medical University", "DMI-St. Eugene University", "Other (Please Specify)"];

  const fieldsOfStudy = ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Mining Engineering", "Chemical Engineering", "Computer Science", "Information Technology", "Business Administration", "Accounting", "Finance", "Marketing", "Human Resource Management", "Other"];

  const commonSkills = ["AutoCAD", "Microsoft Excel", "Project Management", "Python", "Data Analysis", "MATLAB", "SolidWorks", "SAP", "Power BI", "SQL", "Leadership", "Communication"];

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
      setForm(prev => ({ ...prev, skills: [...current, skill].join(", ") }));
    }
  };

  const submitApplication = async () => { /* your existing logic */ };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-8 text-center">
          <h2 className="text-3xl font-bold">Graduate Trainee Application</h2>
          <p className="mt-2 text-lg opacity-90">Step Up Program 2026</p>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="full_name" required value={form.full_name} onChange={handleChange}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input name="phone" required value={form.phone} onChange={handleChange}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Phone</label>
              <input name="alt_phone" value={form.alt_phone} onChange={handleChange}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input name="dob" type="date" value={form.dob} onChange={handleChange}
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input name="age" value={form.age} readOnly className="w-full px-5 py-3 border border-gray-300 rounded-2xl bg-gray-50" />
            </div>
          </div>

          {/* Qualification & Institution */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification *</label>
            <select name="qualification" required value={form.qualification} onChange={handleChange} className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500">
              <option value="">Select Qualification</option>
              {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution / University *</label>
            <select name="institution" required value={form.institution} onChange={handleChange} className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500">
              <option value="">Select Institution</option>
              {institutions.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* More fields... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
              <select name="field_of_study" value={form.field_of_study} onChange={handleChange} className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500">
                <option value="">Select Field of Study</option>
                {fieldsOfStudy.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
              <select name="graduation_year" value={form.graduation_year} onChange={handleChange} className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500">
                <option value="">Select Year</option>
                {Array.from({ length: 37 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button onClick={submitApplication} disabled={loading || !agreed} className="w-full mt-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-4 rounded-2xl text-lg hover:brightness-105 transition">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
