export function highlightClassFor(item) {
  const tags = item.tags || [];
  if (tags.includes('official')) {
    return 'border-yellow-400/40 ring-1 ring-yellow-400/20';
  }
  if (tags.includes('recommended')) {
    return 'border-orange-400/40 ring-1 ring-orange-400/25';
  }
  return 'border-[#1f2937]';
}

export function backgroundClassFor(item) {
  const tags = item.tags || [];
  if (tags.includes('official')) {
    return 'bg-yellow-900/10';
  }
  if (tags.includes('recommended')) {
    return 'bg-orange-900/15';
  }
  return 'bg-transparent';
}
