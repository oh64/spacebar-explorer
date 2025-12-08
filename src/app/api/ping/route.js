import { NextResponse } from 'next/server';
import sqlite from '@/lib/sqlite';
import { computePingGraph } from '@/lib/graph';
import dns from 'dns/promises';
import { corsHeaders } from '@/lib/cors';

const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 60;
const rateMap = new Map();

function clampLimit(raw, def = 48, max = 500) {
  const n = parseInt(raw || String(def), 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, 1), max);
}

function isLikelyIp(host) {
  return /^\d+\.\d+\.\d+\.\d+$/.test(host) || /^\[?[0-9a-fA-F:]+\]?$/.test(host);
}

function ipIsPrivate(ip) {
  if (/^127\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (ip === '::1') return true;
  if (/^fc00:|^fe80:/.test(ip)) return true;
  return false;
}

async function isHostSafeForFetch(hostname) {
  if (!hostname) return false;
  const lower = hostname.toLowerCase();
  if (lower === 'localhost') return false;
  if (isLikelyIp(hostname)) {
    return !ipIsPrivate(hostname);
  }
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    for (const a of addrs) {
      if (ipIsPrivate(a.address)) return false;
    }
    return true;
  } catch (e) {
    console.error('dns lookup failed for', hostname, e && e.message ? e.message : e);
    return false;
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const instanceId = url.searchParams.get('instanceId');
    const limit = clampLimit(url.searchParams.get('limit'), 48, 500);
    const wantGraph = url.searchParams.get('graph');
  if (!instanceId) return NextResponse.json({ error: 'instanceId required' }, { status: 400, headers: corsHeaders() });
  if (!/^[\w-]{1,128}$/.test(instanceId)) return NextResponse.json({ error: 'invalid instanceId' }, { status: 400, headers: corsHeaders() });

    const rows = sqlite.all('SELECT * FROM instance_pings WHERE instance_id = ? ORDER BY created_at DESC LIMIT ?', [instanceId, limit]);
    if (wantGraph) {
      try {
        const grows = sqlite.all('SELECT data FROM instance_ping_graphs WHERE instance_id = ? LIMIT 1', [instanceId]);
        const graph = (grows && grows[0] && grows[0].data) ? JSON.parse(grows[0].data) : null;
        const finalGraph = graph || computePingGraph(rows, { width: 320, height: 60 });
  return NextResponse.json({ rows, graph: finalGraph }, { headers: corsHeaders() });
      } catch (e) {
        return NextResponse.json({ rows, graph: null });
      }
    }

    return NextResponse.json(rows, { headers: corsHeaders() });
  } catch (err) {
    console.error('GET /api/ping error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500, headers: corsHeaders() });
  }
}

async function readLimitedBody(res, maxBytes = 4096) {
  if (!res.body || !res.body.getReader) {
    try {
      const txt = await res.text();
      return txt.slice(0, maxBytes);
    } catch (e) {
      return '';
    }
  }
  const reader = res.body.getReader();
  let received = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
    received += chunk.length;
    if (received > maxBytes) {
      const allowed = maxBytes - (received - chunk.length);
      chunks.push(chunk.slice(0, allowed));
      break;
    } else {
      chunks.push(chunk);
    }
  }
  try {
    const buf = Buffer.concat(chunks);
    return buf.toString('utf8').slice(0, maxBytes);
  } catch (e) {
    return '';
  }
}

function getIpFromRequest(request) {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = request.headers.get('x-real-ip');
  if (xr) return xr;
  return request.headers.get('x-vercel-ip-city') || 'unknown';
}

export async function POST(request) {
  try {
    const ip = getIpFromRequest(request) || 'unknown';
    const now = Date.now();
    const entry = rateMap.get(ip) || { t: now, c: 0 };
    if (now - entry.t > RATE_WINDOW_MS) {
      entry.t = now; entry.c = 0;
    }
    entry.c += 1;
    rateMap.set(ip, entry);
  if (entry.c > RATE_LIMIT) return NextResponse.json({ error: 'rate limit' }, { status: 429, headers: corsHeaders() });

    const body = await request.json();
    const { instanceId, url } = body || {};
  if (!instanceId || !url) return NextResponse.json({ error: 'instanceId and url required' }, { status: 400, headers: corsHeaders() });
  if (!/^[\w-]{1,128}$/.test(instanceId)) return NextResponse.json({ error: 'invalid instanceId' }, { status: 400, headers: corsHeaders() });

    let parsed;
    try {
      parsed = new URL(String(url));
    } catch (e) {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 });
    }
  if (parsed.protocol !== 'https:') return NextResponse.json({ error: 'only https URLs are allowed' }, { status: 400, headers: corsHeaders() });

    const hostSafe = await isHostSafeForFetch(parsed.hostname);
  if (!hostSafe) return NextResponse.json({ error: 'disallowed hostname' }, { status: 400, headers: corsHeaders() });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const start = Date.now();
    let status = 'FAIL';
    let responseBody = '';
    let responseTime = null;
    try {
      const res = await fetch(parsed.href, { method: 'GET', signal: controller.signal });
      responseBody = await readLimitedBody(res, 4096); // keep small
      responseTime = Date.now() - start;
      if ((res.status >= 200 && res.status < 400) || String(responseBody).trim().toUpperCase().includes('OK')) status = 'OK';
    } catch (e) {
      responseTime = Date.now() - start;
      status = 'FAIL';
      responseBody = (e && e.message) ? String(e.message) : 'fetch error';
    } finally {
      clearTimeout(timeout);
    }

    try {
      sqlite.run('INSERT INTO instance_pings(instance_id, url, status, response_time_ms, body, created_at) VALUES (?, ?, ?, ?, ?, ?)', [instanceId, parsed.href, status, responseTime, String(responseBody).slice(0, 4096), new Date().toISOString()]);
    } catch (e) {
      console.error('db insert error', e && e.message ? e.message : e);
    }

    try {
      const rows = sqlite.all('SELECT * FROM instance_pings WHERE instance_id = ? ORDER BY created_at DESC LIMIT ?', [instanceId, 48]);
      const graph = computePingGraph(rows, { width: 320, height: 60 });
      sqlite.run('INSERT OR REPLACE INTO instance_ping_graphs(instance_id, data, updated_at) VALUES (?, ?, ?)', [instanceId, JSON.stringify(graph), new Date().toISOString()]);
    } catch (e) {
      console.error('graph compute/store error', e && e.message ? e.message : e);
    }

    return NextResponse.json({ instanceId, status, responseTime }, { headers: corsHeaders() });
  } catch (err) {
    console.error('POST /api/ping error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}