import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_FILE = process.env.SQLITE_FILE || path.resolve(process.cwd(), 'data.db');
try { const dir = path.dirname(DB_FILE); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch(e){}

const db = new Database(DB_FILE);

try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  // Just in case
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS instance_pings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id TEXT,
    url TEXT,
    status TEXT,
    response_time_ms INTEGER,
    body TEXT,
    created_at TEXT
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_pings_instance ON instance_pings(instance_id)`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS instance_downtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id TEXT,
    start_at TEXT,
    end_at TEXT,
    duration_ms INTEGER,
    created_at TEXT
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_downtimes_instance ON instance_downtimes(instance_id)`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS instance_ping_graphs (
    instance_id TEXT PRIMARY KEY,
    data TEXT,
    updated_at TEXT
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_ping_graphs_instance ON instance_ping_graphs(instance_id)`).run();

export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(Array.isArray(params) ? params : [params]);
}

export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(Array.isArray(params) ? params : [params]);
}

export default { run, all };
