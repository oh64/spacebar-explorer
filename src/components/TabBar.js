export default function TabBar({ activeTab, setActiveTab, tabs }) {
  return (
    <div className="w-full max-w-[75em] mb-8">
      <div className="flex justify-center items-center border-b border-[#1f2937] relative">
        <div className="w-full max-w-4xl flex">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-8 py-4 text-lg font-semibold text-center transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          className="absolute bottom-0 h-1 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] transition-all duration-500 ease-out"
          style={{
            left: `${(tabs.findIndex(t => t.id === activeTab) / tabs.length) * 100}%`,
            width: `${100 / tabs.length}%`
          }}
        ></div>
      </div>
    </div>
  );
}
