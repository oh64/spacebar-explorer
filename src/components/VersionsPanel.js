"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function VersionsPanel({ item }) {
  const versionsObj = item.versions || {};
  const changelogLink = versionsObj.changelog_link || '';
  const allKeys = Object.keys(versionsObj || {}).filter(k => k !== 'changelog_link');
  
  // Show the panel if there's a changelog link OR version entries
  if (!changelogLink && (!allKeys || allKeys.length === 0)) return null;

  const latestKey = allKeys[0];
  const [showAll, setShowAll] = useState(false);

  const btnClass = "px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]";

  const renderVersion = (key) => {
    const v = versionsObj[key] || {};
    return (
      <div key={key} className="mb-4 p-3 bg-[#031421] rounded">
        <div className="flex items-center justify-between">
          <div className="font-medium text-white">{key}</div>
          <div className="flex items-center gap-2">
            {v.download_url ? (
              <a className={btnClass} href={`/download?client=${encodeURIComponent(item.id)}&version=${encodeURIComponent(key)}`} target="_blank" rel="noreferrer">Download</a>
            ) : null}
          </div>
        </div>
        {v.changelog ? (
          <div className="mt-2 text-sm prose max-w-none text-[#cfcfe0]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{v.changelog}</ReactMarkdown></div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="mb-6 p-6 glass-effect rounded-xl">
      <h4 className="text-lg font-bold text-white mb-2">Versions</h4>
      {changelogLink ? (
        <div className="mb-3"><a className="text-[#06b6d4] underline" href={changelogLink} target="_blank" rel="noreferrer">Full changelog</a></div>
      ) : null}

      {allKeys.length > 0 && (
        <>
          <div>
            {renderVersion(latestKey)}
          </div>

          {allKeys.length > 1 && (
            <div>
              <button type="button" onClick={() => setShowAll(s => !s)} className="mt-2 px-3 py-1 rounded bg-[#081226] border border-[#263047] text-sm text-[#cfcfe0]">{showAll ? 'Hide other versions' : `Show ${allKeys.length - 1} other version(s)`}</button>
              {showAll ? (
                <div className="mt-3">
                  {allKeys.slice(1).map(k => renderVersion(k))}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
