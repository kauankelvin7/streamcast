import { useState } from 'react';
import { Film, Star } from 'lucide-react';
import { tmdb } from '@lib/tmdb';

interface Props {
  item: any;
  type?: 'movie' | 'tv';
  onClick: () => void;
  index?: number;
}

export default function ContentCard({ item, onClick, index = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const [failedMain, setFailedMain] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);
  
  const title = item.title ?? item.name ?? 'Sem título';

  // URLs primárias e secundárias com fallback robusto
  const primaryPoster = item.poster_path 
    ? tmdb.getImageUrl(item.poster_path, 'w500') 
    : (item.thumbnail || item.poster);

  const fallbackPoster = item.backdrop_path 
    ? tmdb.getImageUrl(item.backdrop_path, 'w780') 
    : (item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w300') : null);

  const currentImgSrc = !failedMain ? primaryPoster : (!failedFallback ? fallbackPoster : null);

  const yearStr = item.release_date?.split('-')[0] ?? item.first_air_date?.split('-')[0] ?? item.year ?? '';
  const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : null;
  const year = parseInt(yearStr, 10);
  const isNew = year >= 2025;

  const delay = Math.min(index * 0.02, 0.2);

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      className="animate-card-enter"
      style={{
        position: 'relative',
        width: '100%',
        cursor: 'pointer',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#131317',
        border: hovered ? '1px solid rgba(229,89,29,0.5)' : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        transform: hovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: hovered 
          ? '0 20px 40px rgba(0,0,0,0.7), 0 0 28px rgba(229,89,29,0.18)' 
          : '0 4px 16px rgba(0,0,0,0.35)',
        outline: 'none',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '2/3', width: '100%', background: '#0c0c10' }}>
        {currentImgSrc ? (
          <img 
            src={currentImgSrc} 
            alt={title} 
            decoding="async"
            onError={() => {
              if (!failedMain) {
                setFailedMain(true);
              } else {
                setFailedFallback(true);
              }
            }}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.45s ease',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
              display: 'block',
            }} 
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'linear-gradient(145deg, #1c1c24 0%, #101014 100%)',
            color: 'rgba(255,255,255,0.2)',
            padding: 16,
            textAlign: 'center',
            gap: 12
          }}>
            <Film size={34} strokeWidth={1.5} style={{ color: '#E5591D', opacity: 0.7 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>{title}</span>
          </div>
        )}

        {/* Top Badges (Rating & Novo) */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
          {rating && Number(rating) > 0 ? (
            <span style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFD700',
              fontSize: 10.5,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              padding: '3px 7px',
              borderRadius: 7,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
              <Star size={9.5} fill="#FFD700" color="#FFD700" />
              {rating}
            </span>
          ) : <div />}

          {isNew && (
            <span style={{
              background: 'linear-gradient(135deg, #F58253, #E5591D)',
              color: '#fff',
              fontSize: 9.5,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              padding: '3px 7px',
              borderRadius: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: '0 2px 10px rgba(229,89,29,0.5)',
            }}>
              Novo
            </span>
          )}
        </div>

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(8,8,11,0.98) 0%, rgba(8,8,11,0.45) 45%, transparent 100%)',
          transition: 'opacity 0.3s',
        }} />

        {/* Text Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '14px 12px 12px',
          zIndex: 10,
        }}>
          <h3 className="line-clamp-2" style={{ 
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600, 
            fontSize: 13, 
            color: hovered ? '#F58253' : '#fff',
            lineHeight: 1.35,
            transition: 'color 0.2s',
            margin: 0,
          }}>
            {title}
          </h3>
          {yearStr && (
            <p style={{ 
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500, 
              fontSize: 11, 
              color: 'rgba(255,255,255,0.45)', 
              marginTop: 4,
              margin: 0,
              marginBlockStart: 4,
            }}>
              {yearStr}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}