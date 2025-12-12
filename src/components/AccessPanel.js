"use client";

import React from 'react';

export default function AccessPanel({
  type,
  item,
  downloadCode,
  downloadInstance,
  supportCode,
  supportInstance,
  selectedInstance,
  copiedText,
  copyToClipboard
}) {
  const instanceIdOrLink = (selectedInstance && (selectedInstance.link || selectedInstance.id)) || downloadInstance || '';

  const btnClass = "px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]";

  if (type === 'client') {
    if (downloadCode || item.direct_download) {
      const instanceForInvite = encodeURIComponent(instanceIdOrLink || '');
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            {item.direct_download ? (
              <a className={btnClass} href={item.direct_download} target="_blank" rel="noreferrer">Download</a>
            ) : (
              <a className={btnClass} href={`/download?client=${encodeURIComponent(item.id || item.name || '')}`} target="_blank" rel="noreferrer">Download</a>
            )}

            {downloadCode ? (
              <a className={btnClass} href={`https://fermi.chat/invite/${downloadCode}?instance=${instanceForInvite}`} target="_blank" rel="noreferrer">Open in Fermi</a>
            ) : null}
          </div>

          <div className="text-xs text-[#9ca3af] mt-2">
            <div>Invite/Download code: <span className="font-medium text-white">{downloadCode || 'N/A'}</span></div>
            <div>Instance: <span className="font-medium text-white">{instanceIdOrLink || 'N/A'}</span></div>
          </div>
        </div>
      );
    }

    if (item.type === 'by-guild') {
      return (
        <div>Join via guild: {item.link ? <a href={item.link} className="text-[#06b6d4] underline" target="_blank" rel="noreferrer">{item.link}</a> : 'link not provided'}</div>
      );
    }

    if (item.type === 'spacebar') {
      if (selectedInstance) {
        if (item.invite_code || item.invite) {
          const inst = encodeURIComponent(selectedInstance.link || selectedInstance.id || '');
          return (
            <div className="flex flex-col gap-2">
              <div>Spacebar client, connect using an invite code and an instance.</div>
              <div className="flex flex-wrap gap-2 items-center">
                <a className={btnClass} href={`https://fermi.chat/invite/${item.invite_code || item.invite}?instance=${inst}`} target="_blank" rel="noreferrer">Open in Fermi</a>
              </div>
            </div>
          );
        }

        return <div>Invite code not provided, invite core: {item.invite_core || item.invite || 'N/A'}</div>;
      }

      return <div className="text-xs text-[#9ca3af]">Select an instance in the main view to generate instance-specific links. Invite: {item.invite_code || item.invite || item.invite_core || 'N/A'}</div>;
    }

    return (
      <div>
        {item.link ? (
          <div>Client: <a href={item.link} className="text-[#06b6d4] underline" target="_blank" rel="noreferrer">{item.link}</a></div>
        ) : (
          <div>Instructions: {item.install || 'No install info'}</div>
        )}
      </div>
    );
  }

  if (type === 'guild') {
    const instForSupport = encodeURIComponent(supportInstance || '');
    const instForDownload = encodeURIComponent(downloadInstance || '');
    return (
      <div className="flex flex-col gap-2">
        <div>Join this guild using any Spacebar-compatible client with the invite code below:</div>
        <div className="flex flex-wrap gap-2 items-center">
          {supportCode ? (
            <a className={btnClass} href={`https://fermi.chat/invite/${supportCode}?instance=${instForSupport}`} target="_blank" rel="noreferrer">Open Support Server</a>
          ) : null}
          {downloadCode ? (
            <a className={btnClass} href={`https://fermi.chat/invite/${downloadCode}?instance=${instForDownload}`} target="_blank" rel="noreferrer">Open in Fermi</a>
          ) : (
            <div>Invite code not provided</div>
          )}
        </div>
        <div className="text-xs text-[#9ca3af] mt-2">
          <div>Invite code: <span className="font-medium text-white">{downloadCode || 'N/A'}</span></div>
          <div>Instance: <span className="font-medium text-white">{downloadInstance || 'N/A'}</span></div>
        </div>
      </div>
    );
  }

  return (
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
  );
}
