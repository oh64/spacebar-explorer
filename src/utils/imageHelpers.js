export function imageWithHash(url) {
  try {
    if (!url || typeof url !== 'string') return url;
    const hash = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GIT_HASH) ? String(process.env.NEXT_PUBLIC_GIT_HASH) : '';
    const q = hash ? String(hash).slice(0, 7) : '';
    if (!q) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}q=${encodeURIComponent(q)}`;
  } catch (e) {
    return url;
  }
}

export default imageWithHash;
