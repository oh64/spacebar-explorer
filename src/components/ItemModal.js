"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ImageGallery from './ImageGallery';

export default function ItemModal({ 
  item, 
  type = 'client',
  onClose, 
  selectedInstance,
  copiedText,
  copyToClipboard,
  imageGalleryProps
}) {
  if (!item) return null;

  
  const [pingHistory, setPingHistory] = useState([]);
  const [downtimeHistory, setDowntimeHistory] = useState([]);
  const [pingGraph, setPingGraph] = useState(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [showMaintainerImage, setShowMaintainerImage] = useState(true);

  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(320);

  
  const mostRecent = pingHistory && pingHistory.length ? pingHistory[pingHistory.length - 1] : null;
  const mostRecentCode = mostRecent ? Number(mostRecent.status) : NaN;
  const isDown = mostRecent
    ? (Number.isNaN(mostRecentCode) ? String(mostRecent.status).toUpperCase() !== 'OK' : !(mostRecentCode >= 200 && mostRecentCode < 400))
    : false;
  const lastSuccessfulPing = [...(pingHistory || [])].reverse().find(p => {
    const code = Number(p.status);
    if (!Number.isNaN(code)) return code >= 200 && code < 400;
    return String(p.status).toUpperCase() === 'OK';
  }) || null;
  const lastSuccessfulMs = lastSuccessfulPing ? (lastSuccessfulPing.response_time_ms ?? lastSuccessfulPing.responseTime ?? null) : null;

  useEffect(() => {
    if (type === 'instance' && item.id) {
      fetch(`/api/ping?instanceId=${encodeURIComponent(item.id)}&limit=48&graph=1`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPingHistory(data.reverse());
          } else if (data && Array.isArray(data.rows)) {
            setPingHistory(data.rows.reverse());
            if (data.graph) setPingGraph(data.graph);
          }
        })
        .catch(() => {});
      
      fetch(`/api/downtimes?instanceId=${encodeURIComponent(item.id)}&limit=50`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setDowntimeHistory(data); })
        .catch(() => {});
    }
  }, [type, item.id]);

  useEffect(() => {
    setShowMaintainerImage(true);
  }, [item.maintainer_image]);

  useEffect(() => {
    const node = chartRef && chartRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width || 0);
        if (w && w !== chartWidth) {
          const clamped = Math.min(Math.max(w, 160), 1200);
          setChartWidth(clamped);
        }
      }
    });
    ro.observe(node);
    const initW = node.clientWidth || node.getBoundingClientRect().width || 320;
    setChartWidth(Math.min(Math.max(Math.round(initW), 160), 1200));
    return () => ro.disconnect();
  }, [chartRef, item.id]);

  const tags = Array.isArray(item.tags) ? item.tags : [];
  const hasClosedSource = tags.includes('closed-source');
  const _rawOverwrite = item['overwrite-warn'] ?? item.overwrite_warn ?? item.overwriteWarn ?? item['overwirte-warn'] ?? item.overwirteWarn;
  const parseBool = (v) => {
    if (v === true || v === 'true' || v === '1') return true;
    if (v === false || v === 'false' || v === '0') return false;
    return null;
  };
  const overwriteWarn = parseBool(_rawOverwrite);
  let showBlurWarning = false;
  let showTrustedMessage = false;
  if (overwriteWarn === true) {
    showBlurWarning = true;
  } else if (overwriteWarn === false) {
    if (hasClosedSource) showTrustedMessage = true;
    showBlurWarning = false;
  } else {
    if (hasClosedSource) showBlurWarning = true;
  }
  const effectiveShowBlur = showBlurWarning && !dismissedWarning;

  function renderPingChart() {
    if (pingGraph && pingGraph.polyline) {
      const baseWidth = pingGraph.width || 320;
      const baseHeight = pingGraph.height || 60;
  const width = chartWidth || baseWidth || 320;
  const height = Math.max(60, Math.round(width * 0.25));
      const scaleX = width / baseWidth;
      const scaleY = height / baseHeight;
      const last = (pingHistory && pingHistory.length) ? pingHistory[pingHistory.length - 1] : null;

      const rawPoints = (pingGraph.points || []).map((p) => ({
        x: (p.x || 0) * scaleX,
        y: (p.y || 0) * scaleY,
        status: p.status,
        color: p.color,
        response_time_ms: p.response_time_ms
      }));
      const n = Math.min(48, rawPoints.length);
      const pointsToUse = n > 0 ? rawPoints.slice(-n) : [];
      let scaledPolyline = '';
      const scaledPoints = [];
      const topGap = Math.round(Math.max(4, height * 0.06));
      const bottomGap = Math.round(Math.max(4, height * 0.04));
      if (pointsToUse.length === 0) {
        scaledPolyline = '';
      } else if (pointsToUse.length === 1) {
        const x = width;
        const raw = pointsToUse[0].response_time_ms != null ? Number(pointsToUse[0].response_time_ms) : 0;
        const minV = pingGraph.min ?? 0;
        const maxV = pingGraph.max ?? Math.max(raw, 1);
        const norm = (raw - minV) / (maxV - minV || 1);
        const y = Math.round(topGap + (1 - norm) * (height - topGap - bottomGap));
        scaledPolyline = `${x},${y}`;
        scaledPoints.push({ x, y, status: pointsToUse[0].status, color: pointsToUse[0].color });
      } else {
        const stepX = width / (pointsToUse.length - 1);
        scaledPolyline = pointsToUse.map((p, i) => {
          const x = Math.round(i * stepX);
          const raw = p.response_time_ms != null ? Number(p.response_time_ms) : 0;
          const minV = pingGraph.min ?? 0;
          const maxV = pingGraph.max ?? Math.max(...(pointsToUse.map(pp => Number(pp.response_time_ms || 0))), 1);
          const norm = (raw - minV) / (maxV - minV || 1);
          const y = Math.round(topGap + (1 - norm) * (height - topGap - bottomGap));
          scaledPoints.push({ x, y, status: p.status, color: p.color });
          return `${x},${y}`;
        }).join(' ');
      }

      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#cfcfe0]">Last: <span className="font-medium">{last?.status || 'N/A'}</span></div>
            <div className="text-sm text-[#9ca3af]">Last successful: <span className="font-medium text-white">{lastSuccessfulMs != null ? `${lastSuccessfulMs} ms` : '—'}</span></div>
          </div>
          <div ref={chartRef} className="w-full">
            <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="bg-[#041025] rounded" style={{ height: 'auto' }}>
              <polyline fill="none" stroke="#06b6d4" strokeWidth="2" points={scaledPolyline} />
              { scaledPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={p.status && (Number.isNaN(Number(p.status)) ? true : !(Number(p.status) >= 200 && Number(p.status) < 400)) ? 3 : 2} fill={p.color || '#f59e0b'} />
              )) }
            </svg>
          </div>
          <div className="mt-2">
            <h5 className="text-sm text-[#cfcfe0] mb-2">Downtime history</h5>
            {downtimeHistory && downtimeHistory.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-40 overflow-auto">
                {downtimeHistory.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 bg-[#031421] rounded">
                    <div className="text-xs text-[#9ca3af]">{new Date(d.start_at).toLocaleString()} → {d.end_at ? new Date(d.end_at).toLocaleString() : 'ongoing'}</div>
                    <div className="text-xs font-medium text-white">{d.duration_ms != null ? `${d.duration_ms} ms` : '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#9ca3af]">No recorded downtimes.</div>
            )}
          </div>
        </div>
      );
    }

    if (!pingHistory || pingHistory.length === 0) return <div className="text-xs text-[#9ca3af]">No ping history.</div>;

    
    const history = pingHistory.length > 1 ? pingHistory.slice(1) : [];
    if (history.length === 0) return <div className="text-xs text-[#9ca3af]">No ping history (after skipping first entry).</div>;

    const values = history.map((p) => (p.response_time_ms == null ? 0 : Number(p.response_time_ms)));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
  const width = chartWidth || 320;
  const height = Math.max(60, Math.round((chartWidth || 320) * 0.25));
    const n = Math.min(48, values.length);
    const tailValues = n > 0 ? values.slice(-n) : [];
    const tailHistory = n > 0 ? history.slice(-n) : [];
    let points = [];
    let step = 0;
    const topGap = Math.round(Math.max(4, height * 0.06));
    const bottomGap = Math.round(Math.max(4, height * 0.04));
    if (tailValues.length === 1) {
      const norm = (tailValues[0] - min) / (max - min || 1);
      const y = Math.round(topGap + (1 - norm) * (height - topGap - bottomGap));
      points = [`${width},${y}`];
    } else if (tailValues.length > 1) {
      step = width / (tailValues.length - 1);
      points = tailValues.map((v, i) => {
        const norm = (v - min) / (max - min || 1);
        const y = Math.round(topGap + (1 - norm) * (height - topGap - bottomGap));
        return `${Math.round(i * step)},${y}`;
      });
    }
    const last = history[history.length - 1];

  const lastDown = downtimeHistory && downtimeHistory.length > 0 ? downtimeHistory[0] : null;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#cfcfe0]">Last: <span className="font-medium">{last?.status || 'N/A'}</span></div>
          <div className="text-sm text-[#9ca3af]">Last successful: <span className="font-medium text-white">{lastSuccessfulMs != null ? `${lastSuccessfulMs} ms` : '—'}</span></div>
        </div>
  <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="bg-[#041025] rounded" style={{ height: 'auto' }}>
          <polyline fill="none" stroke="#06b6d4" strokeWidth="2" points={points.join(' ')} />
          {tailHistory.map((p, i) => {
            const x = i * step;
            const norm = (tailValues[i] - min) / (max - min || 1);
            const y = Math.round(topGap + (1 - norm) * (height - topGap - bottomGap));
            const code = Number(p.status);
            const isDown = Number.isNaN(code) ? true : !(code >= 200 && code < 400);
            return <circle key={i} cx={x} cy={y} r={isDown ? 3 : 2} fill={isDown ? '#ef4444' : '#f59e0b'} />;
          })}
        </svg>
        <div className="mt-2">
          <h5 className="text-sm text-[#cfcfe0] mb-2">Downtime history</h5>
          {downtimeHistory && downtimeHistory.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-40 overflow-auto">
              {downtimeHistory.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2 bg-[#031421] rounded">
                  <div className="text-xs text-[#9ca3af]">{new Date(d.start_at).toLocaleString()} → {d.end_at ? new Date(d.end_at).toLocaleString() : 'ongoing'}</div>
                  <div className="text-xs font-medium text-white">{d.duration_ms != null ? `${d.duration_ms} ms` : '—'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#9ca3af]">No recorded downtimes.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          style={{
            maxHeight: '90vh',
            width: '100%',
            maxWidth: '56rem',
            position: 'relative',
            overflow: 'auto',
            borderRadius: '1rem',
            border: isDown ? '1px solid rgba(220, 38, 38, 0.6)' : '1px solid rgba(124, 58, 237, 0.3)',
            padding: '2rem',
            background: isDown ? 'linear-gradient(135deg, rgba(44, 18, 18, 0.98) 0%, rgba(28, 6, 6, 0.98) 100%)' : 'linear-gradient(135deg, rgba(7, 18, 39, 0.98) 0%, rgba(2, 6, 23, 0.98) 100%)',
            boxShadow: isDown ? '0 30px 60px rgba(44, 6, 6, 0.6), 0 0 40px rgba(239, 68, 68, 0.25)' : '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.3)',
            animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              {item.icon && (
             <img src={item.icon} alt={item.name || 'icon'} loading="lazy" decoding="async" className="h-16 w-16 rounded-xl object-cover shadow-lg ring-2 ring-purple-500/30" />
              )}
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{item.name}</h3>
                <p className="text-sm text-[#9ca3af]">{item.location?.address}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {(Array.isArray(item.tags) ? item.tags : []).map((t) => (
                      <span key={t} className="tag-pill text-xs">{t}</span>
                    ))}
                  </div>

                {item.maintainer && (
                  <div className="mt-3">
                    {item.maintainer_link && String(item.maintainer_link).trim() !== '' ? (
                      <a href={item.maintainer_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-sm text-[#cfcfe0] hover:underline">
                        {item.maintainer_image && showMaintainerImage ? (
                          <img
                            src={item.maintainer_image}
                            alt={item.maintainer}
                            className="h-8 w-8 rounded-full object-cover shadow-sm ring-1 ring-white/10"
                            onError={() => setShowMaintainerImage(false)}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#0b1220] flex items-center justify-center text-xs text-[#9ca3af]">M</div>
                        )}
                        <span className="font-medium">{item.maintainer}</span>
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-3 text-sm text-[#cfcfe0]">
                        {item.maintainer_image && showMaintainerImage ? (
                          <img
                            src={item.maintainer_image}
                            alt={item.maintainer}
                            className="h-8 w-8 rounded-full object-cover shadow-sm ring-1 ring-white/10"
                            onError={() => setShowMaintainerImage(false)}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#0b1220] flex items-center justify-center text-xs text-[#9ca3af]">M</div>
                        )}
                        <span className="font-medium">{item.maintainer}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-lg glass-effect px-4 py-2 text-sm font-medium hover:bg-white/10 transition-all"
              style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 30 }}
            >
              Close
            </button>
          </div>

          {item.note && String(item.note).trim() !== '' && (
            <div className="mb-4 p-3 rounded border border-red-600 bg-red-900/10 text-sm text-red-200">
              <strong className="mr-2">Important:</strong>
              <span>{item.note}</span>
            </div>
          )}

          <div className="prose max-w-none text-sm sm:text-base mb-8 p-4 glass-effect rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
          </div>

          <ImageGallery item={item} {...imageGalleryProps} />
          {type === 'instance' && (
            <div className="mb-6 p-6 glass-effect rounded-xl">
              <h4 className="text-lg font-bold text-white mb-2">Instance health</h4>
              <h2 className="text-red-500 mb-4">
                This feature is not reliable yet and may not reflect reality.
              </h2>
              <div className="text-sm text-[#cfcfe0] mb-4">
                      <div className="text-xs text-[#9ca3af]">Ping URL:</div>
                      <div className="text-sm font-medium text-white truncate">{(item.ping || item.link || '').toString().slice(0, 200)}</div>
                      {renderPingChart()}
              </div>
            </div>
          )}
          <div className="mb-6 p-6 glass-effect rounded-xl">
            {showTrustedMessage && (
              <div className="mb-3 p-3 rounded border border-red-600 bg-red-900/10 text-sm text-red-200">
                <strong className="mr-2">Trusted:</strong>
                <span>This service is marked as "closed-source" but is considered trusted.</span>
              </div>
            )}

            <h4 className="text-lg font-bold text-white mb-2">
              {type === 'client' ? 'How to access' : type === 'guild' ? 'How to join' : 'How to connect'}
            </h4>

            <div className="relative">
              {effectiveShowBlur && (
                <div className="sm:absolute sm:inset-x-0 sm:top-0 z-20 flex flex-col sm:flex-row items-start sm:items-center gap-2 px-2">
                  <div className="flex-1">
                    <div className="bg-black/60 text-yellow-300 px-4 py-2 rounded text-sm">Warning: closed-source, the content below is blurred because it cannot be verified.<br/>You must trust the author.</div>
                  </div>
                  <div className="w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setDismissedWarning(true)}
                      className="w-full sm:w-auto px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0] hover:bg-[#0f1620]"
                    >
                      Dismiss warning
                    </button>
                  </div>
                </div>
              )}

              <div className={`text-sm text-[#cfcfe0] mb-4 ${effectiveShowBlur ? 'max-h-14 overflow-hidden sm:max-h-none sm:overflow-auto' : ''}`} style={{ filter: effectiveShowBlur ? 'blur(6px) grayscale(60%)' : 'none', pointerEvents: effectiveShowBlur ? 'none' : 'auto' }}>
                {type === 'client' ? (
                  (item.invite_code || item.invite) ? (
                    <div className="flex flex-col gap-2">
                      <div>To download the client you need to join this guild using any Spacebar-compatible client with the invite code below:</div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {(item.invite_code || item.invite) ? (
                          <>
                            <a className="px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]" href={`https://fermi.chat/invite/${item.invite_code || item.invite}?instance=${encodeURIComponent((selectedInstance && (selectedInstance.link || selectedInstance.id)) || item.instance || '')}`} target="_blank" rel="noreferrer">Open in Fermi</a>
                            {/*<a className="px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]" href={`https://hoshi.oh64.moe/invite/${item.invite_code || item.invite}?instance=${encodeURIComponent((selectedInstance && (selectedInstance.link || selectedInstance.id)) || item.instance || '')}`} target="_blank" rel="noreferrer">Open in Hoshi</a>*/}
                          </>
                        ) : (
                          <div>Invite code not provided</div>
                        )}
                      </div>
                      <div className="text-xs text-[#9ca3af] mt-2">
                        <div>Invite code: <span className="font-medium text-white">{item.invite_code || item.invite || item.invite_core || 'N/A'}</span></div>
                        <div>Instance: <span className="font-medium text-white">{(selectedInstance && (selectedInstance.link || selectedInstance.id)) || item.instance || 'N/A'}</span></div>
                      </div>
                    </div>
                  ) : item.type === 'by-guild' ? (
                    <div>Join via guild: {item.link ? <a href={item.link} className="text-[#06b6d4] underline" target="_blank" rel="noreferrer">{item.link}</a> : 'link not provided'}</div>
                  ) : item.type === 'spacebar' ? (
                    <div className="flex flex-col gap-2">
                      <div>Spacebar client, connect using an invite code and an instance.</div>
                      {selectedInstance ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          {(item.invite_code || item.invite) ? (
                            <>
                              <a className="px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]" href={`https://fermi.chat/invite/${item.invite_code || item.invite}?instance=${encodeURIComponent(selectedInstance.link || selectedInstance.id || '')}`} target="_blank" rel="noreferrer">Open in Fermi</a>
                              {/*<a className="px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]" href={`https://hoshi.oh64.moe/invite/${item.invite_code || item.invite}?instance=${encodeURIComponent(selectedInstance.link || selectedInstance.id || '')}`} target="_blank" rel="noreferrer">Open in Hoshi</a>*/}
                            </>
                          ) : (
                            <div>Invite code not provided, invite core: {item.invite_core || item.invite || 'N/A'}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-[#9ca3af]">Select an instance in the main view to generate instance-specific links. Invite: {item.invite_code || item.invite || item.invite_core || 'N/A'}</div>
                      )}
                    </div>
                  ) : (
                    item.link ? <div>Client: <a href={item.link} className="text-[#06b6d4] underline" target="_blank" rel="noreferrer">{item.link}</a></div> : <div>Instructions: {item.install || 'No install info'}</div>
                  )
                ) : type === 'guild' ? (
                <div className="flex flex-col gap-2">
                  <div>Join this guild using any Spacebar-compatible client with the invite code below:</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(item.invite_code || item.invite) ? (
                      <>
                        <a className="px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]" href={`https://fermi.chat/invite/${item.invite_code || item.invite}?instance=${encodeURIComponent(item.instance || '')}`} target="_blank" rel="noreferrer">Open in Fermi</a>
                        {/*<a className="px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]" href={`https://hoshi.oh64.moe/invite/${item.invite_code || item.invite}?instance=${encodeURIComponent(item.instance || '')}`} target="_blank" rel="noreferrer">Open in Hoshi</a>*/}
                      </>
                    ) : (
                      <div>Invite code not provided</div>
                    )}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-2">
                    <div>Invite code: <span className="font-medium text-white">{item.invite_code || item.invite || 'N/A'}</span></div>
                    <div>Instance: <span className="font-medium text-white">{item.instance || 'N/A'}</span></div>
                  </div>
                </div>
              ) : (
                <div>
                  Use any Spacebar-compatible client.
                  <br />
                  Instance link: {item.link ? (
                    <span className="flex items-center gap-2">
                      <span className="truncate max-w-88">{item.link}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.link)}
                        className="px-2 py-1 rounded bg-[#081226] border border-[#263047] text-xs text-[#cfcfe0] hover:bg-[#0f1620]"
                      >
                        {copiedText === item.link ? 'Copied' : 'Copy'}
                      </button>
                    </span>
                  ) : (item.invite || item.id)}
                </div>
              )}
              </div>
            </div>
          </div>
          </div>
        </div>
    </>
  );
}
