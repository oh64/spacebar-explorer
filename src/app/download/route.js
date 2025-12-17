import fs from 'fs';
import path from 'path';

function jsonWithStatus(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    // Support three modes:
    //  - ?url=<absolute-url> -> redirect to that URL
    //  - ?path=/path/to/file -> serve that file as attachment (path relative to project root when starting with '/')
    //  - ?client=<client>&version=<versionKey> -> read src/static/clients/<client>.json and pick the version (first by JSON order when version not provided)

    const clientKey = params.get('client');
    const versionKey = params.get('version');

    if (!clientKey) {
      return jsonWithStatus({ error: 'missing param: client' }, 400);
    }

    const clientFile = path.resolve(process.cwd(), 'src/static/clients', `${clientKey}.json`);
    if (!fs.existsSync(clientFile)) {
      return jsonWithStatus({ error: 'client not found' }, 404);
    }

    const raw = fs.readFileSync(clientFile, 'utf8');
    let clientObj = {};
    try {
      clientObj = JSON.parse(raw || '{}');
    } catch (e) {
      return jsonWithStatus({ error: 'invalid client json' }, 500);
    }

    const versions = clientObj.versions || {};
    const versionKeys = Object.keys(versions || {}).filter(k => k !== 'changelog_link');
    if (!versionKeys || versionKeys.length === 0) {
      return jsonWithStatus({ error: 'no versions configured for client' }, 404);
    }

    const targetVersion = versionKey || versionKeys[0];
    const v = versions[targetVersion];
    if (!v) {
      return jsonWithStatus({ error: 'version not found' }, 404);
    }

    const downloadUrl = v.download_url;
    if (!downloadUrl) {
      return jsonWithStatus({ error: 'no download_url for version' }, 404);
    }

    if (/^https?:\/\//i.test(downloadUrl)) {
      return new Response(null, { status: 302, headers: { Location: downloadUrl } });
    }

    const filename = path.basename(downloadUrl);
    const versionsDir = path.resolve(process.cwd(), 'src/static/clients', clientKey, 'versions');
    const filePath = path.join(versionsDir, filename);

    if (!filePath.startsWith(versionsDir)) {
      return jsonWithStatus({ error: 'invalid path' }, 400);
    }

    if (!fs.existsSync(filePath)) {
      return jsonWithStatus({ error: 'file not found' }, 404);
    }

    const data = fs.readFileSync(filePath);
    const name = path.basename(filePath) || 'download';
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
