import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentCard from './ContentCard';

interface ContentItem {
  id: string | number;
  title: string;
  thumbnail?: string;
  poster?: string;
  poster_path?: string;
  year?: string | number;
  release_date?: string;
  first_air_date?: string;
  duration?: string;
  rating?: number;
  quality?: 'HD' | '4K';
  progress?: number;
}

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  isLoading?: boolean;
  type?: 'movie' | 'tv';
  onItemClick?: (item: any) => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({ 
  title, 
  items, 
  isLoading, 
  type = 'movie', 
  onItemClick 
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75; 
      const scrollTo = direction === 'left' 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = useCallback(() => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeft(scrollLeft > 2);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 2);
    }
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (row) {
      row.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      
      return () => row.removeEventListener('scroll', handleScroll);
    }
  }, [items, handleScroll]);

  if (isLoading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, padding: '0 5%', color: '#fff', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
          {title}
        </h2>
        <div style={{ display: 'flex', gap: 20, padding: '0 5%', overflow: 'hidden' }}>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="skeleton-shimmer"
              style={{ flexShrink: 0, width: 180, aspectRatio: '2/3', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  const navButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'rgba(20,20,24,0.9)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  };

  return (
    <div style={{ padding: '24px 0', position: 'relative' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, padding: '0 5%', color: '#fff', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
        {title}
      </h2>

      <div style={{ position: 'relative' }}>
        {/* Left Arrow */}
        <AnimatePresence>
          {showLeft && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => scroll('left')}
              style={{ ...navButtonStyle, left: 16 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E5591D'; e.currentTarget.style.color = '#E5591D'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft size={22} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scroll Area */}
        <div
          ref={rowRef}
          style={{ 
            display: 'flex', gap: 20, padding: '0 5% 16px', 
            overflowX: 'auto', scrollBehavior: 'smooth',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}
        >
          {items.map((item) => (
            <div key={item.id} style={{ flexShrink: 0, width: 180 }}>
              <ContentCard 
                item={item} 
                type={type} 
                onClick={() => onItemClick?.(item)} 
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <AnimatePresence>
          {showRight && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => scroll('right')}
              style={{ ...navButtonStyle, right: 16 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E5591D'; e.currentTarget.style.color = '#E5591D'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              aria-label="Rolar para a direita"
            >
              <ChevronRight size={22} />
            </motion.button>
          )}
        </AnimatePresence>
        
        <style>{`.custom-scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </div>
  );
};