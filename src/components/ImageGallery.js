import React, { useState, useEffect } from 'react';
import { imageWithHash } from '../utils/imageHelpers';

export default function ImageGallery({ 
  item, 
  currentImageIndex,
  setCurrentImageIndex,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  setIsAutoPlaying
}) {
  if (!item.images || item.images.length === 0) return null;

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    try {
      setIsTouchDevice(('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
    } catch (e) {
      setIsTouchDevice(false);
    }
  }, []);

  return (
    <div className="mb-8">
      <h4 className="text-xl font-bold text-white mb-4">Screenshots</h4>
      <div className="relative">
        <div 
          className="relative aspect-video bg-[#0a0f1a] rounded-lg overflow-hidden cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (isTouchDevice) {
              setLightboxOpen(true);
              setIsAutoPlaying(false);
              return;
            }
            if (item.images.length > 1) {
              setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
              setIsAutoPlaying(false);
            }
          }}
        >
          <img 
            src={imageWithHash(item.images[currentImageIndex])} 
            alt={`${item.name} screenshot ${currentImageIndex + 1}`}
            className="w-full h-full object-contain pointer-events-none"
            onError={(e) => { 
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext fill="%23666" x="50" y="50" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E'; 
            }}
          />
        </div>
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              aria-label="Close image"
              title="Close"
              style={{ position: 'fixed', top: '1rem', right: '1rem', left: 'auto' }}
              className="z-60 inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-black shadow-xl border border-black/10 hover:scale-105 transition-transform"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
            <div className="relative max-w-[95%] max-h-[95%]">
              <img src={imageWithHash(item.images[currentImageIndex])} alt={`expanded ${item.name}`} className="max-w-full max-h-[90vh] object-contain rounded" onClick={(e) => e.stopPropagation()} />
            </div>
          </div>
        )}
        {item.images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {item.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { 
                  setCurrentImageIndex(idx); 
                  setIsAutoPlaying(false); 
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImageIndex 
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] w-8' 
                    : 'bg-[#374151] hover:bg-[#4b5563]'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
