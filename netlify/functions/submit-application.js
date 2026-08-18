/**
 * Netlify Function: submit-application
 *
 * 1. Verifies Cloudflare Turnstile server-side
 * 2. Calls submit_application_full (service role) — application + grade12 in one TX
 *
 * Required env:
 *   TURNSTILE_SECRET_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (preferred)
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { captchaToken, application, grade12 } = body;

    if (!captchaToken) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing CAPTCHA token" }) };
    }
    if (!application || !application.full_name || !application.email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required application fields" }) };
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error("TURNSTILE_SECRET_KEY is not set");
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error" }) };
    }

    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: captchaToken,
        remoteip: event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "",
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      console.warn("Turnstile failed:", verifyData["error-codes"]);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "CAPTCHA verification failed. Please try again." }),
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Supabase env vars missing");
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error" }) };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key (less secure)");
    }

    const safePayload = {
      full_name: String(application.full_name || "").trim(),
      email: String(application.email || "").trim().toLowerCase(),
      phone: String(application.phone || "").trim(),
      alt_phone: application.alt_phone ? String(application.alt_phone).trim() : null,
      dob: application.dob || null,
      age: application.age ? parseInt(application.age, 10) : null,
      gender: application.gender || null,
      nationality: application.nationality || "Zambian",
      qualification: application.qualification || null,
      institution: application.institution || null,
      field_of_study: application.field_of_study || null,
      graduation_year: application.graduation_year || null,
      skills: application.skills || null,
      experience: application.experience || null,
      cv_url: application.cv_url || null,
      nrc_url: application.nrc_url || null,
      qualifications_url: application.qualifications_url || null,
      tertiary_certificate_url: application.tertiary_certificate_url || null,
      job_id: application.job_id || null,
    };

    const grade12Arr = Array.isArray(grade12)
      ? grade12
          .filter((g) => g && (g.subject || g.grade))
          .map((g) => ({
            subject: String(g.subject || "").trim(),
            grade: String(g.grade || "").trim(),
            points: parseInt(g.points, 10) || 0,
          }))
      : [];

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_application_full`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ p: safePayload, p_grade12: grade12Arr }),
    });

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      console.error("submit_application_full failed:", rpcRes.status, errText);
      if (rpcRes.status === 404 || (errText && errText.includes("submit_application_full"))) {
        const legacy = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_application`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ p: safePayload }),
        });
        if (!legacy.ok) {
          console.error("legacy submit_application failed:", await legacy.text());
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Could not save application. Please try again later." }),
          };
        }
        const legacyId = await legacy.json();
        if (grade12Arr.length && legacyId) {
          const appId = typeof legacyId === "string" ? legacyId : legacyId;
          for (const g of grade12Arr) {
            await fetch(`${supabaseUrl}/rest/v1/grade12_results`, {
              method: "POST",
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                application_id: appId,
                subject: g.subject,
                grade: g.grade,
                points: g.points,
              }),
            });
          }
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ id: legacyId, ok: true }),
        };
      }
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Could not save application. Please try again later." }),
      };
    }

    const newId = await rpcRes.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ id: newId, ok: true }),
    };
  } catch (err) {
    console.error("submit-application error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Unexpected error. Please try again later." }),
    };
  }
};
