import { useState, useEffect, useRef } from 'react';
import { Search, X, Film } from 'lucide-react';
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
  type: 'movie' | 'tv' | 'anime';
  poster: string | null;
  overview: string;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
        const filtered = data.results
          .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item: any) => ({
            id: item.id,
            title: item.title ?? item.name,
            year: (item.release_date ?? item.first_air_date ?? '').split('-')[0],
            type: item.media_type as 'movie' | 'tv',
            poster: item.poster_path,
            overview: item.overview,
          }));
        setResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

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
      type: item.type === 'movie' ? 'movie' : 'tv',
      title: item.title,
      poster: item.poster ? tmdb.getImageUrl(item.poster, 'w300') : null,
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
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      movie: { bg: 'rgba(229,89,29,0.12)', text: '#E5591D', label: 'Filme' },
      tv:    { bg: 'rgba(245,130,83,0.12)', text: '#F58253', label: 'Série' },
      anime: { bg: 'rgba(186,117,23,0.12)', text: '#BA7517', label: 'Anime' },
    };
    return configs[type] || configs.movie;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      {/* Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: 16, 
            color: isFocused ? '#E5591D' : 'rgba(255,255,255,0.35)',
            transition: 'color 0.2s',
            pointerEvents: 'none'
          }} 
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar filmes, séries ou animes..."
          onFocus={() => { setIsFocused(true); query.trim() && setIsOpen(true); }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: 48,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: isFocused ? '1px solid rgba(229,89,29,0.4)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            paddingLeft: 46,
            paddingRight: 44,
            color: '#fff',
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isFocused ? '0 0 20px rgba(229,89,29,0.1)' : 'none',
          }}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
              style={{
                position: 'absolute',
                right: 12,
                padding: 6,
                borderRadius: 8,
                color: 'rgba(255,255,255,0.4)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#141418',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              maxHeight: '65vh',
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {isLoading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-shimmer" style={{ height: 56, borderRadius: 12 }} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div style={{ padding: '8px 0' }}>
                {results.map((result, index) => {
                  const badge = getBadgeConfig(result.type);
                  const focused = focusedIndex === index;
                  
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '10px 16px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: focused ? 'rgba(255,255,255,0.08)' : 'transparent',
                      }}
                    >
                      <div style={{ 
                        width: 40, height: 56, borderRadius: 8, overflow: 'hidden', 
                        background: '#1a1a22', flexShrink: 0, 
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {result.poster ? (
                          <img 
                            src={result.poster.startsWith('http') ? result.poster : tmdb.getImageUrl(result.poster, 'w200')} 
                            alt={result.title} 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5591D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 7 4-7 4Z"/></svg>';
                              }
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Film size={18} style={{ color: '#E5591D', opacity: 0.6 }} />
                        )}
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                        <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                          {result.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ 
                            padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: badge.bg, color: badge.text,
                            border: `1px solid ${badge.text}30`
                          }}>
                            {badge.label}
                          </span>
                          {result.year && (
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{result.year}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <Search size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ fontSize: 13 }}>Nenhum resultado encontrado</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}