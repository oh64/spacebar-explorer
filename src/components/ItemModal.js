"use client";

import React, { useState, useEffect } from 'react';
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
      fetch(`/api/ping?instanceId=${encodeURIComponent(item.id)}&limit=48`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setPingHistory(data.reverse()); })
        .catch(() => {});
      
      fetch(`/api/downtimes?instanceId=${encodeURIComponent(item.id)}&limit=50`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setDowntimeHistory(data); })
        .catch(() => {});
    }
  }, [type, item.id]);

  function renderPingChart() {
    if (!pingHistory || pingHistory.length === 0) return <div className="text-xs text-[#9ca3af]">No ping history.</div>;

    
    const history = pingHistory.length > 1 ? pingHistory.slice(1) : [];
    if (history.length === 0) return <div className="text-xs text-[#9ca3af]">No ping history (after skipping first entry).</div>;

    const values = history.map((p) => (p.response_time_ms == null ? 0 : Number(p.response_time_ms)));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const width = 320;
    const height = 60;
    const step = width / Math.max(1, values.length - 1);
    const points = values.map((v, i) => `${i * step},${height - ( (v - min) / (max - min || 1) ) * height}`);
    const last = history[history.length - 1];

  const lastDown = downtimeHistory && downtimeHistory.length > 0 ? downtimeHistory[0] : null;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#cfcfe0]">Last: <span className="font-medium">{last?.status || 'N/A'}</span></div>
          <div className="text-sm text-[#9ca3af]">Last successful: <span className="font-medium text-white">{lastSuccessfulMs != null ? `${lastSuccessfulMs} ms` : '—'}</span></div>
        </div>
        <svg width={width} height={height} className="bg-[#041025] rounded">
          <polyline fill="none" stroke="#06b6d4" strokeWidth="2" points={points.join(' ')} />
          {history.map((p, i) => {
            const x = i * step;
            const y = height - (((values[i] - min) / (max - min || 1)) * height);
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
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-lg glass-effect px-4 py-2 text-sm font-medium hover:bg-white/10 transition-all"
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
              <div className="text-sm text-[#cfcfe0] mb-4">
                      <div className="text-xs text-[#9ca3af]">Ping URL:</div>
                      <div className="text-sm font-medium text-white truncate">{(item.ping || item.link || '').toString().slice(0, 200)}</div>
                      {renderPingChart()}
              </div>
            </div>
          )}
          <div className="mb-6 p-6 glass-effect rounded-xl">
            <h4 className="text-lg font-bold text-white mb-2">
              {type === 'client' ? 'How to access' : type === 'guild' ? 'How to join' : 'How to connect'}
            </h4>

            <div className="text-sm text-[#cfcfe0] mb-4">
              {type === 'client' ? (
                item.type === 'by-guild' ? (
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
                </div>
              ) : (
                <div>
                  Use any Spacebar-compatible client.
                  <br />
                  Instance link: {item.link ? (
                    <span className="flex items-center gap-2">
                      <span className="truncate max-w-[22rem]">{item.link}</span>
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
    </>
  );
}
