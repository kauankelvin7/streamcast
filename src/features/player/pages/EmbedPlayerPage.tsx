import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@lib/tmdb';
import { useSyncListener, SyncPayload } from '@features/sync/hooks/useSync';
import { resolveNextMovie } from '../../../utils/movieAutonext';
import { PROVIDERS, buildPlayerUrl } from '../../../utils/providers';
import LiveTvPlayer from '../components/LiveTvPlayer';

export default function EmbedPlayerPage() {
  const [content, setContent] = useState<SyncPayload | null>(null);

  const handleSync = useCallback((payload: SyncPayload) => {
    setContent(payload);
  }, []);

  useSyncListener(handleSync);

  const { data: tvDetails } = useQuery({
    queryKey: ['tv', content?.tmdbId],
    queryFn: () => tmdb.getTVDetails(Number(content!.tmdbId)),
    enabled: !!content && (content.type === 'tv' || content.type === 'anime'),
  });

  const { data: seasonDetails } = useQuery({
    queryKey: ['tv', content?.tmdbId, 'season', content?.season],
    queryFn: () => tmdb.getTVSeason(Number(content!.tmdbId), content!.season ?? 1),
    enabled: !!content && (content.type === 'tv' || content.type === 'anime') && !!content.season,
  });

  const totalSeasons  = tvDetails?.number_of_seasons ?? 1;
  const totalEpisodes = seasonDetails?.episodes?.length ?? 1;

  const getNext = useCallback((): { season: number; episode: number } | null => {
    if (!content || (content.type !== 'tv' && content.type !== 'anime')) return null;
    const currentSeason = content.season ?? 1;
    const currentEpisode = content.episode ?? 1;

    if (currentEpisode < totalEpisodes) return { season: currentSeason, episode: currentEpisode + 1 };
    if (currentSeason < totalSeasons) return { season: currentSeason + 1, episode: 1 };
    return null;
  }, [content, totalEpisodes, totalSeasons]);

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

  // Autonext Inteligente por tempo do conteúdo para embeds
  useEffect(() => {
    if (!content || content.type === 'youtube' || content.type === 'direct') return;

    let durationMins = 45;
    if (content.type === 'movie') {
      durationMins = 110;
    } else if (tvDetails?.episode_run_time && tvDetails.episode_run_time.length > 0) {
      durationMins = tvDetails.episode_run_time[0];
    }

    const timer = setTimeout(() => {
      if (content.type === 'movie') {
        handleMovieEnd();
      } else {
        const next = getNext();
        if (next) {
          setContent({
            ...content,
            season: next.season,
            episode: next.episode,
          });
        }
      }
    }, durationMins * 60 * 1000);

    return () => clearTimeout(timer);
  }, [content, tvDetails, getNext, handleMovieEnd]);

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

  if (content.type === 'direct' && content.url) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', willChange: 'transform', transform: 'translateZ(0)' }}>
        <LiveTvPlayer url={content.url} autoPlay={true} muted={false} />
      </div>
    );
  }

  // URL do provedor principal Vidsrc RU (Recomendado)
  const iframeSrc = content.type === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${content.tmdbId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`
    : buildPlayerUrl({
        type: content.type as any,
        id: String(content.tmdbId),
        tmdb: content.tmdbId,
        season: content.season || 1,
        episode: content.episode || 1,
        provider: PROVIDERS.VIDSRC_RU
      } as any) || '';


  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', willChange: 'transform', transform: 'translateZ(0)' }}>
      <iframe
        key={`${content.tmdbId}-${content.season}-${content.episode}`}
        src={iframeSrc}
        className="embed-iframe"
        style={{ width: '100%', height: '100%', border: 'none', willChange: 'transform', transform: 'translateZ(0)' }}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
