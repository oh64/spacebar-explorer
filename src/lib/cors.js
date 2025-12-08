export function corsHeaders(extra = {}) {
  return Object.assign({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }, extra || {});
}

export function jsonWithCors(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(Object.assign({ 'Content-Type': 'application/json' }, extraHeaders)) });
}
