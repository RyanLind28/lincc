// Lightweight health probe for the in-app status page (src/services/statusService.ts).
// Returns edge-function reachability/latency plus a Resend dependency probe.
// Exposes no secrets or user data, so it is deployed with verify_jwt: false —
// otherwise the gateway's pre-function 401 (on a missing/expired caller JWT)
// arrives without CORS headers and the browser reports it as a generic
// "Failed to send a request to the Edge Function" network error.
//
// Deploy: supabase functions deploy health-check --no-verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PROBE_TIMEOUT_MS = 4000;

async function probeResend(): Promise<{ ok: boolean; latencyMs: number; status?: number; error?: string }> {
  const start = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.resend.com/', { method: 'GET', signal: ctrl.signal });
    return {
      ok: res.ok,
      latencyMs: Math.round(performance.now() - start),
      status: res.status,
    };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const resend = await probeResend();

  return new Response(
    JSON.stringify({
      ok: true,
      service: 'edge-functions',
      timestamp: new Date().toISOString(),
      region: Deno.env.get('SB_REGION') ?? null,
      dependencies: {
        resend,
      },
    }),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
});
