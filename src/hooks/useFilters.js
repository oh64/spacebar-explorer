import { useState } from 'react';

export function useFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState([1, 2, 3]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [selectedIncludeTags, setSelectedIncludeTags] = useState([]);
  const [selectedExcludeTags, setSelectedExcludeTags] = useState([]);
  const [itemSort, setItemSort] = useState("default");

  function matchesFilter(item, isClient) {
    if (isClient && !statusFilter.includes(item.status || 1)) return false;

    if (selectedIncludeTags.length > 0) {
      const hasInclude = selectedIncludeTags.some(tag => (item.tags || []).includes(tag));
      if (!hasInclude) return false;
    }

    if (selectedExcludeTags.length > 0) {
      const hasExclude = selectedExcludeTags.some(tag => (item.tags || []).includes(tag));
      if (hasExclude) return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const inName = item.name?.toLowerCase().includes(q);
    const inShort = item.short?.toLowerCase().includes(q);
    const inDesc = item.description?.toLowerCase().includes(q);
    const inTags = (item.tags || []).join(" ").toLowerCase().includes(q);
    return inName || inShort || inDesc || inTags;
  }

  function filterAndSort(items, isClient) {
    const filtered = items.filter((it) => matchesFilter(it, isClient));
    filtered.sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0));
    return filtered;
  }

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    showTagMenu,
    setShowTagMenu,
    selectedIncludeTags,
    setSelectedIncludeTags,
    selectedExcludeTags,
    setSelectedExcludeTags,
    itemSort,
    setItemSort,
    filterAndSort
  };
}
