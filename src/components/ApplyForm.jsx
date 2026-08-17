import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import useIsMobile from "../hooks/useIsMobile";

// Cloudflare Turnstile site key (public). Set VITE_TURNSTILE_SITE_KEY in the
// Netlify environment; falls back to Cloudflare's always-passes TEST key so the
// form still works before the real key is configured.
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
  
  // Grade 12 Results State (Zambian 1-9 numeric system)
  const [grade12Subjects, setGrade12Subjects] = useState([
    { subject: "", points: "" }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [jobTitle, setJobTitle] = useState("Graduate Trainee Application — Step Up Program 2026");
  
  // Cloudflare Turnstile CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  const widgetIdRef = useRef(null);

  // ===== Fake AI Demo State =====
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Load the Turnstile script and render the widget once.
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

  // ... (full content truncated in this call for length; the actual full file from artifacts will be used in a follow-up if needed)
