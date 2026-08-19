import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { tmdb } from '@lib/tmdb';
import SearchBar from './SearchBar';
import ContentCard from './ContentCard';
import SyncModal from './SyncModal';
import YoutubeModal from './YoutubeModal';
import EmbedCodePanel from '@features/admin/components/EmbedCodePanel';
import { Tv, Film, Sparkles, Youtube, Flame, Star, Users, History, Play, Share2, Plus } from 'lucide-react';

type Tab = 'trending' | 'top_rated' | 'family' | 'decades' | 'tv' | 'anime';

export interface SelectedContent {
  tmdbId: number | string;
  type: 'movie' | 'tv' | 'anime' | 'youtube';
  title: string;
  poster: string | null;
  season?: number;
  episode?: number;
  url?: string;
}

const GENRE_FILTERS: { id: number | null; label: string }[] = [
  { id: null,   label: 'Todos os Gêneros' },
  { id: 28,     label: 'Ação' },
  { id: 12,     label: 'Aventura' },
  { id: 35,     label: 'Comédia' },
  { id: 18,     label: 'Drama' },
  { id: 27,     label: 'Terror' },
  { id: 878,    label: 'Ficção Científica' },
  { id: 16,     label: 'Animação' },
  { id: 10751,  label: 'Família' },
  { id: 10749,  label: 'Romance' },
  { id: 53,     label: 'Suspense' },
];

const DECADE_FILTERS = [
  { label: '2020 - 2026', start: 2020, end: 2026 },
  { label: 'Anos 2010',   start: 2010, end: 2019 },
  { label: 'Anos 2000',   start: 2000, end: 2009 },
  { label: 'Anos 90',     start: 1990, end: 1999 },
  { label: 'Clássicos (70/80s)', start: 1970, end: 1989 },
];

const PANEL_STYLES = `
  @keyframes cp-glow-pulse {
    0%, 100% { opacity: .45; transform: scale(1); }
    50%      { opacity: .75; transform: scale(1.05); }
  }
  @keyframes cp-mesh-float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50%      { transform: translate(30px, -20px) rotate(5deg); }
  }

  .cp-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255,255,255,0.5);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    outline: none;
    white-space: nowrap;
  }
  .cp-tab:hover {
    color: rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.1);
  }
  .cp-tab.active {
    font-weight: 600;
    color: #fff;
    background: rgba(229,89,29,0.15);
    border-color: rgba(229,89,29,0.4);
    box-shadow: 0 0 24px rgba(229,89,29,0.18);
  }

  .cp-pill {
    padding: 7px 15px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.55);
    transition: all 0.2s ease;
    outline: none;
    white-space: nowrap;
  }
  .cp-pill:hover {
    color: #fff;
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.15);
  }
  .cp-pill.active {
    color: #F58253;
    background: rgba(229,89,29,0.12);
    border-color: rgba(229,89,29,0.4);
    font-weight: 600;
    box-shadow: 0 0 16px rgba(229,89,29,0.1);
  }

  .cp-yt-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 999px;
    background: linear-gradient(145deg, rgba(229,89,29,0.2), rgba(163,48,0,0.12));
    border: 1px solid rgba(229,89,29,0.35);
    color: #F58253; font-size: 13px; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer; transition: all 0.3s ease;
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    white-space: nowrap;
  }
  .cp-yt-btn:hover {
    background: linear-gradient(145deg, rgba(229,89,29,0.3), rgba(163,48,0,0.22));
    box-shadow: 0 0 28px rgba(229,89,29,0.4);
    transform: translateY(-1px);
    color: #fff;
    border-color: rgba(229,89,29,0.6);
  }

  .cp-load-more {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 32px; border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff; font-size: 14px; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer; transition: all 0.25s ease;
  }
  .cp-load-more:hover {
    background: rgba(229,89,29,0.15);
    border-color: rgba(229,89,29,0.4);
    color: #F58253;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 24px rgba(229,89,29,0.15);
  }
`;

export default function CatalogPanel() {
  const [tab, setTab] = useState<Tab>('trending');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedDecade, setSelectedDecade] = useState(DECADE_FILTERS[0]);
  const [page, setPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<SelectedContent | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  // Reset paginação ao trocar de aba ou filtro de época
  useEffect(() => {
    setPage(1);
    setAccumulatedItems([]);
  }, [tab, selectedDecade]);

  // Query do TMDB baseada na aba ativa e página
  const { data: tmdbData, isLoading } = useQuery({
    queryKey: ['catalog', tab, tab === 'decades' ? selectedDecade.label : null, page],
    queryFn: async () => {
      switch (tab) {
        case 'trending':
          return tmdb.getTrending('movie', 'week', page);
        case 'top_rated':
          return tmdb.getTopRated('movie', page);
        case 'family':
          return tmdb.getFamilyMovies(page);
        case 'decades':
          return tmdb.getByDecade(selectedDecade.start, selectedDecade.end, page);
        case 'tv':
          return tmdb.getTrending('tv', 'week', page);
        case 'anime':
          return tmdb.getAnimeTrending(page);
        default:
          return tmdb.getTrending('movie', 'week', page);
      }
    },
  });

  // Acumula itens conforme paginação
  useEffect(() => {
    if (tmdbData?.results) {
      if (page === 1) {
        setAccumulatedItems(tmdbData.results);
      } else {
        setAccumulatedItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newItems = tmdbData.results.filter((i: any) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [tmdbData, page]);

  // Filtragem dinâmica por gênero
  const filteredItems = useMemo(() => {
    if (!accumulatedItems.length) return [];
    if (!selectedGenre) return accumulatedItems;
    return accumulatedItems.filter((item: any) => item.genre_ids?.includes(selectedGenre));
  }, [accumulatedItems, selectedGenre]);

  // Destaque Hero Spotlight (primeiro item em alta com backdrop)
  const spotlightItem = useMemo(() => {
    if (!accumulatedItems.length) return null;
    return accumulatedItems.find((item: any) => item.backdrop_path && item.overview) || accumulatedItems[0];
  }, [accumulatedItems]);

  const handleSelect = useCallback((item: SelectedContent) => {
    setSelected(item);
  }, []);

  const TABS = [
    { key: 'trending'  as Tab, label: 'Em Alta',       icon: Flame },
    { key: 'top_rated' as Tab, label: 'Mais Votados',  icon: Star },
    { key: 'family'    as Tab, label: 'Para a Família', icon: Users },
    { key: 'decades'   as Tab, label: 'Por Época',     icon: History },
    { key: 'tv'        as Tab, label: 'Séries',        icon: Tv },
    { key: 'anime'     as Tab, label: 'Anime',         icon: Sparkles },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PANEL_STYLES }} />

      <div style={{ minHeight: '100vh', background: '#08080B', color: '#fff', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>

        {/* ── CINEMATIC AMBIENT MESH GLOWS ── */}
        <div style={{
          position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)',
          width: 1100, height: 600,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(229,89,29,.18) 0%, rgba(245,130,83,.06) 40%, transparent 75%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'cp-glow-pulse 8s ease-in-out infinite',
        }} />

        <div style={{
          position: 'absolute', top: 400, right: -150, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(163,48,0,.08) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'cp-mesh-float 12s ease-in-out infinite alternate',
        }} />

        {/* ── HEADER ── */}
        <header style={{ 
          position: 'relative', zIndex: 10,
          padding: '40px 5% 28px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(14,14,18,0.85) 0%, transparent 100%)',
          marginBottom: '28px',
        }}>
          <div style={{ maxWidth: 1440, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                  <div style={{ 
                    width: 4, 
                    height: 32, 
                    borderRadius: 2, 
                    background: 'linear-gradient(180deg, #F58253, #E5591D)',
                    boxShadow: '0 0 16px rgba(229,89,29,0.6)',
                  }} />
                  <h1 style={{ 
                    fontFamily: "'Syne', sans-serif", 
                    fontWeight: 800, 
                    fontSize: 30, 
                    letterSpacing: '-0.02em', 
                    margin: 0,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    StreamCast <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(229,89,29,0.18)', color: '#F58253', border: '1px solid rgba(229,89,29,0.35)', letterSpacing: '0.05em' }}>PRO</span>
                  </h1>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 0 18px', maxWidth: 540 }}>
                  Catálogo cinematográfico com filmes de todas as décadas, mais votados e sincronização em tempo real.
                </p>
              </div>

              {/* SearchBar */}
              <div style={{ width: '100%', maxWidth: 440 }}>
                <SearchBar onSelect={handleSelect} />
              </div>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main style={{ maxWidth: 1440, margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 1 }}>

          {/* ── HERO SPOTLIGHT BANNER ── */}
          {spotlightItem && (
            <div style={{
              position: 'relative',
              borderRadius: 24,
              overflow: 'hidden',
              marginBottom: 36,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#121217',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              minHeight: 320,
              display: 'flex',
              alignItems: 'flex-end',
            }}>
              {/* Backdrop image */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(https://image.tmdb.org/t/p/original${spotlightItem.backdrop_path || spotlightItem.poster_path})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 25%',
                filter: 'brightness(0.65)',
              }} />

              {/* Gradient Vignette */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(8,8,11,0.96) 0%, rgba(8,8,11,0.7) 45%, rgba(8,8,11,0.2) 100%), linear-gradient(0deg, rgba(8,8,11,0.98) 0%, transparent 60%)',
              }} />

              {/* Spotlight Content */}
              <div style={{ position: 'relative', zIndex: 10, padding: '36px 40px', maxWidth: 680 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(229,89,29,0.25)', border: '1px solid rgba(229,89,29,0.4)', color: '#F58253', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  <Flame size={13} />
                  Destaque da Semana
                </div>

                <h2 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1.15,
                  margin: '0 0 12px',
                  letterSpacing: '-0.02em',
                }}>
                  {spotlightItem.title ?? spotlightItem.name}
                </h2>

                {spotlightItem.overview && (
                  <p style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.6,
                    margin: '0 0 20px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {spotlightItem.overview}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleSelect({
                      tmdbId: spotlightItem.id,
                      type: tab === 'tv' ? 'tv' : tab === 'anime' ? 'anime' : 'movie',
                      title: spotlightItem.title ?? spotlightItem.name,
                      poster: spotlightItem.poster_path ? `https://image.tmdb.org/t/p/w500${spotlightItem.poster_path}` : null,
                      season: tab === 'tv' ? 1 : undefined,
                      episode: tab === 'tv' ? 1 : undefined,
                    })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 24px',
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #F58253, #E5591D)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(229,89,29,0.4)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Play size={16} fill="#fff" />
                    Assistir Agora
                  </button>

                  <button
                    onClick={() => handleSelect({
                      tmdbId: spotlightItem.id,
                      type: tab === 'tv' ? 'tv' : tab === 'anime' ? 'anime' : 'movie',
                      title: spotlightItem.title ?? spotlightItem.name,
                      poster: spotlightItem.poster_path ? `https://image.tmdb.org/t/p/w500${spotlightItem.poster_path}` : null,
                      season: tab === 'tv' ? 1 : undefined,
                      episode: tab === 'tv' ? 1 : undefined,
                    })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 20px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Share2 size={15} />
                    Sincronizar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TABS BAR ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
              {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setTab(key); setSelectedGenre(null); }}
                    className={`cp-tab${isActive ? ' active' : ''}`}
                  >
                    <Icon size={15} style={{ color: isActive ? '#F58253' : 'currentColor' }} />
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowYoutubeModal(true)}
              className="cp-yt-btn"
            >
              <Youtube size={16} />
              Tocar YouTube
            </button>
          </div>

          {/* ── DECADE FILTERS (quando na aba Por Época) ── */}
          {tab === 'decades' && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16, scrollbarWidth: 'none' }}>
              {DECADE_FILTERS.map((decade) => {
                const isActive = selectedDecade.label === decade.label;
                return (
                  <button
                    key={decade.label}
                    onClick={() => setSelectedDecade(decade)}
                    className={`cp-pill${isActive ? ' active' : ''}`}
                  >
                    {decade.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── GENRE FILTERS ── */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 24, scrollbarWidth: 'none' }}>
            {GENRE_FILTERS.map((genre) => {
              const isActive = selectedGenre === genre.id;
              return (
                <button
                  key={genre.label}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`cp-pill${isActive ? ' active' : ''}`}
                >
                  {genre.label}
                </button>
              );
            })}
          </div>

          {/* ── COUNTER & STATUS ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
              {isLoading && page === 1 ? 'Buscando catálogo no TMDB...' : `${filteredItems.length} títulos encontrados nesta seleção`}
            </span>
          </div>

          {/* ── CARDS GRID ── */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
            gap: 24,
            marginBottom: 48
          }}>
            {isLoading && page === 1 ? (
              Array.from({ length: 18 }).map((_, i) => (
                <div 
                  key={i} 
                  className="skeleton-shimmer"
                  style={{ 
                    aspectRatio: '2/3', 
                    borderRadius: 18, 
                    border: '1px solid rgba(255,255,255,0.04)',
                  }} 
                />
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item: any, i: number) => {
                const isTv = tab === 'tv' || tab === 'anime' || Boolean(item.first_air_date);
                return (
                  <ContentCard 
                    key={`${item.id}-${i}`}
                    item={item} 
                    index={i}
                    type={isTv ? 'tv' : 'movie'}
                    onClick={() => handleSelect({ 
                      tmdbId: item.id, 
                      type: isTv ? 'tv' : 'movie', 
                      title: item.title ?? item.name ?? 'Sem título', 
                      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null, 
                      season: isTv ? 1 : undefined, 
                      episode: isTv ? 1 : undefined,
                    })} 
                  />
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <Film size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>Nenhum conteúdo encontrado para este filtro.</p>
              </div>
            )}
          </div>

          {/* ── LOAD MORE BUTTON (PAGINAÇÃO DINÂMICA) ── */}
          {filteredItems.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 80 }}>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={isLoading}
                className="cp-load-more"
              >
                {isLoading ? (
                  <>Carregando mais títulos...</>
                ) : (
                  <>
                    <Plus size={16} />
                    Carregar Mais Títulos (Página {page + 1})
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── INTEGRAÇÃO EXTERNA ── */}
          <div style={{ 
            marginTop: 20, 
            paddingTop: 48, 
            borderTop: '1px solid rgba(229,89,29,0.08)',
            marginBottom: 80,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(229,89,29,0.4), transparent)',
            }} />
            <h2 style={{ 
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(245,130,83,0.55)',
              marginBottom: 24,
            }}>
              Integração Externa
            </h2>
            <EmbedCodePanel />
          </div>
        </main>

        {/* ── MODAIS ── */}
        <AnimatePresence>
          {selected && (
            <SyncModal 
              content={selected} 
              onClose={() => setSelected(null)} 
            />
          )}
          {showYoutubeModal && (
            <YoutubeModal 
              onClose={() => setShowYoutubeModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}