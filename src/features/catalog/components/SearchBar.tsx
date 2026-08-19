import { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tmdb } from '@lib/tmdb';
import { SelectedContent } from './CatalogPanel';

interface SearchBarProps {
  onSelect: (item: SelectedContent) => void;
}

interface SearchResult {
  id: number;
  title: string;
  year: string;
  type: 'movie' | 'tv';
  poster: string | null;
  backdrop: string | null;
  rating: string | null;
  overview: string;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setFocusedIndex(-1);
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setIsOpen(true);
      try {
        const data = await tmdb.searchMulti(query);
        const filtered: SearchResult[] = (data.results || [])
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item: any) => ({
            id: item.id,
            title: item.title ?? item.name ?? 'Sem título',
            year: (item.release_date ?? item.first_air_date ?? '').split('-')[0],
            type: item.media_type as 'movie' | 'tv',
            poster: item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w300') : null,
            backdrop: item.backdrop_path ? tmdb.getImageUrl(item.backdrop_path, 'w500') : null,
            rating: item.vote_average ? Number(item.vote_average).toFixed(1) : null,
            overview: item.overview || '',
          }));
        setResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResult) => {
    onSelect({
      tmdbId: item.id,
      type: item.type,
      title: item.title,
      poster: item.poster || item.backdrop,
      season: item.type === 'tv' ? 1 : undefined,
      episode: item.type === 'tv' ? 1 : undefined,
    });
    setIsOpen(false);
    setQuery('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && results[focusedIndex]) {
        handleSelect(results[focusedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  const getBadgeConfig = (type: string) => {
    if (type === 'tv') {
      return { bg: 'rgba(245,130,83,0.15)', text: '#F58253', label: 'Série' };
    }
    return { bg: 'rgba(229,89,29,0.15)', text: '#E5591D', label: 'Filme' };
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      {/* Search Input Container */}
      <div 
        onClick={() => inputRef.current?.focus()}
        style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center',
          background: isFocused ? 'rgba(229,89,29,0.06)' : 'rgba(255,255,255,0.04)',
          border: isFocused ? '1px solid rgba(229,89,29,0.5)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '4px 8px 4px 6px',
          boxShadow: isFocused ? '0 0 24px rgba(229,89,29,0.2), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Glowing Search Icon Button */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isFocused ? 'linear-gradient(135deg, #F58253, #E5591D)' : 'rgba(229,89,29,0.15)',
          border: '1px solid rgba(229,89,29,0.3)',
          color: isFocused ? '#fff' : '#F58253',
          boxShadow: isFocused ? '0 0 16px rgba(229,89,29,0.4)' : 'none',
          transition: 'all 0.25s ease',
          flexShrink: 0,
        }}>
          <Search size={18} strokeWidth={2.5} />
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar filmes, séries ou animes..."
          onFocus={() => { setIsFocused(true); query.trim() && setIsOpen(true); }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: 40,
            background: 'transparent',
            border: 'none',
            paddingLeft: 12,
            paddingRight: 10,
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
          }}
        />

        {/* Clear button or shortcut badge */}
        {query ? (
          <button
            onClick={(e) => { e.stopPropagation(); setQuery(''); setResults([]); setIsOpen(false); inputRef.current?.focus(); }}
            style={{
              padding: 6,
              borderRadius: 8,
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.04em',
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}>
            BUSCAR
          </span>
        )}
      </div>

      {/* Floating Dropdown Results */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'rgba(14, 14, 18, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(229,89,29,0.1)',
              overflow: 'hidden',
              zIndex: 100,
              maxHeight: 440,
              overflowY: 'auto',
            }}
          >
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(229,89,29,0.3)', borderTopColor: '#E5591D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Buscando no catálogo...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : results.length > 0 ? (
              <div style={{ padding: '8px 0' }}>
                {results.map((result, index) => {
                  const badge = getBadgeConfig(result.type);
                  const isItemFocused = focusedIndex === index;
                  const posterSrc = result.poster || result.backdrop;
                  
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '10px 16px',
                        cursor: 'pointer',
                        background: isItemFocused ? 'rgba(229,89,29,0.12)' : 'transparent',
                        borderLeft: isItemFocused ? '3px solid #E5591D' : '3px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Poster Thumbnail */}
                      <div style={{ 
                        width: 42, 
                        height: 60, 
                        borderRadius: 10, 
                        overflow: 'hidden', 
                        background: '#1a1a22', 
                        flexShrink: 0, 
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                      }}>
                        {posterSrc ? (
                          <img 
                            src={posterSrc} 
                            alt={result.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Film size={18} style={{ color: '#E5591D', opacity: 0.6 }} />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ color: isItemFocused ? '#F58253' : '#fff', fontSize: 13.5, fontWeight: 600, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {result.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ 
                            padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                            background: badge.bg, color: badge.text,
                            border: `1px solid ${badge.text}40`
                          }}>
                            {badge.label}
                          </span>
                          {result.year && (
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500 }}>
                              {result.year}
                            </span>
                          )}
                          {result.rating && Number(result.rating) > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#FFD700', fontSize: 11, fontWeight: 700 }}>
                              <Star size={10} fill="#FFD700" color="#FFD700" />
                              {result.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Nenhum título encontrado para "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}