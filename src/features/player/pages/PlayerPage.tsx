import { readEmbedMasterEvent, readEmbeddedPlaybackEvent, sendEmbedMasterCommand } from '../utils/embedMasterBridge';
import { readWatchProgress, saveWatchProgress, readPlayerTime, nextEpisode } from '../utils/watchProgress';
import { useEmbedMasterAutoStart } from '../hooks/useEmbedMasterAutoStart';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@lib/tmdb';
import { useSyncListener } from '@features/sync/hooks/useSync';
import { resolveNextMovie } from '../../../utils/movieAutonext';
import { PROVIDERS, buildPlayerUrl } from '../../../utils/providers';
import { silentCacheCleanup } from '../../../utils/cacheManager';
import { ArrowLeft, SkipBack, SkipForward, Server, Check } from 'lucide-react';

export default function PlayerPage() {
  const { type, tmdbId }  = useParams<{ type: string; tmdbId: string }>();
  const location          = useLocation();
  const navigate          = useNavigate();
  const state             = location.state as { season?: number; episode?: number; synced?: boolean; url?: string } | null;

  // Browser-local checkpoint survives refresh and a closed tab. An explicit
  // ?startOver=1 opts out; WatchParty synchronisation remains authoritative.
  const stored = useMemo(
    () => state?.synced || new URLSearchParams(window.location.search).get('startOver') === '1'
      ? null : readWatchProgress(type ?? '', tmdbId ?? ''),
    [type, tmdbId, state?.synced],
  );
  const initial = {
    season: stored?.season ?? state?.season ?? 1,
    episode: stored?.episode ?? state?.episode ?? 1,
  };
  const [season, setSeason] = useState(initial.season);
  const [episode, setEpisode] = useState(initial.episode);
  // PlayerURL must NOT change for a native provider next/new; otherwise it
  // destroys the iframe mid-autoplay. Manual navigation updates both values.
  const [loadedEpisode, setLoadedEpisode] = useState(initial);
  const actualEpisodeRef = useRef(initial);
  const lastSecondsRef = useRef(stored?.seconds ?? 0);
  const lastSaveRef = useRef(stored?.seconds ?? 0);
  const resumeRef = useRef(stored?.seconds ?? 0);
  const seekSentRef = useRef(false);
  const seekGraceUntilRef = useRef(0);
  const playedBeforeTransitionRef = useRef(false);
  const lastNativeTransitionRef = useRef(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    silentCacheCleanup();
  }, [tmdbId, season, episode]);

  // Provedor padrão recomendado: Vidsrc RU
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDERS.VIDSRC_RU);
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  const { requestPlayback, lastDiagnostic } = useEmbedMasterAutoStart(
    iframeRef,
    `${type}:${tmdbId}:${loadedEpisode.season}:${loadedEpisode.episode}:${selectedProvider}`,
  );

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

  const totalSeasons  = tvDetails?.number_of_seasons ?? 1;
  const totalEpisodes = seasonDetails?.episodes?.length ?? 1;

  // ── LÓGICA CENTRALIZADA DA URL DO IFRAME ──
  const currentVideoSrc = useMemo(() => {
    if (type === 'youtube') {
      return `https://www.youtube-nocookie.com/embed/${tmdbId}?autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
    }
    
    return buildPlayerUrl({
      type: type as any,
      id: tmdbId || '',
      tmdb: tmdbId || '',
      season: loadedEpisode.season,
      episode: loadedEpisode.episode,
      provider: selectedProvider,
      title: 'Streamcast',
      url: state?.url,
    }) || '';
  }, [type, tmdbId, loadedEpisode, selectedProvider, state?.url]);

  const getNext = useCallback((): { season: number; episode: number } | null => {
    if (!tvDetails || !seasonDetails) return null;
    return nextEpisode(actualEpisodeRef.current, totalEpisodes, totalSeasons);
  }, [episode, season, totalEpisodes, totalSeasons, tvDetails, seasonDetails]);

  const goToNext = useCallback((s: number, e: number) => {
    const position = { season: s, episode: e };
    actualEpisodeRef.current = position;
    lastSecondsRef.current = 0;
    lastSaveRef.current = 0;
    resumeRef.current = 0;
    seekSentRef.current = false;
    playedBeforeTransitionRef.current = false;
    setSeason(s);
    setEpisode(e);
    setLoadedEpisode(position);
    if (type && tmdbId) saveWatchProgress(type, tmdbId, position);
    setCountdownSeconds(null);
  }, [type, tmdbId]);

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


  // Also flush the last few seconds when the tab closes or reloads.
  useEffect(() => {
    if (!type || !tmdbId) return;
    const flush = () => saveWatchProgress(type, tmdbId, actualEpisodeRef.current, lastSecondsRef.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [type, tmdbId]);

  // Listen to the exact, verified EmbedMaster iframe window. When its own
  // countdown swaps the episode within that window, record the new episode
  // WITHOUT remounting the iframe (which would break its working autoplay).
  useEffect(() => {
    if ((type !== 'tv' && type !== 'anime' && type !== 'movie') || !tmdbId) return;
    const onProgressMessage = (event: MessageEvent) => {
      const message = readEmbedMasterEvent(event, iframeRef.current);
      if (!message) return;

      if (message.event === 'play' || message.event === 'start') {
        playedBeforeTransitionRef.current = true;
      }

      if ((message.event === 'next' || message.event === 'new')
        && (type === 'tv' || type === 'anime')
        && playedBeforeTransitionRef.current
        && Date.now() - lastNativeTransitionRef.current > 3000) {
        const next = getNext();
        if (next) {
          lastNativeTransitionRef.current = Date.now();
          playedBeforeTransitionRef.current = false;
          actualEpisodeRef.current = next;
          lastSecondsRef.current = 0;
          lastSaveRef.current = 0;
          resumeRef.current = 0;
          seekSentRef.current = false;
          saveWatchProgress(type, tmdbId, next);
          setSeason(next.season);
          setEpisode(next.episode);
          // Do not setLoadedEpisode: the provider already changed internally.
        }
      }

      if (message.event !== 'time') return;
      const seconds = readPlayerTime(message.info);
      if (seconds === null) return;

      // Resume within the same episode only; wait for an actual player time
      // event instead of blindly seeking before media metadata is available.
      const savedSeconds = resumeRef.current;
      if (!seekSentRef.current && savedSeconds >= 30 && seconds < savedSeconds - 8 && seconds < 20) {
        seekSentRef.current = true;
        seekGraceUntilRef.current = Date.now() + 12000;
        sendEmbedMasterCommand(iframeRef.current, 'seek', Math.floor(savedSeconds));
        return;
      }
      if (savedSeconds >= 30 && seconds < savedSeconds - 10 && Date.now() < seekGraceUntilRef.current) return;
      resumeRef.current = 0;
      lastSecondsRef.current = seconds;
      if (Math.abs(seconds - lastSaveRef.current) >= 5) {
        lastSaveRef.current = seconds;
        saveWatchProgress(type, tmdbId, actualEpisodeRef.current, seconds);
      }
    };
    window.addEventListener('message', onProgressMessage);
    return () => window.removeEventListener('message', onProgressMessage);
  }, [type, tmdbId, getNext, loadedEpisode]);

  // Never advance by TMDB runtime alone: wall-clock time includes buffering and pauses.
  // Only events from the active, verified player can end a video.
  useEffect(() => {
    if (type === 'youtube') return;
    setCountdownSeconds(null);
    let hasEnded = false;
    const handleMessage = (event: MessageEvent) => {
      const playbackEvent = readEmbeddedPlaybackEvent(event, iframeRef.current);
      if (!playbackEvent || hasEnded) return;
      if (playbackEvent === 'ended') {
        hasEnded = true;
        setCountdownSeconds(null);
        if (type === 'movie') handleMovieEnd();
        else handleNextManual();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [type, tmdbId, season, episode, selectedProvider, handleMovieEnd, handleNextManual]);

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

      {new URLSearchParams(window.location.search).get('autoplayDebug') === '1' && (
        <div data-testid="autoplay-diagnostic" style={{
          position: 'absolute', bottom: 14, left: 16, maxWidth: 'min(560px, 90vw)',
          zIndex: 100, pointerEvents: 'none', borderRadius: 8,
          padding: '8px 12px', background: '#121212e8', color: '#fff',
          fontFamily: 'monospace', fontSize: 12, overflowWrap: 'anywhere',
        }}>
          Autoplay: {lastDiagnostic || 'Aguardando player'}
        </div>
      )}

      {/* ── PLAYER ── */}
      {type === 'direct' && state?.url ? (
        <video
          key={state.url}
          src={state.url}
          autoPlay
          muted
          playsInline
          controls
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#000' }}
        />
      ) : (
      <iframe
        ref={iframeRef}
        key={`${tmdbId}-${loadedEpisode.season}-${loadedEpisode.episode}-${selectedProvider}`}
        src={currentVideoSrc}
        className="embed-iframe"
        onLoad={requestPlayback}
        style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0, zIndex: 0, willChange: 'transform', transform: 'translateZ(0)' }}
        allowFullScreen
        allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; accelerometer *; gyroscope *; web-share *"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      )}
    </div>
  );
}