#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { run as dbRun, all as dbAll } from '../src/lib/sqlite.js';
import { computePingGraph } from '../src/lib/graph.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTANCES_DIR = path.resolve(__dirname, '../src/static/instances');
const TIMEOUT_MS = parseInt(process.env.PING_TIMEOUT_MS || '10000', 10);

function listInstanceFiles() {
  if (!fs.existsSync(INSTANCES_DIR)) return [];
  return fs.readdirSync(INSTANCES_DIR).filter(f => f.endsWith('.json') && !/example/i.test(f));
}

async function pingUrl(url) {
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', signal });
    const time = Date.now() - start;
    let body = '';
    try { body = await res.text(); } catch (e) { body = ''; }
    clearTimeout(timeout);
    return { status: res.status, time, body };
  } catch (err) {
    clearTimeout(timeout);
    const time = Date.now() - start;
    return { status: 'error', time, body: String(err && err.message ? err.message : err) };
  }
}

async function main() {
  const files = listInstanceFiles();
  if (files.length === 0) {
    console.log('no instances to ping');
    return;
  }

  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    dbRun(`DELETE FROM instance_downtimes WHERE start_at < ?`, [cutoff]);
  } catch (e) {
    console.error('cleanup error', e && e.message ? e.message : String(e));
  }

  let count = 0;
  let success = 0;
  let fail = 0;

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(INSTANCES_DIR, file), 'utf8');
      const obj = JSON.parse(raw);
      const id = obj.id || path.basename(file, '.json');
      const url = obj.ping || obj.link;
      if (!url) continue;

      const result = await pingUrl(url);
      const statusStr = String(result.status);
      const bodyShort = (result.body || '').slice(0, 3000);
      const createdAt = new Date().toISOString();

      dbRun(
        `INSERT INTO instance_pings (instance_id, url, status, response_time_ms, body, created_at) VALUES (?,?,?,?,?,?)`,
        [id, url, statusStr, result.time, bodyShort, createdAt]
      );

      try {
        const rows = dbAll(`SELECT * FROM instance_pings WHERE instance_id = ? ORDER BY created_at DESC LIMIT ?`, [id, 48]);
        const graph = computePingGraph(rows, { width: 320, height: 60 });
        dbRun(`INSERT OR REPLACE INTO instance_ping_graphs(instance_id, data, updated_at) VALUES (?,?,?)`, [id, JSON.stringify(graph), new Date().toISOString()]);
      } catch (e) {
        // non-fatal
      }

      count++;
      const code = Number(result.status);
      const isSuccess = !Number.isNaN(code) ? code >= 200 && code < 400 : false;
      if (isSuccess) success++; else fail++;

      if (isSuccess) {
        try {
          const cd = dbAll(`SELECT COUNT(*) as c FROM instance_downtimes WHERE instance_id = ?`, [id]);
          const downtimeCount = (cd && cd[0] && cd[0].c) ? cd[0].c : 0;

          const lastSuccess = dbAll(
            `SELECT created_at FROM instance_pings WHERE instance_id = ? AND CAST(status AS INTEGER) BETWEEN 200 AND 399 ORDER BY created_at DESC LIMIT 1`,
            [id]
          );
          const lastSuccessAt = (lastSuccess && lastSuccess[0]) ? lastSuccess[0].created_at : null;

          const firstFailureAfter = dbAll(
            `SELECT created_at FROM instance_pings WHERE instance_id = ? AND (CAST(status AS INTEGER) < 200 OR CAST(status AS INTEGER) >= 400 OR status = ?) ${lastSuccessAt ? 'AND created_at > ?' : ''} ORDER BY created_at ASC LIMIT 1`,
            lastSuccessAt ? [id, 'error', lastSuccessAt] : [id, 'error']
          );

          if (firstFailureAfter && firstFailureAfter[0]) {
            const startAt = firstFailureAfter[0].created_at;
            const endAt = createdAt;
            const durationMs = Date.parse(endAt) - Date.parse(startAt);

            if (downtimeCount > 0) {
              const exists = dbAll(`SELECT id FROM instance_downtimes WHERE instance_id = ? AND start_at = ? LIMIT 1`, [id, startAt]);
              if (!exists || exists.length === 0) {
                dbRun(`INSERT INTO instance_downtimes (instance_id, start_at, end_at, duration_ms, created_at) VALUES (?,?,?,?,?)`, [id, startAt, endAt, durationMs, new Date().toISOString()]);
              }
            }
          }
        } catch (e) {
          // non-fatal
        }
      }
    } catch (e) {
      // per-instance non-fatal
    }
  }

  console.log(`done pings=${count} success=${success} fail=${fail}`);
}

main().catch(err => {
  console.error('fatal', err && err.message ? err.message : String(err));
  process.exit(1);
});
