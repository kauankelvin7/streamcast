import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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

const CARD_WIDTH = 175;
const CARD_GAP = 20;

export const ContentRow: React.FC<ContentRowProps> = ({ 
  title, 
  subtitle,
  icon: Icon,
  items, 
  isLoading, 
  type = 'movie', 
  onItemClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Medir largura do viewport estrito para alinhamento perfeito
  const updateViewportWidth = useCallback(() => {
    if (containerRef.current) {
      setViewportWidth(containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, [updateViewportWidth]);

  // Reset offset ao mudar de itens
  useEffect(() => {
    setOffset(0);
  }, [items]);

  const totalTrackWidth = items.length * CARD_WIDTH + Math.max(0, items.length - 1) * CARD_GAP;
  const maxOffset = Math.max(0, totalTrackWidth - viewportWidth);

  // Calcula quantos cards cabem inteiramente na tela
  const cardsPerPage = Math.max(1, Math.floor((viewportWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)));
  const pageStep = cardsPerPage * (CARD_WIDTH + CARD_GAP);

  const handleNext = () => {
    setOffset(prev => Math.min(maxOffset, prev + pageStep));
  };

  const handlePrev = () => {
    setOffset(prev => Math.max(0, prev - pageStep));
  };

  const canScrollLeft = offset > 0;
  const canScrollRight = offset < maxOffset - 5;

  // Efeito elegante e suave de desfoque/gradiente nas bordas cortadas
  const maskStyle: React.CSSProperties = useMemo(() => {
    if (canScrollLeft && canScrollRight) {
      return {
        maskImage: 'linear-gradient(to right, transparent 0%, black 36px, black calc(100% - 54px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 36px, black calc(100% - 54px), transparent 100%)',
      };
    }
    if (canScrollRight) {
      return {
        maskImage: 'linear-gradient(to right, black calc(100% - 54px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 54px), transparent 100%)',
      };
    }
    if (canScrollLeft) {
      return {
        maskImage: 'linear-gradient(to right, transparent 0%, black 36px, black 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 36px, black 100%)',
      };
    }
    return {};
  }, [canScrollLeft, canScrollRight]);

  if (isLoading) {
    return (
      <div style={{ marginBottom: 44, padding: '0 5%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 180, height: 24, borderRadius: 8 }} className="skeleton-shimmer" />
        </div>
        <div style={{ display: 'flex', gap: CARD_GAP, overflow: 'hidden' }}>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="skeleton-shimmer"
              style={{ flexShrink: 0, width: CARD_WIDTH, aspectRatio: '2/3', borderRadius: 18, border: '1px solid rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 48, padding: '0 5%', position: 'relative' }}>
      
      {/* ── ROW HEADER (ALINHADO 100% COM A BORDA DOS CARDS) ── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        marginBottom: 14,
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

        {/* Navigation Indicator / Total */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            {items.length} títulos
          </span>
        </div>
      </div>

      {/* ── CAROUSEL WRAPPER WITH STRICT ALIGNMENT & BOUNDARY ── */}
      <div style={{ position: 'relative' }}>
        
        {/* Left Arrow Button */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              onClick={handlePrev}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30,
                left: -22,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(14, 14, 18, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
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
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(14, 14, 18, 0.95)';
                e.currentTarget.style.borderColor = 'rgba(229,89,29,0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Deslizar para esquerda"
            >
              <ChevronLeft size={22} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── STRICT VIEWPORT WITH ELEGANT EDGE FADE MASK ── */}
        <div 
          ref={containerRef}
          style={{ 
            width: '100%', 
            overflow: 'hidden', 
            borderRadius: 6,
            padding: '4px 0 16px 0',
            transition: 'mask-image 0.3s ease, -webkit-mask-image 0.3s ease',
            ...maskStyle,
          }}
        >
          {/* ── TRANSLATING INNER TRACK ── */}
          <div
            style={{
              display: 'flex',
              gap: CARD_GAP,
              transform: `translateX(-${offset}px)`,
              transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
              width: 'max-content',
            }}
          >
            {items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} style={{ flexShrink: 0, width: CARD_WIDTH }}>
                <ContentCard 
                  item={item} 
                  index={idx}
                  type={type} 
                  onClick={() => onItemClick?.(item)} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow Button */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              onClick={handleNext}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30,
                right: -22,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(14, 14, 18, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
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
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(14, 14, 18, 0.95)';
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