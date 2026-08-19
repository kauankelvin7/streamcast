import { useState } from 'react';
import { Film } from 'lucide-react';
import { tmdb } from '@lib/tmdb';

interface Props {
  item: any;
  type?: 'movie' | 'tv';
  onClick: () => void;
  index?: number;
}

export default function ContentCard({ item, onClick, index = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const title = item.title ?? item.name;
  let posterUrl = item.thumbnail || item.poster || item.poster_path;
  if (item.poster_path && !item.poster_path.startsWith('http')) {
    posterUrl = tmdb.getImageUrl(item.poster_path, 'w500');
  }
  const yearStr = item.release_date?.split('-')[0] ?? item.first_air_date?.split('-')[0] ?? item.year ?? '';
  const year = parseInt(yearStr, 10);
  const isNew = year >= 2026;

  const delay = Math.min(index * 0.03, 0.3);

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
        borderRadius: 16,
        overflow: 'hidden',
        background: '#141418',
        border: hovered ? '1px solid rgba(229,89,29,0.3)' : '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
        transform: hovered ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: hovered 
          ? '0 24px 48px rgba(0,0,0,0.4), 0 0 30px rgba(229,89,29,0.1)' 
          : '0 2px 8px rgba(0,0,0,0.2)',
        opacity: 0,
        animationDelay: `${delay}s`,
        outline: 'none',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '2/3', width: '100%', background: '#0A0A0C' }}>
        {posterUrl && !imageError ? (
          <img 
            src={posterUrl} 
            alt={title} 
            onError={() => setImageError(true)}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }} 
            loading="lazy"
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'linear-gradient(135deg, #18181D 0%, #0F0F12 100%)',
            color: 'rgba(255,255,255,0.15)',
            gap: 10
          }}>
            <Film size={36} strokeWidth={1.5} style={{ color: '#E5591D', opacity: 0.5 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0 12px' }}>{title}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,12,0.95) 0%, rgba(10,10,12,0.4) 50%, transparent 100%)',
          transition: 'opacity 0.3s',
        }} />

        {/* Badge NOVO */}
        {isNew && (
          <span style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 10,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            Novo
          </span>
        )}

        {/* Text Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 14px 14px',
          zIndex: 10,
        }}>
          <h3 className="line-clamp-2" style={{ 
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500, 
            fontSize: 14, 
            color: hovered ? '#E5591D' : '#fff',
            lineHeight: 1.35,
            transition: 'color 0.25s',
            margin: 0,
          }}>
            {title}
          </h3>
          {yearStr && (
            <p style={{ 
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400, 
              fontSize: 12, 
              color: 'rgba(255,255,255,0.4)', 
              marginTop: 6,
              margin: 0,
              marginBlockStart: 6,
            }}>
              {yearStr}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}