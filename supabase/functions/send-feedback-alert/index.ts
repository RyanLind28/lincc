// Emails an admin address when a user submits a problem report / feedback.
// Invoked by the `notify_admins_of_feedback` DB trigger via pg_net after every
// INSERT on public.feedback.
//
// Auth: caller MUST pass the project's service_role bearer (the DB trigger reads
// it from vault). User-token calls are rejected so the function can't be abused
// to spam the admin inbox.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Lincc <noreply@system.lincc.live>";
const ADMIN_EMAIL = Deno.env.get("FEEDBACK_ALERT_TO") ?? "hello@lincc.live";
const APP_URL = Deno.env.get("APP_URL") ?? "https://app.lincc.live";

// Same trust pattern as send-welcome-email: the Supabase gateway already
// verified the JWT signature (verify_jwt=true). We then check the role claim
// so user tokens can't reach this function and trigger admin spam.
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Payload {
  feedback_id: string;
  type: string;
  subject: string | null;
  body: string | null;
  user_first_name: string | null;
  user_email: string | null;
  source: string | null;
  path: string | null;
  user_agent: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  bug: "🐛 Bug report",
  support: "🆘 Support request",
  feedback: "💬 Feedback",
  feature_request: "✨ Feature request",
};

function htmlTemplate(p: Payload): string {
  const typeLabel = TYPE_LABELS[p.type] ?? p.type;
  const adminUrl = `${APP_URL}/admin/feedback`;
  const meta: [string, string | null][] = [
    ["From", p.user_first_name && p.user_email ? `${p.user_first_name} (${p.user_email})` : p.user_email],
    ["Type", typeLabel],
    ["Source", p.source],
    ["Screen", p.path],
    ["Device", p.user_agent],
  ];
  const metaRows = meta
    .filter(([, v]) => v && String(v).trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#71717a;font-size:13px;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:#18181b;font-size:13px;word-break:break-word;">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>New ${esc(typeLabel)} on Lincc</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="width:100%;background:#f4f4f5;padding:32px 0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="height:4px;background:linear-gradient(90deg,#FF6B6B 0%,#845EF7 100%);"></div>
    <div style="padding:28px 32px 24px;">
      <p style="font-size:13px;color:#845EF7;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">${esc(typeLabel)}</p>
      <h1 style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 4px;line-height:1.3;">${esc(p.subject || "New problem report")}</h1>
      <p style="font-size:13px;color:#71717a;margin:0 0 20px;">A user just submitted a report on Lincc.</p>
      <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:16px 18px;margin:0 0 20px;">
        <p style="font-size:14px;color:#3f3f46;margin:0;line-height:1.55;white-space:pre-wrap;">${esc(p.body || "(no message)")}</p>
      </div>
      ${metaRows ? `<table style="border-collapse:collapse;margin:0 0 20px;">${metaRows}</table>` : ""}
      <a href="${esc(adminUrl)}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#FF6B6B 0%,#845EF7 100%);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Open in admin</a>
    </div>
    <div style="padding:16px 32px;text-align:center;border-top:1px solid #f4f4f5;">
      <p style="font-size:11px;color:#a1a1aa;margin:0;">Lincc · automated alert · feedback id ${esc(p.feedback_id)}</p>
    </div>
  </div>
</div>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email not configured (missing RESEND_API_KEY)" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (jwtRole(token) !== "service_role") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!payload?.feedback_id || !payload?.type) {
    return new Response(JSON.stringify({ error: "Missing feedback_id or type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const subjectPreview = (payload.subject || payload.body || "New problem report").slice(0, 80);
  const typeLabel = TYPE_LABELS[payload.type] ?? payload.type;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      reply_to: payload.user_email ?? undefined,
      subject: `[Lincc] ${typeLabel}: ${subjectPreview}`,
      html: htmlTemplate(payload),
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Resend error:", resp.status, text);
    return new Response(JSON.stringify({ error: "Email provider error", detail: text.slice(0, 200) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
