import { all as dbAll } from '../../../../src/lib/sqlite.js';
import { corsHeaders, jsonWithCors } from '@/lib/cors';

const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 60;
const rateMap = new Map();

function clampLimit(raw, def = 50, max = 500) {
  const n = parseInt(raw || String(def), 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, 1), max);
}

function getIpFromRequest(req) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr;
  return req.headers.get('x-vercel-ip-city') || 'unknown';
}

export async function GET(req) {
  try {
    const ip = getIpFromRequest(req) || 'unknown';
    const now = Date.now();
    const entry = rateMap.get(ip) || { t: now, c: 0 };
    if (now - entry.t > RATE_WINDOW_MS) { entry.t = now; entry.c = 0; }
    entry.c += 1;
    rateMap.set(ip, entry);
  if (entry.c > RATE_LIMIT) return jsonWithCors({ error: 'rate limit' }, 429);

    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get('instanceId');
    const limit = clampLimit(searchParams.get('limit') || undefined, 50, 500);
    if (!instanceId) {
      return jsonWithCors({ error: 'instanceId required' }, 400);
    }
    if (!/^[\w-]{1,128}$/.test(instanceId)) {
      return jsonWithCors({ error: 'invalid instanceId' }, 400);
    }

    const rows = dbAll(
      `SELECT id, instance_id, start_at, end_at, duration_ms, created_at FROM instance_downtimes WHERE instance_id = ? ORDER BY start_at DESC LIMIT ?`,
      [instanceId, limit]
    );
    return new Response(JSON.stringify(rows || []), { status: 200, headers: corsHeaders({ 'Content-Type': 'application/json' }) });
  } catch (e) {
    console.error('GET /api/downtimes error', e);
    return jsonWithCors({ error: 'internal error' }, 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
