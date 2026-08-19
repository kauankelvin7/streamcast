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
  backdrop_path?: string;
  year?: string | number;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface ContentRowProps {
  title: string;
  subtitle?: string;
  icon?: any;
  items: ContentItem[];
  isLoading?: boolean;
  type?: 'movie' | 'tv';
  onItemClick?: (item: any) => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({ 
  title, 
  subtitle,
  icon: Icon,
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
      setShowLeft(scrollLeft > 10);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
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
      <div style={{ marginBottom: 40, position: 'relative' }}>
        <div style={{ padding: '0 5% 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 180, height: 24, borderRadius: 8 }} className="skeleton-shimmer" />
        </div>
        <div style={{ display: 'flex', gap: 20, padding: '0 5%', overflow: 'hidden' }}>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="skeleton-shimmer"
              style={{ flexShrink: 0, width: 175, aspectRatio: '2/3', borderRadius: 18, border: '1px solid rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 44, position: 'relative' }}>
      {/* Row Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        padding: '0 5% 14px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {Icon && <Icon size={18} style={{ color: '#F58253' }} />}
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              color: '#fff', 
              fontFamily: "'Syne', 'Inter', sans-serif",
              letterSpacing: '-0.02em',
              margin: 0,
            }}>
              {title}
            </h3>
          </div>
          {subtitle && (
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Total indicator */}
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
          {items.length} títulos
        </span>
      </div>

      {/* Carousel Container */}
      <div style={{ position: 'relative' }}>

        {/* ── LEFT NAV BUTTON ── */}
        <AnimatePresence>
          {showLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              onClick={() => scroll('left')}
              style={{
                position: 'absolute',
                top: 'calc(50% - 8px)',
                transform: 'translateY(-50%)',
                zIndex: 30,
                left: '1.5%',
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(10, 10, 14, 0.88)',
                border: '1px solid rgba(229,89,29,0.5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 20px rgba(229,89,29,0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E5591D';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 10, 14, 0.88)';
                e.currentTarget.style.borderColor = 'rgba(229,89,29,0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Deslizar para esquerda"
            >
              <ChevronLeft size={22} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── HORIZONTAL SLIDING TRACK (100% LIMPO SEM QUADRADOS DE BLUR) ── */}
        <div
          ref={rowRef}
          style={{ 
            display: 'flex', 
            gap: 20, 
            padding: '0 5% 16px', 
            overflowX: 'auto', 
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {items.map((item, idx) => (
            <div key={`${item.id}-${idx}`} style={{ flexShrink: 0, width: 175 }}>
              <ContentCard 
                item={item} 
                index={idx}
                type={type} 
                onClick={() => onItemClick?.(item)} 
              />
            </div>
          ))}
        </div>

        {/* ── RIGHT NAV BUTTON ── */}
        <AnimatePresence>
          {showRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              onClick={() => scroll('right')}
              style={{
                position: 'absolute',
                top: 'calc(50% - 8px)',
                transform: 'translateY(-50%)',
                zIndex: 30,
                right: '1.5%',
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(10, 10, 14, 0.88)',
                border: '1px solid rgba(229,89,29,0.5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 20px rgba(229,89,29,0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E5591D';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 10, 14, 0.88)';
                e.currentTarget.style.borderColor = 'rgba(229,89,29,0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Deslizar para direita"
            >
              <ChevronRight size={22} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default ContentRow;