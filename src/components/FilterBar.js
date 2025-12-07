export default function FilterBar({
  activeTab,
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
  showStatusFilter = true
}) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <input
        placeholder={`Search ${activeTab}`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 rounded-lg border px-4 py-3 bg-[#021226]/50 border-[#1f2937] text-white placeholder-gray-500 focus:border-[#7c3aed] transition-all shadow-lg"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        {showStatusFilter && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-[#9ca3af] whitespace-nowrap">Status:</span>
            <button
              onClick={() => setStatusFilter(prev => 
                prev.includes(1) ? prev.filter(s => s !== 1) : [...prev, 1]
              )}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter.includes(1) 
                  ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                  : "bg-[#1f2937] text-[#6b7280] border border-[#374151]"
              }`}
            >
              Stable
            </button>
            <button
              onClick={() => setStatusFilter(prev => 
                prev.includes(2) ? prev.filter(s => s !== 2) : [...prev, 2]
              )}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter.includes(2) 
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" 
                  : "bg-[#1f2937] text-[#6b7280] border border-[#374151]"
              }`}
            >
              Unstable
            </button>
            <button
              onClick={() => setStatusFilter(prev => 
                prev.includes(3) ? prev.filter(s => s !== 3) : [...prev, 3]
              )}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter.includes(3) 
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" 
                  : "bg-[#1f2937] text-[#6b7280] border border-[#374151]"
              }`}
            >
              In Dev
            </button>
          </div>
        )}

        <div className="flex gap-2 items-center flex-wrap flex-1">
          <span className="text-sm text-[#9ca3af] whitespace-nowrap">Tags:</span>
          <div className="relative flex-1 tag-menu-container">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1f2937] text-white border border-[#374151] hover:border-[#7c3aed] transition-all"
            >
              {(selectedIncludeTags.length || selectedExcludeTags.length) 
                ? `${selectedIncludeTags.length} in, ${selectedExcludeTags.length} out` 
                : "Select tags..."}
            </button>
          </div>

          {(selectedIncludeTags.length > 0 || selectedExcludeTags.length > 0) && (
            <div className="flex gap-2 flex-wrap">
              {selectedIncludeTags.map((tag) => (
                <span
                  key={"inc-"+tag}
                  className="px-2 py-1 rounded-lg text-xs bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white flex items-center gap-2"
                >
                  <span className="text-xs">+{tag}</span>
                  <button
                    onClick={() => setSelectedIncludeTags(prev => prev.filter(t => t !== tag))}
                    className="hover:text-red-300 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedExcludeTags.map((tag) => (
                <span
                  key={"exc-"+tag}
                  className="px-2 py-1 rounded-lg text-xs bg-red-500/20 text-red-400 flex items-center gap-2"
                >
                  <span className="text-xs">-{tag}</span>
                  <button
                    onClick={() => setSelectedExcludeTags(prev => prev.filter(t => t !== tag))}
                    className="hover:text-red-300 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
