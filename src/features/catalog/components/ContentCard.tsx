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
  const [imageError, setImageError] = useState(false);
  const title = item.title ?? item.name ?? 'Sem título';
  
  let posterUrl = item.thumbnail || item.poster || item.poster_path;
  if (item.poster_path && !item.poster_path.startsWith('http')) {
    posterUrl = tmdb.getImageUrl(item.poster_path, 'w500');
  }

  const yearStr = item.release_date?.split('-')[0] ?? item.first_air_date?.split('-')[0] ?? item.year ?? '';
  const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : null;
  const year = parseInt(yearStr, 10);
  const isNew = year >= 2025;

  const delay = Math.min(index * 0.02, 0.25);

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
        border: hovered ? '1px solid rgba(229,89,29,0.45)' : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
        transform: hovered ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: hovered 
          ? '0 24px 48px rgba(0,0,0,0.6), 0 0 32px rgba(229,89,29,0.15)' 
          : '0 4px 16px rgba(0,0,0,0.3)',
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

        {/* Top Badges (Rating & Novo) */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          {rating && Number(rating) > 0 ? (
            <span style={{
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFD700',
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              <Star size={10} fill="#FFD700" color="#FFD700" />
              {rating}
            </span>
          ) : <div />}

          {isNew && (
            <span style={{
              background: 'rgba(229,89,29,0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              fontSize: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: '0 2px 10px rgba(229,89,29,0.4)',
            }}>
              Novo
            </span>
          )}
        </div>

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,12,0.98) 0%, rgba(10,10,12,0.5) 40%, transparent 100%)',
          transition: 'opacity 0.3s',
        }} />

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
            fontWeight: 600, 
            fontSize: 13, 
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
              fontWeight: 500, 
              fontSize: 11, 
              color: 'rgba(255,255,255,0.45)', 
              marginTop: 5,
              margin: 0,
              marginBlockStart: 5,
            }}>
              {yearStr}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}