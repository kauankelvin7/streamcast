import { useEffect, useRef, useState } from 'react';
import { IconMovie, IconAlertTriangle } from '@tabler/icons-react';
import type { VideoSource, PlayerConfig } from '../types';
import { buildMovieUrl, buildTvUrl, buildEpisodeUrl } from '../utils/vidsrc';
import { detectVideoType, getYouTubeEmbedUrl } from '../utils/videoDetector';
import { listenToPlayerState, sendPlayerState } from '../utils/playerSync';
import { loadVideoBlob } from '../utils/indexedDB';
import VideoControls from './VideoControls';
import { findSubtitles } from '../utils/subtitles';

type VideoPlayerProps = {
  config: PlayerConfig;
  currentVideo: VideoSource | null;
  onVideoEnd?: () => void;
  enableSync?: boolean;
  isController?: boolean;
};

export default function VideoPlayer({ config, currentVideo, onVideoEnd, enableSync = false, isController = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadVideoUrl, setUploadVideoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState(false);

  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(config.muted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentVideo?.type === 'upload' && currentVideo.url.startsWith('indexeddb://')) {
      const videoId = currentVideo.url.replace('indexeddb://', '');
      setUploadError(false);
      setUploadVideoUrl(null);
      const timeoutId = setTimeout(() => {
        if (!uploadVideoUrl) {
          console.error('⏱️ Timeout ao carregar vídeo do IndexedDB');
          setUploadError(true);
        }
      }, 10000);
      loadVideoBlob(videoId).then((blobUrl) => {
        clearTimeout(timeoutId);
        if (blobUrl) {
          setUploadVideoUrl(blobUrl);
        } else {
          console.error('❌ Vídeo não encontrado no IndexedDB:', videoId);
          setUploadError(true);
        }
      }).catch((error) => {
        clearTimeout(timeoutId);
        console.error('❌ Erro ao carregar vídeo:', error);
        setUploadError(true);
      });
      return () => {
        clearTimeout(timeoutId);
        if (uploadVideoUrl) {
          URL.revokeObjectURL(uploadVideoUrl);
          setUploadVideoUrl(null);
        }
      };
    } else {
      setUploadVideoUrl(null);
      setUploadError(false);
    }
    setSubtitleUrl(null);
  }, [currentVideo]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume > 0 && videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleFullscreenToggle = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleFindSubtitles = async () => {
    if (!currentVideo || !currentVideo.imdb) {
      alert('Informação do IMDB não encontrada para este vídeo.');
      return;
    }
    alert(`Procurando legendas para ${currentVideo.title}... (funcionalidade em desenvolvimento)`);
    const foundSubtitles = await findSubtitles(
      currentVideo.imdb,
      currentVideo.type === 'episode' ? currentVideo.season : undefined,
      currentVideo.type === 'episode' ? currentVideo.episode : undefined
    );
    if (foundSubtitles && foundSubtitles.length > 0) {
      // Aqui você precisaria implementar o download da legenda
      // Por enquanto, vamos usar a legenda de demonstração
      const vttContent = `WEBVTT

00:00:01.000 --> 00:00:05.000
Legenda encontrada para:
${currentVideo.title}

00:00:06.000 --> 00:00:10.000
${foundSubtitles.length} legenda(s) disponível(is).`;
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      setSubtitleUrl(url);
    } else {
      const vttContent = `WEBVTT

00:00:01.000 --> 00:00:05.000
Legenda de exemplo para:
${currentVideo.title}

00:00:06.000 --> 00:00:10.000
Esta é uma legenda de demonstração.
A busca real será implementada em breve.`;
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      setSubtitleUrl(url);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPaused(false);
    const onPause = () => setIsPaused(true);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);
    setIsPaused(video.paused);
    setIsMuted(video.muted);
    setVolume(video.volume);
    if (video.duration) setDuration(video.duration);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [videoRef, uploadVideoUrl, currentVideo]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (videoRef.current && (currentVideo?.type === 'direct' || currentVideo?.type === 'upload')) {
      const video = videoRef.current;
      video.muted = config.muted;
      if (config.autoplay) video.play().catch(() => {});
      const handleEnded = () => onVideoEnd?.();
      video.addEventListener('ended', handleEnded);
      if (enableSync && currentVideo) {
        if (isController) {
          const syncState = () => sendPlayerState({ isPlaying: !video.paused, currentTime: video.currentTime, videoId: currentVideo.id, timestamp: Date.now(), muted: video.muted, volume: video.volume });
          video.addEventListener('play', syncState);
          video.addEventListener('pause', syncState);
          video.addEventListener('seeked', syncState);
          video.addEventListener('volumechange', syncState);
          return () => {
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', syncState);
            video.removeEventListener('pause', syncState);
            video.removeEventListener('seeked', syncState);
            video.removeEventListener('volumechange', syncState);
          };
        }
        const unsubscribe = listenToPlayerState((state) => {
          if (!state || state.videoId !== currentVideo.id || isSyncing) return;
          setIsSyncing(true);
          if (Math.abs(video.currentTime - state.currentTime) > 2) {
            video.currentTime = state.currentTime;
          }
          if (state.isPlaying && video.paused) video.play().catch(() => {});
          else if (!state.isPlaying && !video.paused) video.pause();
          if (state.muted !== undefined && video.muted !== state.muted) video.muted = state.muted;
          if (state.volume !== undefined && video.volume !== state.volume) video.volume = state.volume;
          setTimeout(() => setIsSyncing(false), 500);
        });
        return () => {
          video.removeEventListener('ended', handleEnded);
          unsubscribe();
        };
      }
      return () => video.removeEventListener('ended', handleEnded);
    }
  }, [currentVideo, config, onVideoEnd, enableSync, isController, isSyncing]);

  useEffect(() => {
    if (!iframeRef.current || currentVideo?.type === 'direct' || !currentVideo) return;
    const iframe = iframeRef.current;
    let interactionAttempts = 0;
    const maxAttempts = 10;
    const simulateInteraction = () => {
      if (!iframe || interactionAttempts >= maxAttempts) return;
      try {
        const iframeRect = iframe.getBoundingClientRect();
        const centerX = iframeRect.left + iframeRect.width / 2;
        const centerY = iframeRect.top + iframeRect.height / 2;
        const events = [
          new MouseEvent('mousemove', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY }),
          new MouseEvent('click', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY }),
          new PointerEvent('pointerdown', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY }),
          new PointerEvent('pointerup', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY }),
        ];
        events.forEach(event => iframe.dispatchEvent(event));
        interactionAttempts++;
      } catch (error) {}
    };
    const timeouts = [1500, 3000, 5000, 7000, 9000, 11000, 13000, 15000, 20000, 25000];
    const timeoutIds = timeouts.map(delay => setTimeout(simulateInteraction, delay));
    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [currentVideo]);

  if (!currentVideo) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gray-500/20 rounded-full"></div>
            <div className="absolute inset-2 bg-gray-500/30 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <IconMovie className="w-12 h-12 text-gray-400 opacity-75" />
            </div>
          </div>
          <p className="text-text-primary text-lg font-semibold">Nenhum vídeo selecionado</p>
          <p className="text-text-secondary text-sm mt-2">Configure sua playlist no painel de administração</p>
        </div>
      </div>
    );
  }

  const renderVideoPlayer = (videoSrc: string) => (
    <div ref={playerContainerRef} className="relative w-full h-full bg-background group">
      <video
        ref={videoRef}
        key={currentVideo.id}
        src={videoSrc}
        autoPlay={config.autoplay}
        muted={config.muted}
        loop={false}
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
      >
        {subtitleUrl && <track kind="subtitles" srcLang="pt" label="Português" src={subtitleUrl} default />}
      </video>
      <VideoControls
        isPaused={isPaused}
        isMuted={isMuted}
        volume={volume}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={handlePlayPause}
        onMuteToggle={handleMuteToggle}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        onFullscreenToggle={handleFullscreenToggle}
        isFullscreen={isFullscreen}
        onFindSubtitles={handleFindSubtitles}
        hasSubtitles={!!subtitleUrl}
      />
    </div>
  );

  if (currentVideo.type === 'upload') {
    if (uploadError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-background">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 bg-gray-500/10 border-2 border-gray-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconAlertTriangle className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-white text-xl font-bold mb-3">Vídeo não disponível</p>
            <p className="text-gray-300 text-sm mb-2">Este vídeo foi enviado em outro dispositivo/navegador</p>
            <p className="text-text-secondary text-xs mb-4">Vídeos do tipo "upload" são armazenados localmente. Para reproduzir, faça o upload novamente neste navegador.</p>
          </div>
        </div>
      );
    }
    if (!uploadVideoUrl && currentVideo.url.startsWith('indexeddb://')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-text-primary text-lg font-semibold">Carregando vídeo...</p>
          </div>
        </div>
      );
    }
    return renderVideoPlayer(uploadVideoUrl || '');
  }

  if (config.playerMode === 'direct' || (currentVideo.type === 'direct' && detectVideoType(currentVideo.url).type !== 'youtube')) {
    return renderVideoPlayer(currentVideo.url);
  }

  const detectedType = currentVideo.type === 'direct' ? detectVideoType(currentVideo.url).type : null;
  if (config.playerMode === 'youtube' || detectedType === 'youtube') {
    const youtubeUrl = getYouTubeEmbedUrl(currentVideo.url, config.autoplay, config.muted);
    return (
      <div className="relative w-full h-full bg-background">
        <iframe
          key={currentVideo.id}
          src={youtubeUrl}
          title={currentVideo.title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          allowFullScreen
          referrerPolicy="origin"
          style={{ minHeight: '500px' }}
        />
      </div>
    );
  }

  let embedUrl = '';
  if (currentVideo.type === 'movie') {
    embedUrl = buildMovieUrl({ imdb: currentVideo.imdb, tmdb: currentVideo.tmdb, ds_lang: config.ds_lang, autoplay: config.autoplay });
  } else if (currentVideo.type === 'tv') {
    embedUrl = buildTvUrl({ imdb: currentVideo.imdb, tmdb: currentVideo.tmdb, ds_lang: config.ds_lang });
  } else if (currentVideo.type === 'episode') {
    embedUrl = buildEpisodeUrl({ imdb: currentVideo.imdb, tmdb: currentVideo.tmdb, season: currentVideo.season || 1, episode: currentVideo.episode || 1, ds_lang: config.ds_lang, autoplay: config.autoplay, autonext: true });
  }

  return (
    <div className="relative w-full h-full bg-background">
      <iframe
        ref={iframeRef}
        key={currentVideo.id}
        src={embedUrl}
        title={currentVideo.title}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="origin"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}
