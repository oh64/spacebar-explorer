import { useState, useEffect } from 'react';

export function useImageGallery(item) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!item || !item.images || item.images.length <= 1 || !isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [item, isAutoPlaying]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsAutoPlaying(true);
  }, [item]);

  function handleTouchStart(e) {
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlaying(false);
  }

  function handleTouchMove(e) {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (!touchStart || !touchEnd || !item) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) < minSwipeDistance) return;

    if (distance > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    } else {
      setCurrentImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
    }
  }

  function handleImageNavigation(direction) {
    setIsAutoPlaying(false);
    if (!item) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    } else {
      setCurrentImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1));
    }
  }

  return {
    currentImageIndex,
    setCurrentImageIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleImageNavigation,
    setIsAutoPlaying
  };
}
