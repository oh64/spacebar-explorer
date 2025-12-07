export function copyToClipboard(text, onSuccess) {
  if (!text) return;
  
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      if (onSuccess) onSuccess(text);
    }).catch(() => {
      fallbackCopy(text, onSuccess);
    });
  } else {
    fallbackCopy(text, onSuccess);
  }
}

function fallbackCopy(text, onSuccess) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (onSuccess) onSuccess(text);
  } catch (e) {
    alert('Could not copy to clipboard');
  }
}
