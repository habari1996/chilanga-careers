/**
 * Netlify Function: submit-application
 *
 * Server-side protected application submission:
 * 1. Verifies Cloudflare Turnstile token with Cloudflare's siteverify API
 * 2. Calls the security-definer submit_application RPC
 * 3. Inserts grade12_results if provided
 *
 * File uploads remain client-side (anon upload policy on the cvs bucket).
 * The client sends only the resulting storage paths.
 *
 * Required Netlify environment variables:
 *   TURNSTILE_SECRET_KEY   – Cloudflare Turnstile secret key
 *   SUPABASE_URL           – e.g. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY      – public anon key (RPC is granted to anon)
 *   (optional) SUPABASE_SERVICE_ROLE_KEY – only if you later move uploads server-side
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

exports.handler = async (event) => {
  // CORS + method guard
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

    // ── 1. Verify Turnstile with Cloudflare ──────────────────────────
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error("TURNSTILE_SECRET_KEY is not set");
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error (CAPTCHA)" }) };
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
      console.warn("Turnstile verification failed:", verifyData["error-codes"]);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "CAPTCHA verification failed. Please try again." }),
      };
    }

    // ── 2. Call submit_application RPC ───────────────────────────────
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase env vars missing");
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error (DB)" }) };
    }

    // Strip any client-supplied status / captcha / id fields
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

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/submit_application`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ p: safePayload }),
    });

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      console.error("submit_application RPC failed:", rpcRes.status, errText);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Application submission failed", detail: errText }),
      };
    }

    const newId = await rpcRes.json(); // bigint returned directly

    // ── 3. Insert grade12 results if any ─────────────────────────────
    if (Array.isArray(grade12) && grade12.length > 0 && newId) {
      const rows = grade12
        .filter((r) => r.subject && r.points)
        .map((r) => ({
          application_id: newId,
          subject: String(r.subject).trim(),
          points: parseInt(r.points, 10),
        }));

      if (rows.length) {
        const gRes = await fetch(`${supabaseUrl}/rest/v1/grade12_results`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(rows),
        });
        if (!gRes.ok) {
          console.warn("grade12 insert warning:", await gRes.text());
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: newId }),
    };
  } catch (err) {
    console.error("submit-application error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
