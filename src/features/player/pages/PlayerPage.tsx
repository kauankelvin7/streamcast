import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@lib/tmdb';
import { useSyncListener } from '@features/sync/hooks/useSync';
import { resolveNextMovie } from '../../../utils/movieAutonext';
import { PROVIDERS, buildPlayerUrl } from '../../../utils/providers';
import { silentCacheCleanup } from '../../../utils/cacheManager';
import { ArrowLeft, SkipBack, SkipForward, Server, Check } from 'lucide-react';
import LiveTvPlayer from '../components/LiveTvPlayer';

export default function PlayerPage() {
  const { type, tmdbId }  = useParams<{ type: string; tmdbId: string }>();
  const location          = useLocation();
  const navigate          = useNavigate();
  const state             = location.state as { season?: number; episode?: number; synced?: boolean; url?: string } | null;

  const [season, setSeason]   = useState(state?.season ?? 1);
  const [episode, setEpisode] = useState(state?.episode ?? 1);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    silentCacheCleanup();
  }, [tmdbId, season, episode]);

  // Provedor padrão recomendado: Vidsrc RU
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDERS.VIDSRC_RU);
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  // Simula clique de mouse e foco programático diretamente no centro do iframe para disparar o player sem intervenção humana
  const autoClickIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      iframe.focus();
      const rect = iframe.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const opts = {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
      };

      iframe.dispatchEvent(new PointerEvent('pointerdown', opts));
      iframe.dispatchEvent(new MouseEvent('mousedown', opts));
      iframe.dispatchEvent(new PointerEvent('pointerup', opts));
      iframe.dispatchEvent(new MouseEvent('mouseup', opts));
      iframe.dispatchEvent(new MouseEvent('click', opts));

      // PostMessage de backup
      iframe.contentWindow?.postMessage({ type: 'play' }, '*');
      iframe.contentWindow?.postMessage({ event: 'play' }, '*');
      iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
    } catch (_) {}
  }, []);

  // Sequência de disparos automáticos ao trocar de mídia/episódio
  useEffect(() => {
    const t1 = setTimeout(autoClickIframe, 300);
    const t2 = setTimeout(autoClickIframe, 900);
    const t3 = setTimeout(autoClickIframe, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [tmdbId, season, episode, selectedProvider, autoClickIframe]);

  // Busca detalhes de Séries
  const { data: tvDetails } = useQuery({
    queryKey: ['tv', tmdbId],
    queryFn: () => tmdb.getTVDetails(Number(tmdbId)),
    enabled: type === 'tv' || type === 'anime',
  });

  // Busca episódios da temporada
  const { data: seasonDetails } = useQuery({
    queryKey: ['tv', tmdbId, 'season', season],
    queryFn: () => tmdb.getTVSeason(Number(tmdbId), season),
    enabled: (type === 'tv' || type === 'anime') && !!season,
  });

  // Busca detalhes específicos do episódio (para capturar runtime exato do episódio atual)
  const { data: episodeDetails } = useQuery({
    queryKey: ['tv', tmdbId, 'season', season, 'episode', episode],
    queryFn: () => tmdb.getTVEpisodeDetails(Number(tmdbId), season, episode),
    enabled: (type === 'tv' || type === 'anime') && !!tmdbId && !!season && !!episode,
  });

  // Busca detalhes do Filme (para pegar runtime exato em minutos)
  const { data: movieDetails } = useQuery({
    queryKey: ['movie', tmdbId],
    queryFn: () => tmdb.getMovieDetails(Number(tmdbId)),
    enabled: type === 'movie' && !!tmdbId,
  });

  const totalSeasons  = tvDetails?.number_of_seasons ?? 1;
  const totalEpisodes = seasonDetails?.episodes?.length ?? 1;

  // ── LÓGICA CENTRALIZADA DA URL DO IFRAME ──
  const currentVideoSrc = useMemo(() => {
    if (type === 'youtube') {
      return `https://www.youtube.com/embed/${tmdbId}?autoplay=1&enablejsapi=1&muted=1`;
    }
    
    return buildPlayerUrl({
      type: type as any,
      id: tmdbId || '',
      tmdb: tmdbId || '',
      season,
      episode,
      provider: selectedProvider,
      title: 'Streamcast',
    }) || '';
  }, [type, tmdbId, season, episode, selectedProvider]);

  const getNext = useCallback((): { season: number; episode: number } | null => {
    if (episode < totalEpisodes) return { season, episode: episode + 1 };
    if (season < totalSeasons)  return { season: season + 1, episode: 1 };
    return null;
  }, [episode, season, totalEpisodes, totalSeasons]);

  const goToNext = useCallback((s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
    setCountdownSeconds(null);
  }, []);

  function goPrev() {
    if (episode > 1) goToNext(season, episode - 1);
  }

  const handleNextManual = useCallback(() => {
    setCountdownSeconds(null);
    const next = getNext();
    if (next) goToNext(next.season, next.episode);
  }, [getNext, goToNext]);

  const handleMovieEnd = useCallback(() => {
    if (type !== 'movie') return;
    setCountdownSeconds(null);
    void (async () => {
      try {
        const nextMovie = await resolveNextMovie(Number(tmdbId));
        if (!nextMovie) return;
        const nextId = 'tmdbId' in nextMovie ? nextMovie.tmdbId : nextMovie.id;
        navigate(`/watch/movie/${nextId}`);
      } catch (error) {
        console.warn('Falha ao resolver próximo filme:', error);
      }
    })();
  }, [type, tmdbId, navigate]);


  // Tempo de execução exato obtido do TMDB (em minutos -> convertido para segundos)
  const exactRuntimeSeconds = useMemo(() => {
    if (type === 'movie') {
      return (movieDetails?.runtime || 110) * 60;
    }
    const currentEp = seasonDetails?.episodes?.find((e: { episode_number: number }) => e.episode_number === episode);
    const mins = episodeDetails?.runtime || currentEp?.runtime || tvDetails?.episode_run_time?.[0] || 50;
    return mins * 60;
  }, [type, movieDetails, seasonDetails, episodeDetails, episode, tvDetails]);

  // Ref para controlar o tempo de reprodução decorrido
  const elapsedRef = useRef(0);

  // Monitoramento duplo: escuta postMessage do iframe + contador do runtime exato
  useEffect(() => {
    if (type === 'youtube') return;
    setCountdownSeconds(null);
    elapsedRef.current = 0;

    let hasEnded = false;

    const triggerNext = () => {
      if (hasEnded) return;
      hasEnded = true;
      setCountdownSeconds(null);
      if (type === 'movie') {
        handleMovieEnd();
      } else {
        handleNextManual();
      }
    };

    // 1. Escuta eventos postMessage em tempo real do player (Vidsrc RU / JW / HTML5)
    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (_) {}
        }
        if (!data) return;

        const eventType = data.event || data.type || data.status;
        const cTime = data.currentTime ?? data.time ?? data.position ?? data.seconds ?? data.cTime ?? data.data?.currentTime ?? data.data?.time;
        const dur = data.duration ?? data.totalTime ?? data.length ?? data.dTime ?? data.data?.duration;

        if (eventType === 'ended' || eventType === 'finish' || eventType === 'complete' || (data.event === 'onStateChange' && data.data === 0)) {
          triggerNext();
          return;
        }

        if (typeof cTime === 'number' && typeof dur === 'number' && dur > 0) {
          const remaining = dur - cTime;
          if (remaining <= 15 && remaining > 0) {
            setCountdownSeconds(Math.ceil(remaining));
          } else if (remaining <= 0) {
            triggerNext();
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleMessage);

    // 2. Ticker de backup com base na duração exata retornada pelo TMDB
    const interval = setInterval(() => {
      elapsedRef.current += 1;
      const remaining = exactRuntimeSeconds - elapsedRef.current;

      if (remaining <= 15 && remaining > 0) {
        setCountdownSeconds(remaining);
      } else if (remaining <= 0) {
        clearInterval(interval);
        triggerNext();
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [type, tmdbId, season, episode, exactRuntimeSeconds, handleNextManual, handleMovieEnd]);

  const isSyncedMode = Boolean(state?.synced);

  // WatchParty sync - Apenas escuta alterações do painel se o modo for explicitamente Sincronizado
  const handleSync = useCallback((payload: {
    tmdbId: number | string; type: string; season?: number | null; episode?: number | null;
  }) => {
    if (!isSyncedMode) return;

    if (String(payload.tmdbId) !== String(tmdbId)) {
      navigate(`/watch/${payload.type}/${payload.tmdbId}`, {
        state: { season: payload.season, episode: payload.episode, synced: true },
      });
    } else if (payload.season && payload.episode) {
      goToNext(payload.season, payload.episode);
    }
  }, [isSyncedMode, tmdbId, navigate, goToNext]);

  useSyncListener(handleSync as any);

  // ── Button style helpers ──
  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 14,
    background: 'rgba(14,14,18,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 13, fontWeight: 500,
    fontFamily: "'Inter', sans-serif", cursor: 'pointer',
    transition: 'all 0.2s ease', outline: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  };

  // Atalhos de teclado (F = Fullscreen, ArrowRight = Próximo, ArrowLeft = Anterior, Esc = Voltar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'ArrowRight' && (type === 'tv' || type === 'anime')) {
        handleNextManual();
      } else if (e.key === 'ArrowLeft' && (type === 'tv' || type === 'anime')) {
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, handleNextManual, goPrev]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HUD CONTROLS ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 50, pointerEvents: 'none' }}>
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{ ...btnBase, pointerEvents: 'auto' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(229,89,29,0.5)'; e.currentTarget.style.color = '#E5591D'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
        >
          <ArrowLeft size={17} />
          Voltar
        </button>

        {/* Right Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, pointerEvents: 'auto' }}>
          
          {/* Server Selector */}
          {type !== 'youtube' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProviderMenu(!showProviderMenu)}
                style={{
                  ...btnBase,
                  background: showProviderMenu ? '#E5591D' : 'rgba(14,14,18,0.95)',
                  borderColor: showProviderMenu ? 'transparent' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                }}
                onMouseEnter={(e) => { if (!showProviderMenu) { e.currentTarget.style.borderColor = 'rgba(229,89,29,0.5)'; e.currentTarget.style.color = '#E5591D'; } }}
                onMouseLeave={(e) => { if (!showProviderMenu) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; } }}
              >
                <Server size={16} />
                <span style={{ fontSize: 12, opacity: 0.8 }}>{selectedProvider.split('/')[0].trim()}</span>
              </button>

              {showProviderMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'rgba(20,20,24,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                  padding: 6, minWidth: 220,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                }}>
                  {Object.values(PROVIDERS).map(p => {
                    const isActive = selectedProvider === p;
                    return (
                      <button
                        key={p}
                        onClick={() => { setSelectedProvider(p); setShowProviderMenu(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', textAlign: 'left',
                          padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                          fontFamily: "'Inter', sans-serif",
                          background: isActive ? 'rgba(229,89,29,0.12)' : 'transparent',
                          color: isActive ? '#E5591D' : 'rgba(255,255,255,0.6)',
                          border: 'none', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; } }}
                      >
                        <span>{p}</span>
                        {isActive && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Prev/Next for TV */}
          {(type === 'tv' || type === 'anime') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={goPrev}
                disabled={episode === 1 && season === 1}
                style={{
                  ...btnBase,
                  opacity: (episode === 1 && season === 1) ? 0.3 : 1,
                  cursor: (episode === 1 && season === 1) ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!(episode === 1 && season === 1)) { e.currentTarget.style.borderColor = 'rgba(229,89,29,0.5)'; e.currentTarget.style.color = '#E5591D'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                title="Episódio Anterior (Seta Esquerda)"
              >
                <SkipBack size={15} />
                Anterior
              </button>
              
              <button 
                onClick={handleNextManual}
                style={{
                  ...btnBase,
                  background: 'rgba(229,89,29,0.15)',
                  borderColor: 'rgba(229,89,29,0.3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E5591D'; e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(229,89,29,0.15)'; e.currentTarget.style.borderColor = 'rgba(229,89,29,0.3)'; }}
                title="Próximo Episódio (Seta Direita)"
              >
                Próximo
                <SkipForward size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── COUNTDOWN FLUTUANTE DE 10-15 SEGUNDOS ── */}
      {countdownSeconds !== null && (
        <div style={{
          position: 'absolute', bottom: 48, right: 48, zIndex: 60, display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(14, 14, 18, 0.95)', border: '1px solid rgba(229, 89, 29, 0.5)', borderRadius: 20, padding: '14px 20px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.8)', animation: 'slide-up 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              {type === 'movie' ? 'Próximo Filme' : 'Próximo Episódio'}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              Iniciando em {countdownSeconds}s
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCountdownSeconds(null)}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 14px', borderRadius: 12,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Cancelar
            </button>

            <button
              onClick={type === 'movie' ? handleMovieEnd : handleNextManual}
              style={{
                background: '#E5591D', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 16px rgba(229,89,29,0.4)', transition: 'all 0.2s'
              }}
            >
              Pular <SkipForward size={15} />
            </button>
          </div>
          <style>{`@keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* ── PLAYER ── */}
      {type === 'direct' && state?.url ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform', transform: 'translateZ(0)' }}>
          <LiveTvPlayer url={state.url} autoPlay={true} />
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          key={`${tmdbId}-${season}-${episode}-${selectedProvider}`}
          src={currentVideoSrc}
          className="embed-iframe"
          onLoad={autoClickIframe}
          style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform', transform: 'translateZ(0)' }}
          allowFullScreen
          allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; accelerometer *; gyroscope *"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}