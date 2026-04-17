// Sends a branded confirmation email when someone joins the waitlist.
// Uses Resend (https://resend.com) — set RESEND_API_KEY in Supabase Edge Function secrets.
// Deploy: supabase functions deploy send-waitlist-email --no-verify-jwt
// (no-verify-jwt because the landing page is anonymous)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Lincc <hello@lincc.live>";
const WAITLIST_FUNCTION_SECRET = Deno.env.get("WAITLIST_FUNCTION_SECRET"); // optional shared secret

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlTemplate(name: string): string {
  const displayName = (name || "there").trim().split(" ")[0] || "there";
  // Template mirrors supabase/email-templates/waitlist-confirmation.html.
  // Kept inline so the function is self-contained and deployable without extra assets.
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>You're on the Lincc waitlist!</title>
<style>
body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.wrapper{width:100%;background:#f4f4f5;padding:40px 0}
.card{max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.gradient-bar{height:4px;background:linear-gradient(90deg,#FF6B6B 0%,#845EF7 100%)}
.logo-section{padding:32px 40px 0;text-align:center}
.logo-section img{height:32px;width:auto}
.body-content{padding:32px 40px 40px;text-align:center}
.body-content h1{font-size:24px;font-weight:700;color:#18181b;margin:0 0 8px;line-height:1.3}
.tagline{font-size:14px;color:#71717a;margin:0 0 24px}
.body-content p{font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 16px}
.highlight-box{background:linear-gradient(135deg,rgba(255,107,107,.06) 0%,rgba(132,94,247,.06) 100%);border-radius:12px;padding:20px;margin:24px 0;text-align:left}
.highlight-box h2{font-size:14px;font-weight:600;color:#845EF7;margin:0 0 12px;text-transform:uppercase;letter-spacing:.5px}
.highlight-box ul{margin:0;padding:0 0 0 18px;color:#3f3f46}
.highlight-box li{font-size:14px;line-height:1.7;margin:0 0 4px}
.subtle-text{font-size:13px;color:#a1a1aa;margin:16px 0 0;line-height:1.5}
.footer{padding:24px 40px;text-align:center;border-top:1px solid #f4f4f5}
.footer p{font-size:12px;color:#a1a1aa;margin:0 0 4px;line-height:1.5}
.footer a{color:#a1a1aa;text-decoration:underline}
</style></head>
<body><div class="wrapper"><div class="card"><div class="gradient-bar"></div>
<div class="logo-section"><div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:-1px;line-height:1"><span style="color:#FF6B6B">Lin</span><span style="color:#845EF7">cc</span></div></div>
<div class="body-content">
<h1>You're on the list, ${escapeHtml(displayName)}!</h1>
<p class="tagline">Everything happening around you</p>
<p>Thanks for joining the Lincc waitlist. We'll email you the moment we open the doors in your area — you won't have to wait long.</p>
<div class="highlight-box"><h2>What happens next</h2><ul>
<li>We'll send you an invite when Lincc launches near you.</li>
<li>You'll be one of the first to post, discover, and join local events.</li>
<li>Got a business? Reply to this email — we'd love to chat.</li>
</ul></div>
<p class="subtle-text">You can reach us any time at <a href="mailto:hello@lincc.live" style="color:#845EF7">hello@lincc.live</a>.</p>
</div>
<div class="footer"><p>&copy; Lincc. All rights reserved.</p>
<p>You received this email because you joined the waitlist at <a href="https://lincc-six.vercel.app">lincc-six.vercel.app</a>.</p>
</div></div></div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  // Optional shared-secret check. If WAITLIST_FUNCTION_SECRET is set, callers
  // must send it in X-Waitlist-Secret. Leave unset to allow anonymous calls
  // from the landing page.
  if (WAITLIST_FUNCTION_SECRET) {
    const provided = req.headers.get("x-waitlist-secret");
    if (provided !== WAITLIST_FUNCTION_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: email,
        subject: "You're on the Lincc waitlist!",
        html: htmlTemplate(name ?? ""),
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      console.error("Resend API error:", resendResp.status, errBody);
      return new Response(
        JSON.stringify({ error: "Email provider error", status: resendResp.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-waitlist-email failed:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
