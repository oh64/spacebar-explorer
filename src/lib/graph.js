export function computePingGraph(rows = [], opts = {}) {
  const width = opts.width || 320;
  const height = opts.height || 60;
  if (!Array.isArray(rows) || rows.length === 0) return { width, height, polyline: '', points: [] };

  const asc = [...rows].reverse();
  const history = asc.length > 1 ? asc.slice(1) : [];
  if (history.length === 0) return { width, height, polyline: '', points: [] };

  const values = history.map((p) => (p.response_time_ms == null ? 0 : Number(p.response_time_ms)));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const step = width / Math.max(1, values.length - 1);

  const points = history.map((p, i) => {
    const v = values[i];
    const x = Math.round(i * step);
    const y = Math.round(height - (((v - min) / (max - min || 1)) * height));
    const code = Number(p.status);
    const isDown = Number.isNaN(code) ? true : !(code >= 200 && code < 400);
    const color = isDown ? '#ef4444' : '#f59e0b';
    return {
      x,
      y,
      color,
      status: p.status,
      created_at: p.created_at,
      response_time_ms: p.response_time_ms
    };
  });

  const polyline = points.map(pt => `${pt.x},${pt.y}`).join(' ');

  return {
    width,
    height,
    polyline,
    points,
    min,
    max,
    sampleCount: points.length,
    generated_at: new Date().toISOString()
  };
}
