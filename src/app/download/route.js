import fs from 'fs';
import path from 'path';

function jsonWithStatus(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const key = params.get('client') || params.get('instance') || params.get('guild');
    if (!key) return jsonWithStatus({ error: 'missing param: client|instance|guild' }, 400);

    const mappingFile = path.resolve(process.cwd(), 'src/static/downloads.json');
    if (!fs.existsSync(mappingFile)) return jsonWithStatus({ error: 'downloads mapping not found' }, 404);
    const raw = fs.readFileSync(mappingFile, 'utf8');
    let map = {};
    try { map = JSON.parse(raw || '{}'); } catch (e) { return jsonWithStatus({ error: 'invalid downloads mapping' }, 500); }

    const entry = map[key];
    if (!entry) return jsonWithStatus({ error: 'not found' }, 404);

    if (/^https?:\/\//i.test(entry)) {
      return new Response(null, { status: 302, headers: { Location: entry } });
    }

    const resolved = path.resolve(process.cwd(), entry);
    if (!fs.existsSync(resolved)) return jsonWithStatus({ error: 'file not found' }, 404);

    const data = fs.readFileSync(resolved);
    const name = path.basename(resolved) || key;
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${name.replace(/\"/g, '')}"`
      }
    });
  } catch (e) {
    return jsonWithStatus({ error: 'internal error', detail: String(e && e.message ? e.message : e) }, 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
