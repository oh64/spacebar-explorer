import { highlightClassFor, backgroundClassFor } from '../utils/classHelpers';
import StatusButton from './StatusButton';

export default function ItemCard({ 
  item = {}, 
  index = 0, 
  type = 'client',
  onCardClick = () => {}, 
  onViewDetails = () => {} 
}) {
  const safeName = item.name || 'Unknown';
  const safeShort = item.short || '';
  const safeTags = Array.isArray(item.tags) ? item.tags : [];
  const safeIcon = item.icon || null;
  const safeStatus = item.status || 1;

  return (
    <li
      onClick={(e) => onCardClick(e, item)}
      className={`card-animate flex flex-col md:flex-row items-start md:items-center justify-between rounded-2xl px-5 py-4 border shadow-xl ${highlightClassFor(item)} ${backgroundClassFor(item)} cursor-pointer`}
      style={{animationDelay: `${index * 0.05}s`}}
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        {safeIcon ? (
          <img 
            src={safeIcon} 
            alt={safeName} 
            loading="lazy"
            decoding="async"
            className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover shadow-lg ring-2 ${
              type === 'client' ? 'ring-purple-500/20' : type === 'guild' ? 'ring-pink-500/20' : 'ring-cyan-500/20'
            }`} 
          />
        ) : (
          <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl glass-effect flex items-center justify-center text-xl font-bold ${
            type === 'client' ? 'text-[#a78bfa]' : type === 'guild' ? 'text-[#f472b6]' : 'text-[#22d3ee]'
          }`}>
            {safeName.slice(0,1)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white">{safeName}</h3>
              {type === 'client' && <StatusButton status={safeStatus} small />}
            </div>
            <div className="text-xs sm:text-sm text-[#9ca3af] italic">{safeShort}</div>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {safeTags.map((t) => (
              <span 
                key={t} 
                className={`tag-pill text-xs sm:text-sm ${
                  t === 'official' 
                    ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30' 
                    : 'text-[#cfcfe0]'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto mt-3 md:mt-0 justify-end">
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails(item); }} 
          className="rounded-lg gradient-button px-4 py-2 text-sm font-medium text-white shadow-lg whitespace-nowrap"
        >
          <span className="relative z-10">View Details</span>
        </button>
      </div>
    </li>
  );
}
