export default function TagMenu({
  showTagMenu,
  activeItems,
  selectedIncludeTags,
  setSelectedIncludeTags,
  selectedExcludeTags,
  setSelectedExcludeTags
}) {
  if (!showTagMenu) return null;

  return (
    <div className="w-full max-w-[75em] mx-auto mt-2">
      <div className="bg-[#0f1419] border border-[#1f2937] rounded-lg p-3">
        <div className="flex flex-wrap gap-2">
          {[...new Set(activeItems.flatMap((c) => c.tags || []))].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (selectedIncludeTags.includes(tag)) {
                  setSelectedIncludeTags(prev => prev.filter(t => t !== tag));
                  setSelectedExcludeTags(prev => [...prev, tag]);
                } else if (selectedExcludeTags.includes(tag)) {
                  setSelectedExcludeTags(prev => prev.filter(t => t !== tag));
                } else {
                  setSelectedIncludeTags(prev => [...prev, tag]);
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                selectedIncludeTags.includes(tag)
                  ? "bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white"
                  : selectedExcludeTags.includes(tag)
                    ? "bg-red-500/20 text-red-400"
                    : "bg-[#1a1f2e] text-[#cfcfe0] hover:bg-[#2a2f3e]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{tag}</span>
                <span className="text-xs text-[#9ca3af]">
                  {selectedIncludeTags.includes(tag) 
                    ? 'include' 
                    : selectedExcludeTags.includes(tag) 
                      ? 'exclude' 
                      : ''}
                </span>
              </div>
            </button>
          ))}
        </div>

        {(selectedIncludeTags.length > 0 || selectedExcludeTags.length > 0) && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { 
                setSelectedIncludeTags([]); 
                setSelectedExcludeTags([]); 
              }}
              className="px-3 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
