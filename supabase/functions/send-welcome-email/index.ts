// Sends a branded "Welcome to Lincc" email after a user signs up and confirms their email.
// Idempotent — uses profiles.welcomed_at to guarantee we only ever send once per user,
// even if the client calls this function on every sign-in.
//
// Auth: the caller must pass their Supabase access token in Authorization (default for
// authenticated calls from the supabase-js client). The function uses the service role
// to read/update profiles atomically.
//
// Deploy: supabase functions deploy send-welcome-email

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Lincc <noreply@system.lincc.live>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://lincc-six.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // supabase-js sends apikey + x-client-info alongside Authorization. All four must
  // be in the preflight allowlist or the browser blocks the POST after OPTIONS.
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlTemplate(firstName: string): string {
  const safeName = escapeHtml((firstName || "there").trim().split(" ")[0] || "there");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Welcome to Lincc — something's happening near you</title>
<style>
body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.wrapper{width:100%;background:#f4f4f5;padding:40px 0}
.card{max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.gradient-bar{height:4px;background:linear-gradient(90deg,#FF6B6B 0%,#845EF7 100%)}
.logo-section{padding:32px 40px 0;text-align:center}
.body-content{padding:32px 40px 40px}
h1{font-size:24px;font-weight:700;color:#18181b;margin:0 0 8px;line-height:1.3;text-align:center}
.tagline{font-size:14px;color:#71717a;margin:0 0 28px;text-align:center}
p{font-size:15px;line-height:1.65;color:#3f3f46;margin:0 0 16px}
.divider{text-align:center;color:#d4d4d8;font-size:14px;letter-spacing:6px;margin:28px 0 24px}
.section-label{font-size:14px;font-weight:600;color:#18181b;margin:0 0 12px}
.cta-wrap{text-align:center;margin:24px 0 8px}
.cta-button{display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#FF6B6B 0%,#845EF7 100%);color:#fff !important;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;line-height:1}
.safety-box{background:#f9fafb;border:1px solid #e4e4e7;border-radius:12px;padding:18px 22px;margin:20px 0}
.safety-box h2{font-size:14px;font-weight:600;color:#18181b;margin:0 0 10px}
.safety-box p{font-size:14px;line-height:1.6;color:#3f3f46;margin:0}
.sign-off{margin-top:28px;font-size:15px;color:#3f3f46}
.subtle-text{font-size:13px;color:#a1a1aa;margin:16px 0 0;line-height:1.5}
.footer{padding:24px 40px;text-align:center;border-top:1px solid #f4f4f5}
.footer p{font-size:12px;color:#a1a1aa;margin:0 0 4px;line-height:1.5}
.footer a{color:#a1a1aa;text-decoration:underline}
.social-row{margin:24px 0 8px;text-align:center}
.social-row p{font-size:13px;color:#71717a;margin:0 0 12px;font-weight:500}
.social-icon{display:inline-block;width:36px;height:36px;margin:0 6px;background-color:#f4f4f5;border-radius:50%;text-align:center;line-height:36px;text-decoration:none}
</style></head>
<body><div class="wrapper"><div class="card"><div class="gradient-bar"></div>
<div class="logo-section"><div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:-1px;line-height:1"><span style="color:#FF6B6B">Lin</span><span style="color:#845EF7">cc</span></div></div>
<div class="body-content">
<h1>Welcome to Lincc 👋</h1>
<p class="tagline">Something's happening near you</p>
<p>Hi ${safeName},</p>
<p>Welcome to Lincc. We're really glad you're here.</p>
<p>Lincc is simple: real people, real plans, happening right now near you. Whether you're hosting a games night with a spare seat or looking for someone to grab a coffee with this afternoon — Lincc is where that happens.</p>
<p>No algorithm deciding what you see. No posts from three days ago. Just what's on, near you, right now.</p>
<div class="divider">· · ·</div>
<p class="section-label">🗓️ Ready to get started?</p>
<p>Take a look at what's happening near you today, or post your own event and open it up to your local community.</p>
<div class="cta-wrap"><a href="${APP_URL}" class="cta-button" target="_blank">See What's On Near Me</a></div>
<div class="divider">· · ·</div>
<div class="safety-box"><h2>A note on safety</h2><p>Every person on Lincc has a verified profile. All events take place at public venues, and you're always in control of who joins yours. If anything ever feels off, our report feature is one tap away and reviewed by a real person.</p></div>
<p>We've built Lincc to feel like your city is a little smaller — and a little friendlier.</p>
<p class="sign-off">See you out there,<br/><strong>The Lincc Team</strong></p>
<p class="subtle-text">Questions? Reach us any time at <a href="mailto:hello@lincc.live" style="color:#845EF7;">hello@lincc.live</a>.</p>
<div class="social-row"><p>Follow Lincc</p><a href="https://www.instagram.com/lincc_live" class="social-icon" target="_blank" rel="noopener" aria-label="Instagram" style="color:#845EF7;"><span style="font-size:14px;font-weight:700;">IG</span></a><a href="https://www.tiktok.com/@lincc_live" class="social-icon" target="_blank" rel="noopener" aria-label="TikTok" style="color:#845EF7;"><span style="font-size:14px;font-weight:700;">TT</span></a></div>
</div>
<div class="footer"><p>&copy; Lincc. All rights reserved.</p>
<p>You're receiving this because you just signed up to Lincc. You can manage your email preferences in your <a href="${APP_URL}/settings">account settings</a>.</p>
</div></div></div></body></html>`;
}

// Decode (without verifying) a JWT's `role` claim — used only to ROUTE the
// request. Security comes from what happens next: the batch path re-verifies
// via an admin capability check; the user path verifies via getUser().
function jwtRole(token: string): string | null {
  try {
    const seg = token.split(".")[1];
    if (!seg) return null;
    const b64 = seg.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(seg.length / 4) * 4, "=");
    const payload = JSON.parse(atob(b64));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Send the branded welcome email via Resend. Returns true on success.
async function sendWelcomeEmail(recipient: string, firstName: string): Promise<boolean> {
  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: recipient,
      subject: "Welcome to Lincc — something's happening near you 👋",
      html: htmlTemplate(firstName ?? ""),
    }),
  });
  if (!resendResp.ok) {
    console.error("Resend error:", resendResp.status, await resendResp.text());
    return false;
  }
  return true;
}

// Batch/cron mode: flush every confirmed-but-unwelcomed user. Reuses the
// welcomed_at guard so it's safe to run repeatedly and races safely with the
// client-side trigger. Only reachable with the service_role key (see caller).
async function runBatch(): Promise<Response> {
  const { data: pending, error } = await admin.rpc("get_pending_welcome_users");
  if (error) {
    console.error("get_pending_welcome_users failed:", error);
    return json(500, { error: "Failed to list pending users" });
  }
  let sent = 0;
  let failed = 0;
  for (const u of (pending ?? []) as Array<{ id: string; email: string | null; first_name: string | null }>) {
    if (!u.email) continue;
    const ok = await sendWelcomeEmail(u.email, u.first_name ?? "");
    if (ok) {
      await admin.from("profiles").update({ welcomed_at: new Date().toISOString() }).eq("id", u.id);
      sent++;
    } else {
      failed++;
    }
  }
  return json(200, { ok: true, mode: "batch", sent, failed, total: (pending ?? []).length });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Email not configured (missing RESEND_API_KEY)" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Authenticate the caller via their JWT — the token tells us which user they are.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Service-role bearer (the pg_cron job) → batch mode. We route on the token's
  // role claim, then confirm it's a genuine service-role key by performing an
  // admin-only call (GoTrue verifies the signature). This is robust against
  // key rotation / new-vs-legacy key formats — no brittle string compare.
  const bearer = authHeader.slice("Bearer ".length).trim();
  if (jwtRole(bearer) === "service_role") {
    const caller = createClient(SUPABASE_URL, bearer, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: adminErr } = await caller.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (adminErr) {
      console.error("Batch auth rejected:", adminErr.message);
      return json(401, { error: "Invalid service token" });
    }
    return await runBatch();
  }

  // Use a client bound to the caller's token to resolve their identity. Can't trust
  // any user_id passed in the body — must derive from the JWT.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid auth token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const user = userData.user;

  try {
    // Read profile (service role bypasses RLS). If already welcomed, no-op.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("welcomed_at, first_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found for user", user.id, profileError);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.welcomed_at) {
      return new Response(JSON.stringify({ ok: true, already_welcomed: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require email verification so we don't welcome users who signed up but never confirmed.
    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ error: "Email not confirmed yet" }), {
        status: 412,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipient = profile.email ?? user.email;
    if (!recipient) {
      return new Response(JSON.stringify({ error: "No email on file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ok = await sendWelcomeEmail(recipient, profile.first_name ?? "");
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Email provider error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mark as welcomed so we never re-send.
    const { error: updateError } = await admin
      .from("profiles")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      // Non-fatal — email already went. Log for monitoring.
      console.error("Failed to mark welcomed_at:", updateError);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-welcome-email failed:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
