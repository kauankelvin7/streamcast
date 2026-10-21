import { useState, useCallback, useEffect, useRef } from 'react';
import { readEmbedMasterEvent, readEmbeddedPlaybackEvent, sendEmbedMasterCommand } from '../utils/embedMasterBridge';
import { readWatchProgress, saveWatchProgress, readPlayerTime, nextEpisode } from '../utils/watchProgress';
import type { EpisodePosition } from '../utils/watchProgress';
import { useEmbedMasterAutoStart } from '../hooks/useEmbedMasterAutoStart';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@lib/tmdb';
import { useSyncListener, SyncPayload } from '@features/sync/hooks/useSync';
import { resolveNextMovie } from '../../../utils/movieAutonext';
import { getEmbedProvider, buildPlayerUrl, supportsNativeAutonext } from '../../../utils/providers';

export default function EmbedPlayerPage() {
  const [content, setContent] = useState<SyncPayload | null>(null);
  const [loadedPosition, setLoadedPosition] = useState<EpisodePosition | null>(null);
  const actualPositionRef = useRef<EpisodePosition>({ season: 1, episode: 1 });
  const latestSyncRef = useRef<string>('');
  const lastSavedSecondsRef = useRef(0);
  const resumeRef = useRef(0);
  const seekSentRef = useRef(false);
  const seekGraceUntilRef = useRef(0);
  const playedBeforeTransitionRef = useRef(false);
  const lastNativeTransitionRef = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Allow only known provider IDs, never a user-supplied iframe URL.
  const query = new URLSearchParams(window.location.search);
  const selectedProvider = getEmbedProvider(query.get('provider'));
  // Explicit opt-in: avoid two independent auto-advance mechanisms racing.
  const nativeAutonext = query.get('nativeAutonext') === '1' && supportsNativeAutonext(selectedProvider);
  const { requestPlayback, lastDiagnostic } = useEmbedMasterAutoStart(
    iframeRef,
    `${selectedProvider}:${content?.tmdbId ?? ''}:${loadedPosition?.season ?? 1}:${loadedPosition?.episode ?? 1}`,
  );

  const handleSync = useCallback((payload: SyncPayload) => {
    // A Firebase sync has a startedAt timestamp. A NEW explicit sync beats
    // an older local bookmark, while a refresh of the same sync restores it.
    const fingerprint = `${payload.tmdbId}:${payload.type}:${payload.startedAt}`;
    if (fingerprint === latestSyncRef.current) return;
    latestSyncRef.current = fingerprint;
    const saved = new URLSearchParams(window.location.search).get('startOver') === '1'
      ? null : readWatchProgress(payload.type, payload.tmdbId);
    const canRestore = !!saved && saved.updatedAt > payload.startedAt;
    const position = {
      season: canRestore ? saved.season : (payload.season ?? 1),
      episode: canRestore ? saved.episode : (payload.episode ?? 1),
    };
    actualPositionRef.current = position;
    resumeRef.current = canRestore ? saved.seconds : 0;
    lastSavedSecondsRef.current = canRestore ? saved.seconds : 0;
    seekSentRef.current = false;
    playedBeforeTransitionRef.current = false;
    lastNativeTransitionRef.current = 0;
    setLoadedPosition(position);
    setContent({ ...payload, ...position });
    if (payload.type === 'tv' || payload.type === 'anime' || payload.type === 'movie') {
      saveWatchProgress(payload.type, payload.tmdbId, position, resumeRef.current);
    }
  }, []);

  useSyncListener(handleSync);

  const { data: tvDetails } = useQuery({
    queryKey: ['tv', content?.tmdbId],
    queryFn: () => tmdb.getTVDetails(Number(content!.tmdbId)),
    enabled: !!content && (content.type === 'tv' || content.type === 'anime'),
  });

  const { data: seasonDetails } = useQuery({
    queryKey: ['tv', content?.tmdbId, 'season', content?.season ?? 1],
    queryFn: () => tmdb.getTVSeason(Number(content!.tmdbId), content!.season ?? 1),
    // A synced TV payload may omit season (null), which means season 1.
    enabled: !!content && (content.type === 'tv' || content.type === 'anime'),
  });

  const totalSeasons  = tvDetails?.number_of_seasons ?? 1;
  const totalEpisodes = seasonDetails?.episodes?.length ?? 1;

  const getNext = useCallback((): { season: number; episode: number } | null => {
    if (!content || !tvDetails || !seasonDetails || (content.type !== 'tv' && content.type !== 'anime')) return null;
    return nextEpisode(actualPositionRef.current, totalEpisodes, totalSeasons);
  }, [content, totalEpisodes, totalSeasons, tvDetails, seasonDetails]);

  const handleMovieEnd = useCallback(() => {
    if (!content || content.type !== 'movie') return;
    void (async () => {
      try {
        const nextMovie = await resolveNextMovie(Number(content.tmdbId));
        if (nextMovie) {
          const nextId = 'tmdbId' in nextMovie ? nextMovie.tmdbId : nextMovie.id;
          const nextTitle = ('title' in nextMovie && nextMovie.title) ? nextMovie.title : 'Próximo Filme';
          setContent({
            ...content,
            tmdbId: nextId,
            title: nextTitle,
          });
        }
      } catch (error) {
        console.warn('Falha ao resolver próximo filme no embed:', error);
      }
    })();
  }, [content]);

  const setCurrentEpisode = useCallback((next: EpisodePosition, remountPlayer: boolean) => {
    if (!content) return;
    actualPositionRef.current = next;
    lastSavedSecondsRef.current = 0;
    resumeRef.current = 0;
    seekSentRef.current = false;
    playedBeforeTransitionRef.current = false;
    saveWatchProgress(content.type, content.tmdbId, next);
    setContent(previous => previous ? { ...previous, ...next } : previous);
    // Native provider transition must keep the original iframe alive.
    if (remountPlayer) setLoadedPosition(next);
  }, [content]);

  // Flush the latest observed seconds on refresh, without shared Firebase writes.
  useEffect(() => {
    if (!content || (content.type !== 'tv' && content.type !== 'anime' && content.type !== 'movie')) return;
    const flush = () => saveWatchProgress(content.type, content.tmdbId, actualPositionRef.current, lastSavedSecondsRef.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [content?.type, content?.tmdbId]);

  // Capture ProviderJS time and native episode switches within the same iframe.
  // This route is often kept open for many hours, so the Firebase initial
  // episode is NOT an accurate measure of the current playback episode.
  useEffect(() => {
    if (!content) return;
    const onProgressMessage = (event: MessageEvent) => {
      const message = readEmbedMasterEvent(event, iframeRef.current);
      if (!message) return;
      if (message.event === 'play' || message.event === 'start') {
        playedBeforeTransitionRef.current = true;
      }
      if ((message.event === 'next' || message.event === 'new')
        && (content.type === 'tv' || content.type === 'anime')
        && playedBeforeTransitionRef.current
        && Date.now() - lastNativeTransitionRef.current > 3000) {
        const next = getNext();
        if (next) {
          lastNativeTransitionRef.current = Date.now();
          setCurrentEpisode(next, false);
        }
      }
      if (message.event !== 'time') return;
      const seconds = readPlayerTime(message.info);
      if (seconds === null) return;
      const savedSeconds = resumeRef.current;
      if (!seekSentRef.current && savedSeconds >= 30 && seconds < savedSeconds - 8 && seconds < 20) {
        seekSentRef.current = true;
        seekGraceUntilRef.current = Date.now() + 12000;
        sendEmbedMasterCommand(iframeRef.current, 'seek', Math.floor(savedSeconds));
        return;
      }
      if (savedSeconds >= 30 && seconds < savedSeconds - 10 && Date.now() < seekGraceUntilRef.current) return;
      resumeRef.current = 0;
      if (Math.abs(seconds - lastSavedSecondsRef.current) >= 5) {
        lastSavedSecondsRef.current = seconds;
        saveWatchProgress(content.type, content.tmdbId, actualPositionRef.current, seconds);
      }
    };
    window.addEventListener('message', onProgressMessage);
    return () => window.removeEventListener('message', onProgressMessage);
  }, [content, getNext, setCurrentEpisode]);

  // Advance only when the actual provider reports media end, never by wall-clock.
  useEffect(() => {
    if (!content || content.type === 'youtube') return;
    let ended = false;
    const handleMessage = (event: MessageEvent) => {
      const playbackEvent = readEmbeddedPlaybackEvent(event, iframeRef.current);
      if (!playbackEvent || ended) return;
      if (playbackEvent !== 'ended') return;
      // The provider advances inside its own iframe; never remount it on end.
      if (nativeAutonext && (content.type === 'tv' || content.type === 'anime')) {
        const next = getNext();
        if (next) setCurrentEpisode(next, false);
        return;
      }
      ended = true;
      if (content.type === 'movie') handleMovieEnd();
      else {
        const next = getNext();
        if (next) setCurrentEpisode(next, true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [content, getNext, handleMovieEnd, nativeAutonext, setCurrentEpisode]);

  // Sem conteúdo ainda
  if (!content) {
    return (
      <div style={{ 
        width: '100vw', height: '100vh', 
        background: '#0A0A0C', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        flexDirection: 'column', gap: 20,
        fontFamily: "'Inter', sans-serif",
      }}> 
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          <div style={{ 
            position: 'absolute', inset: 0, borderRadius: '50%', 
            border: '3px solid rgba(255,255,255,0.08)', 
            borderTopColor: '#E5591D', 
            animation: 'spin 1s linear infinite',
          }} /> 
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>
            StreamCast
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500 }}> 
            Aguardando sincronização... 
          </p> 
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style> 
      </div> 
    ); 
  }

  // URL do provedor principal Vidsrc RU (Recomendado)
  const iframeSrc = content.type === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${content.tmdbId}?autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`
    : buildPlayerUrl({
        type: content.type as any,
        id: String(content.tmdbId),
        tmdb: content.tmdbId,
        season: loadedPosition?.season ?? content.season ?? 1,
        episode: loadedPosition?.episode ?? content.episode ?? 1,
        provider: selectedProvider,
        nativeAutonext,
        url: content.url ?? undefined
      } as any) || '';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', willChange: 'transform', transform: 'translateZ(0)' }}>
      {new URLSearchParams(window.location.search).get('autoplayDebug') === '1' && (
        <div data-testid="autoplay-diagnostic" style={{
          position: 'fixed', zIndex: 1000, bottom: 14, left: 16,
          maxWidth: 'min(560px, 90vw)', pointerEvents: 'none',
          borderRadius: 8, padding: '8px 12px', background: '#121212e8',
          color: '#fff', fontFamily: 'monospace', fontSize: 12, overflowWrap: 'anywhere',
        }}>
          Autoplay: {lastDiagnostic || 'Aguardando player'}
        </div>
      )}
      {content.type === 'direct' && content.url ? (
        <video
          key={content.url}
          src={content.url}
          autoPlay
          muted
          playsInline
          controls
          style={{ width: '100%', height: '100%', background: '#000' }}
        />
      ) : (
      <iframe
        ref={iframeRef}
        onLoad={requestPlayback}
        key={`${content.tmdbId}-${loadedPosition?.season ?? 1}-${loadedPosition?.episode ?? 1}`}
        src={iframeSrc}
        className="embed-iframe"
        style={{ width: '100%', height: '100%', border: 'none', willChange: 'transform', transform: 'translateZ(0)' }}
        allowFullScreen
        allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; accelerometer *; gyroscope *; web-share *"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      )}
    </div>
  );
}
