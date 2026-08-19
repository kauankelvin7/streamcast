import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { tmdb } from '@lib/tmdb';
import SearchBar from './SearchBar';
import ContentRow from './ContentRow';
import SyncModal from './SyncModal';
import YoutubeModal from './YoutubeModal';
import EmbedCodePanel from '@features/admin/components/EmbedCodePanel';
import SurpriseBoxButton from './SurpriseBoxButton';
import { Tv, Film, Sparkles, Youtube, Flame, Star, Users, History, Play, Share2 } from 'lucide-react';

type Tab = 'home' | 'top_rated' | 'family' | 'decades' | 'tv' | 'anime';

export interface SelectedContent {
  tmdbId: number | string;
  type: 'movie' | 'tv' | 'anime' | 'youtube';
  title: string;
  poster: string | null;
  season?: number;
  episode?: number;
  url?: string;
}

const PANEL_STYLES = `
  @keyframes cp-glow-pulse {
    0%, 100% { opacity: .45; transform: scale(1); }
    50%      { opacity: .75; transform: scale(1.04); }
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
    color: rgba(255,255,255,0.55);
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
    background: rgba(229,89,29,0.16);
    border-color: rgba(229,89,29,0.4);
    box-shadow: 0 0 24px rgba(229,89,29,0.2);
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
`;

export default function CatalogPanel() {
  const [tab, setTab] = useState<Tab>('home');
  const [selected, setSelected] = useState<SelectedContent | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  // Queries para as diferentes seções deslizantes
  const { data: trendingMovies, isLoading: loadingTrending } = useQuery({
    queryKey: ['catalog', 'trending'],
    queryFn: () => tmdb.getTrending('movie', 'week'),
  });

  const { data: topRatedMovies, isLoading: loadingTopRated } = useQuery({
    queryKey: ['catalog', 'top_rated'],
    queryFn: () => tmdb.getTopRated('movie', 1),
  });

  const { data: familyMovies, isLoading: loadingFamily } = useQuery({
    queryKey: ['catalog', 'family'],
    queryFn: () => tmdb.getFamilyMovies(1),
  });

  const { data: recentDecade, isLoading: loadingRecentDecade } = useQuery({
    queryKey: ['catalog', 'decades', '2020'],
    queryFn: () => tmdb.getByDecade(2020, 2026, 1),
  });

  const { data: classicDecade, isLoading: loadingClassicDecade } = useQuery({
    queryKey: ['catalog', 'decades', 'classics'],
    queryFn: () => tmdb.getByDecade(1990, 2009, 1),
  });

  const { data: tvSeries, isLoading: loadingTv } = useQuery({
    queryKey: ['catalog', 'tv'],
    queryFn: () => tmdb.getTrending('tv', 'week', 1),
  });

  const { data: animeData, isLoading: loadingAnime } = useQuery({
    queryKey: ['catalog', 'anime'],
    queryFn: () => tmdb.getAnimeTrending(1),
  });

  // Combina todos os filmes carregados para a Caixa Misteriosa
  const allMoviesForSurprise = useMemo(() => {
    const lists = [
      trendingMovies?.results,
      topRatedMovies?.results,
      familyMovies?.results,
      recentDecade?.results,
      classicDecade?.results,
    ];
    const seen = new Set<number>();
    const merged: any[] = [];
    for (const list of lists) {
      if (!list) continue;
      for (const item of list) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }
    return merged;
  }, [trendingMovies, topRatedMovies, familyMovies, recentDecade, classicDecade]);

  // Spotlight do Destaque da Semana
  const spotlightItem = useMemo(() => {
    const list = trendingMovies?.results || [];
    return list.find((item: any) => item.backdrop_path && item.poster_path && item.overview && item.overview.length > 20)
      || list[0]
      || null;
  }, [trendingMovies]);

  const spotlightBackdropUrl = useMemo(() => {
    if (!spotlightItem) return null;
    return spotlightItem.backdrop_path 
      ? tmdb.getImageUrl(spotlightItem.backdrop_path, 'original') 
      : (spotlightItem.poster_path ? tmdb.getImageUrl(spotlightItem.poster_path, 'original') : null);
  }, [spotlightItem]);

  const spotlightPosterUrl = useMemo(() => {
    if (!spotlightItem) return null;
    return spotlightItem.poster_path 
      ? tmdb.getImageUrl(spotlightItem.poster_path, 'w500') 
      : spotlightBackdropUrl;
  }, [spotlightItem, spotlightBackdropUrl]);

  const handleSelect = useCallback((item: SelectedContent) => {
    setSelected(item);
  }, []);

  const handleItemClick = useCallback((item: any, isTv: boolean = false) => {
    const poster = item.poster_path 
      ? tmdb.getImageUrl(item.poster_path, 'w500') 
      : (item.backdrop_path ? tmdb.getImageUrl(item.backdrop_path, 'w780') : null);

    handleSelect({
      tmdbId: item.id,
      type: isTv ? 'tv' : 'movie',
      title: item.title ?? item.name ?? 'Sem título',
      poster,
      season: isTv ? 1 : undefined,
      episode: isTv ? 1 : undefined,
    });
  }, [handleSelect]);

  const TABS = [
    { key: 'home'      as Tab, label: 'Catálogo Completo', icon: Flame },
    { key: 'top_rated' as Tab, label: 'Mais Votados',      icon: Star },
    { key: 'family'    as Tab, label: 'Para a Família',    icon: Users },
    { key: 'decades'   as Tab, label: 'Por Época',         icon: History },
    { key: 'tv'        as Tab, label: 'Séries',            icon: Tv },
    { key: 'anime'     as Tab, label: 'Anime',             icon: Sparkles },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PANEL_STYLES }} />

      <div style={{ minHeight: '100vh', background: '#08080B', color: '#fff', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>

        {/* ── CINEMATIC AMBIENT MESH GLOWS ── */}
        <div style={{
          position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)',
          width: 1100, height: 600,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(229,89,29,.2) 0%, rgba(245,130,83,.06) 40%, transparent 75%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'cp-glow-pulse 8s ease-in-out infinite',
        }} />

        <div style={{
          position: 'absolute', top: 450, right: -150, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(163,48,0,.09) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'cp-mesh-float 12s ease-in-out infinite alternate',
        }} />

        {/* ── HEADER ── */}
        <header style={{ 
          position: 'relative', zIndex: 10,
          padding: '36px 5% 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(14,14,18,0.92) 0%, transparent 100%)',
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
                  Catálogo deslizante imersivo com capas em alta definição, desfoque dinâmico e sincronização em tempo real.
                </p>
              </div>

              {/* SearchBar */}
              <div style={{ width: '100%', maxWidth: 460 }}>
                <SearchBar onSelect={handleSelect} />
              </div>
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main style={{ maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* ── HERO SPOTLIGHT BANNER COM CAPAS COMPLETAS ── */}
          {spotlightItem && (
            <div style={{ padding: '0 5%' }}>
              <div style={{
                position: 'relative',
                borderRadius: 26,
                overflow: 'hidden',
                marginBottom: 40,
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#121217',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 32px rgba(229,89,29,0.08)',
                minHeight: 340,
                display: 'flex',
                alignItems: 'center',
              }}>
                {/* Full HD Backdrop banner */}
                {spotlightBackdropUrl && (
                  <img
                    src={spotlightBackdropUrl}
                    alt={spotlightItem.title ?? spotlightItem.name}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 20%',
                      filter: 'brightness(0.68) saturate(1.1)',
                    }}
                  />
                )}

                {/* Cinematic Vignette Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(8,8,11,0.96) 0%, rgba(8,8,11,0.85) 45%, rgba(8,8,11,0.3) 100%), linear-gradient(0deg, rgba(8,8,11,0.98) 0%, transparent 60%)',
                }} />

                {/* Spotlight Content Container */}
                <div style={{
                  position: 'relative',
                  zIndex: 10,
                  padding: '36px 40px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 32,
                }}>
                  {/* Left Text and Actions */}
                  <div style={{ maxWidth: 640 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 999, background: 'rgba(229,89,29,0.25)', border: '1px solid rgba(229,89,29,0.45)', color: '#F58253', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
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
                        fontSize: 13.5,
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1.6,
                        margin: '0 0 22px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {spotlightItem.overview}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => handleSelect({
                          tmdbId: spotlightItem.id,
                          type: 'movie',
                          title: spotlightItem.title ?? spotlightItem.name,
                          poster: spotlightPosterUrl,
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '13px 26px',
                          borderRadius: 14,
                          background: 'linear-gradient(135deg, #F58253, #E5591D)',
                          border: 'none',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 8px 28px rgba(229,89,29,0.45)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Play size={16} fill="#fff" />
                        Assistir Agora
                      </button>

                      <button
                        onClick={() => handleSelect({
                          tmdbId: spotlightItem.id,
                          type: 'movie',
                          title: spotlightItem.title ?? spotlightItem.name,
                          poster: spotlightPosterUrl,
                        })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '13px 22px',
                          borderRadius: 14,
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.18)',
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

                      {spotlightItem.vote_average && Number(spotlightItem.vote_average) > 0 && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '8px 12px',
                          borderRadius: 12,
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#FFD700',
                          fontSize: 13,
                          fontWeight: 700,
                        }}>
                          <Star size={13} fill="#FFD700" color="#FFD700" />
                          {Number(spotlightItem.vote_average).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TABS BAR ── */}
          <div style={{ padding: '0 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
              {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`cp-tab${isActive ? ' active' : ''}`}
                  >
                    <Icon size={15} style={{ color: isActive ? '#F58253' : 'currentColor' }} />
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SurpriseBoxButton
                allMovies={allMoviesForSurprise}
                onSelect={handleSelect}
              />

              <button
                onClick={() => setShowYoutubeModal(true)}
                className="cp-yt-btn"
              >
                <Youtube size={16} />
                Tocar YouTube
              </button>
            </div>
          </div>

          {/* ── SEÇÕES DESLIZANTES DO CATÁLOGO (SLIDING CAROUSELS COM DESFOQUE) ── */}
          <div style={{ marginBottom: 60 }}>
            
            {/* 1. Em Alta no Cinema */}
            {(tab === 'home' || tab === 'top_rated') && (
              <ContentRow
                title="Em Alta Nesta Semana"
                subtitle="Os lançamentos e filmes mais assistidos do momento"
                icon={Flame}
                items={trendingMovies?.results || []}
                isLoading={loadingTrending}
                type="movie"
                onItemClick={(item) => handleItemClick(item, false)}
              />
            )}

            {/* 2. Mais Votados de Todos os Tempos */}
            {(tab === 'home' || tab === 'top_rated') && (
              <ContentRow
                title="Mais Votados & Aclamados"
                subtitle="Obras-primas com as maiores notas do cinema mundial"
                icon={Star}
                items={topRatedMovies?.results || []}
                isLoading={loadingTopRated}
                type="movie"
                onItemClick={(item) => handleItemClick(item, false)}
              />
            )}

            {/* 3. Para a Família & Animações */}
            {(tab === 'home' || tab === 'family') && (
              <ContentRow
                title="Sessão Família & Animações"
                subtitle="Diversão garantida para assistir com toda a família"
                icon={Users}
                items={familyMovies?.results || []}
                isLoading={loadingFamily}
                type="movie"
                onItemClick={(item) => handleItemClick(item, false)}
              />
            )}

            {/* 4. Lançamentos Recentes (2020 - 2026) */}
            {(tab === 'home' || tab === 'decades') && (
              <ContentRow
                title="Lançamentos Recentes (2020 - 2026)"
                subtitle="Os maiores sucessos da década atual"
                icon={History}
                items={recentDecade?.results || []}
                isLoading={loadingRecentDecade}
                type="movie"
                onItemClick={(item) => handleItemClick(item, false)}
              />
            )}

            {/* 5. Clássicos & Anos 90/2000 */}
            {(tab === 'home' || tab === 'decades') && (
              <ContentRow
                title="Clássicos & Nostalgia (Anos 90 e 2000)"
                subtitle="Filmes icônicos que marcaram época"
                icon={Film}
                items={classicDecade?.results || []}
                isLoading={loadingClassicDecade}
                type="movie"
                onItemClick={(item) => handleItemClick(item, false)}
              />
            )}

            {/* 6. Séries Populares */}
            {(tab === 'home' || tab === 'tv') && (
              <ContentRow
                title="Séries em Alta"
                subtitle="Temporadas completas com episódios sincronizados"
                icon={Tv}
                items={tvSeries?.results || []}
                isLoading={loadingTv}
                type="tv"
                onItemClick={(item) => handleItemClick(item, true)}
              />
            )}

            {/* 7. Animes em Destaque */}
            {(tab === 'home' || tab === 'anime') && (
              <ContentRow
                title="Animes em Destaque"
                subtitle="Grandes produções de animação japonesa"
                icon={Sparkles}
                items={animeData?.results || []}
                isLoading={loadingAnime}
                type="tv"
                onItemClick={(item) => handleItemClick(item, true)}
              />
            )}
          </div>

          {/* ── INTEGRAÇÃO EXTERNA ── */}
          <div style={{ 
            margin: '0 5% 80px', 
            paddingTop: 48, 
            borderTop: '1px solid rgba(229,89,29,0.08)',
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