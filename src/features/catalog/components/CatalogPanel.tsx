import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { tmdb } from '@lib/tmdb';
import SearchBar from './SearchBar';
import ContentCard from './ContentCard';
import SyncModal from './SyncModal';
import YoutubeModal from './YoutubeModal';
import EmbedCodePanel from '@features/admin/components/EmbedCodePanel';
import { Radio, Tv, Film, Flame, Sparkles } from 'lucide-react';

type Tab = 'movies' | 'tv' | 'anime' | 'live';

// SVGs estilizados para TV Aberta / Fechada
const SBT_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="%23000"><rect width="400" height="600" fill="%230F172A"/><circle cx="200" cy="300" r="140" fill="url(%23g)"/><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2338BDF8"/><stop offset="50%" stop-color="%236366F1"/><stop offset="100%" stop-color="%23EC4899"/></linearGradient></defs><text x="200" y="318" fill="%23FFF" font-family="Arial,sans-serif" font-weight="bold" font-size="64" text-anchor="middle">SBT</text><text x="200" y="360" fill="%23E2E8F0" font-family="Arial,sans-serif" font-weight="600" font-size="20" text-anchor="middle">AO VIVO</text></svg>';

const RECORD_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="%23000"><rect width="400" height="600" fill="%2318181B"/><circle cx="200" cy="300" r="140" fill="url(%23gr)" stroke="%2338BDF8" stroke-width="8"/><defs><linearGradient id="gr" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230284C7"/><stop offset="100%" stop-color="%231E3A8A"/></linearGradient></defs><text x="200" y="315" fill="%23FFF" font-family="Arial,sans-serif" font-weight="bold" font-size="44" text-anchor="middle">RECORD</text><text x="200" y="355" fill="%2393C5FD" font-family="Arial,sans-serif" font-weight="600" font-size="18" text-anchor="middle">HD DIGITAL</text></svg>';

const BAND_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="%23000"><rect width="400" height="600" fill="%23171717"/><circle cx="200" cy="300" r="140" fill="url(%23gb)"/><defs><linearGradient id="gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2316A34A"/><stop offset="100%" stop-color="%23065F46"/></linearGradient></defs><text x="200" y="315" fill="%23FFF" font-family="Arial,sans-serif" font-weight="bold" font-size="52" text-anchor="middle">BAND</text><text x="200" y="355" fill="%2386EFAC" font-family="Arial,sans-serif" font-weight="600" font-size="18" text-anchor="middle">NACIONAL</text></svg>';

const REDETV_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="%23000"><rect width="400" height="600" fill="%231E1B4B"/><circle cx="200" cy="300" r="140" fill="url(%23grt)"/><defs><linearGradient id="grt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238B5CF6"/><stop offset="100%" stop-color="%23C026D3"/></linearGradient></defs><text x="200" y="315" fill="%23FFF" font-family="Arial,sans-serif" font-weight="bold" font-size="44" text-anchor="middle">REDETV!</text><text x="200" y="355" fill="%23DDD6FE" font-family="Arial,sans-serif" font-weight="600" font-size="18" text-anchor="middle">AO VIVO</text></svg>';

const LIVE_CHANNELS = [
  {
    id: 'live_sbt',
    title: 'SBT (Ao Vivo)',
    url: 'https://sbt-sp-live.ssl.cdn.sbt.com.br/sbt-hls/master.m3u8',
    poster_path: SBT_SVG,
    genre_ids: [10770],
  },
  {
    id: 'live_record',
    title: 'Record TV (Ao Vivo)',
    url: 'https://svs.itworkscdn.net/recordtvbrsp/recordtvbrsp.smil/playlist.m3u8',
    poster_path: RECORD_SVG,
    genre_ids: [10770],
  },
  {
    id: 'live_band',
    title: 'Band (Ao Vivo)',
    url: 'https://video01.tvpp.tv/band_nacional/video.m3u8',
    poster_path: BAND_SVG,
    genre_ids: [10770],
  },
  {
    id: 'live_redetv',
    title: 'RedeTV! (Ao Vivo)',
    url: 'https://video01.tvpp.tv/redetv/video.m3u8',
    poster_path: REDETV_SVG,
    genre_ids: [10770],
  }
];

export interface SelectedContent {
  tmdbId: number | string;
  type: 'movie' | 'tv' | 'anime' | 'direct';
  title: string;
  poster: string | null;
  season?: number;
  episode?: number;
  url?: string;
}

const GENRE_FILTERS: { id: number | null; label: string }[] = [
  { id: null, label: 'Todos' },
  { id: 28,   label: 'Ação' },
  { id: 35,   label: 'Comédia' },
  { id: 18,   label: 'Drama' },
  { id: 27,   label: 'Terror' },
  { id: 878,  label: 'Ficção Científica' },
  { id: 16,   label: 'Animação' },
  { id: 10749, label: 'Romance' },
  { id: 53,   label: 'Suspense' },
];

const PANEL_STYLES = `
  @keyframes cp-glow-pulse {
    0%, 100% { opacity: .55; }
    50%      { opacity: .85; }
  }
  @keyframes cp-line-in {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes cp-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .cp-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255,255,255,0.45);
    transition: all 0.25s ease;
    outline: none;
    position: relative;
  }
  .cp-tab:hover {
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
  }
  .cp-tab.active {
    font-weight: 600;
    color: #fff;
    background: rgba(229,89,29,0.12);
    border-color: rgba(229,89,29,0.35);
    box-shadow: 0 0 24px rgba(229,89,29,0.12);
  }

  .cp-genre-pill {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.5);
    transition: all 0.2s ease;
    outline: none;
  }
  .cp-genre-pill:hover {
    color: #fff;
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.15);
  }
  .cp-genre-pill.active {
    color: #E5591D;
    background: rgba(229,89,29,0.12);
    border-color: rgba(229,89,29,0.35);
    font-weight: 600;
  }

  .cp-yt-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 999px;
    background: linear-gradient(145deg, rgba(229,89,29,0.15), rgba(163,48,0,0.1));
    border: 1px solid rgba(229,89,29,0.3);
    color: #F58253; font-size: 13px; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer; transition: all 0.3s ease;
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  }
  .cp-yt-btn:hover {
    background: linear-gradient(145deg, rgba(229,89,29,0.25), rgba(163,48,0,0.2));
    box-shadow: 0 0 28px rgba(229,89,29,0.35);
    transform: translateY(-1px);
    color: #fff;
    border-color: rgba(229,89,29,0.5);
  }
`;

export default function CatalogPanel() {
  const [tab, setTab] = useState<Tab>('movies');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selected, setSelected] = useState<SelectedContent | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  const { data: movies, isLoading: loadingMovies } = useQuery({
    queryKey: ['trending', 'movie'],
    queryFn: () => tmdb.getTrending('movie', 'week'),
    enabled: tab === 'movies',
  });

  const { data: series, isLoading: loadingSeries } = useQuery({
    queryKey: ['trending', 'tv'],
    queryFn: () => tmdb.getTrending('tv', 'week'),
    enabled: tab === 'tv',
  });

  const { data: anime, isLoading: loadingAnime } = useQuery({
    queryKey: ['trending', 'anime'],
    queryFn: () => tmdb.getAnimeTrending(), 
    enabled: tab === 'anime',
  });

  const isLoading = (tab !== 'live') && (loadingMovies || loadingSeries || loadingAnime);
  
  const rawItems = tab === 'movies' ? movies?.results 
                 : tab === 'tv'     ? series?.results 
                 : tab === 'anime'  ? anime?.results
                 : LIVE_CHANNELS;

  // Filtragem dinâmica por gênero
  const filteredItems = useMemo(() => {
    if (!rawItems) return [];
    if (!selectedGenre || tab === 'live') return rawItems;
    return rawItems.filter((item: any) => item.genre_ids?.includes(selectedGenre));
  }, [rawItems, selectedGenre, tab]);

  const handleSelect = useCallback((item: SelectedContent) => {
    setSelected(item);
  }, []);

  const TABS = [
    { key: 'movies' as Tab, label: 'Filmes', icon: Film },
    { key: 'tv'     as Tab, label: 'Séries', icon: Tv },
    { key: 'anime'  as Tab, label: 'Anime',  icon: Sparkles },
    { key: 'live'   as Tab, label: 'TV Ao Vivo', icon: Radio },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PANEL_STYLES }} />

      <div style={{ minHeight: '100vh', background: '#0A0A0C', color: '#fff', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>

        {/* ── TOP AMBIENT GLOW ── */}
        <div style={{
          position: 'absolute', top: -180, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 500,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(229,89,29,.16) 0%, rgba(245,130,83,.06) 35%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'cp-glow-pulse 6s ease-in-out infinite',
        }} />

        {/* ── HEADER ── */}
        <header style={{ 
          position: 'relative', zIndex: 10,
          padding: '44px 5% 32px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(20,20,24,0.7) 0%, transparent 100%)',
          marginBottom: '32px',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(229,89,29,.4) 30%, rgba(245,130,83,.7) 50%, rgba(229,89,29,.4) 70%, transparent)',
            animation: 'cp-line-in .8s cubic-bezier(.16,1,.3,1) forwards',
            transformOrigin: 'center',
          }} />

          <div style={{ maxWidth: 1440, margin: '0 auto', animation: 'cp-fade-in .6s ease forwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <div style={{ 
                width: 4, 
                height: 32, 
                borderRadius: 2, 
                background: 'linear-gradient(180deg, #F58253, #E5591D)',
                boxShadow: '0 0 16px rgba(229,89,29,0.5)',
              }} />
              <h1 style={{ 
                fontFamily: "'Syne', sans-serif", 
                fontWeight: 800, 
                fontSize: 32, 
                letterSpacing: '-0.02em', 
                margin: 0,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                StreamCast <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(229,89,29,0.15)', color: '#E5591D', border: '1px solid rgba(229,89,29,0.3)', letterSpacing: '0.05em' }}>PRO</span>
              </h1>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: '0 0 24px 18px', maxWidth: 640 }}>
              Catálogo interativo com sincronização cross-origin em tempo real para web e embeds externos.
            </p>

            <div style={{ maxWidth: 600, marginLeft: 18 }}>
              <SearchBar onSelect={handleSelect} />
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main style={{ maxWidth: 1440, margin: '0 auto', padding: '0 5%', position: 'relative', zIndex: 0 }}>
          
          {/* Main Navigation Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 999, border: '1px solid rgba(255,255,255,0.05)' }}>
              {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setTab(key); setSelectedGenre(null); }}
                    className={`cp-tab${isActive ? ' active' : ''}`}
                  >
                    <Icon size={15} style={{ color: isActive ? '#E5591D' : 'currentColor' }} />
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowYoutubeModal(true)}
              className="cp-yt-btn"
            >
              <Flame size={16} />
              Tocar YouTube
            </button>
          </div>

          {/* Genre Filters (when in movies, tv, anime) */}
          {tab !== 'live' && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 28, scrollbarWidth: 'none' }}>
              {GENRE_FILTERS.map((genre) => {
                const isActive = selectedGenre === genre.id;
                return (
                  <button
                    key={genre.label}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`cp-genre-pill${isActive ? ' active' : ''}`}
                  >
                    {genre.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Items Counter Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {isLoading ? 'Carregando catálogo...' : `${filteredItems.length} títulos disponíveis`}
            </span>
          </div>

          {/* Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', 
            gap: 28,
            marginBottom: 80
          }}>
            {isLoading ? (
              Array.from({ length: 18 }).map((_, i) => (
                <div 
                  key={i} 
                  className="skeleton-shimmer"
                  style={{ 
                    aspectRatio: '2/3', 
                    borderRadius: 16, 
                    border: '1px solid rgba(255,255,255,0.04)',
                  }} 
                />
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item: any, i: number) => {
                const isLive = tab === 'live';
                return (
                  <ContentCard 
                    key={item.id}
                    item={item} 
                    index={i}
                    type={isLive ? 'tv' : tab === 'movies' ? 'movie' : 'tv'}
                    onClick={() => handleSelect({ 
                      tmdbId: item.id, 
                      type: isLive ? 'direct' : tab === 'movies' ? 'movie' : tab === 'tv' ? 'tv' : 'anime', 
                      title: item.title ?? item.name ?? 'Sem título', 
                      poster: isLive 
                        ? item.poster_path 
                        : item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null, 
                      season: (tab !== 'movies' && !isLive) ? 1 : undefined, 
                      episode: (tab !== 'movies' && !isLive) ? 1 : undefined,
                      url: item.url
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

          {/* Integração Externa */}
          <div style={{ 
            marginTop: 40, 
            paddingTop: 48, 
            borderTop: '1px solid rgba(229,89,29,0.08)',
            marginBottom: 80,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(229,89,29,0.3), transparent)',
            }} />
            <h2 style={{ 
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 11,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              color: 'rgba(245,130,83,0.5)',
              marginBottom: 24,
            }}>
              Integração Externa
            </h2>
            <EmbedCodePanel />
          </div>
        </main>

        {/* MODAIS */}
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