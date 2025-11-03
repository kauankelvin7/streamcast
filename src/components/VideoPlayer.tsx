import { useEffect, useRef } from 'react';
import { Film } from 'lucide-react';
import type { VideoSource, PlayerConfig } from '../types';
import { buildMovieUrl, buildTvUrl, buildEpisodeUrl } from '../utils/vidsrc';
import { detectVideoType, getYouTubeEmbedUrl } from '../utils/videoDetector';

type VideoPlayerProps = {
  config: PlayerConfig;
  currentVideo: VideoSource | null;
  onVideoEnd?: () => void;
};

export default function VideoPlayer({ config, currentVideo, onVideoEnd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (videoRef.current && currentVideo?.type === 'direct') {
      const video = videoRef.current;
      video.muted = config.muted;
      
      if (config.autoplay) {
        video.play().catch(() => {});
      }
      
      const handleEnded = () => {
        onVideoEnd?.();
      };
      
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentVideo, config, onVideoEnd]);

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
        
        // Simula movimento do mouse
        const mouseMoveEvent = new MouseEvent('mousemove', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: centerX,
          clientY: centerY
        });
        iframe.dispatchEvent(mouseMoveEvent);
        
        // Simula clique
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: centerX,
          clientY: centerY
        });
        iframe.dispatchEvent(clickEvent);
        
        // Simula pointer down/up
        const pointerDownEvent = new PointerEvent('pointerdown', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: centerX,
          clientY: centerY
        });
        iframe.dispatchEvent(pointerDownEvent);
        
        const pointerUpEvent = new PointerEvent('pointerup', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: centerX,
          clientY: centerY
        });
        iframe.dispatchEvent(pointerUpEvent);
        
        interactionAttempts++;
      } catch (error) {}
    };

    // Múltiplas tentativas em diferentes intervalos
    const timeouts = [1500, 3000, 5000, 7000, 9000, 11000, 13000, 15000, 20000, 25000];
    const timeoutIds: NodeJS.Timeout[] = [];
    
    timeouts.forEach((delay) => {
      const id = setTimeout(simulateInteraction, delay);
      timeoutIds.push(id);
    });

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [currentVideo]);
  
  if (!currentVideo) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <Film className="w-20 h-20 text-[#00bfa6] mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 text-lg">Nenhum vídeo selecionado</p>
          <p className="text-gray-600 text-sm mt-2">Configure sua playlist no painel Admin</p>
        </div>
      </div>
    );
  }
  
  if (currentVideo.type === 'direct') {
    const detected = detectVideoType(currentVideo.url);
    
    // YouTube detectado automaticamente
    if (detected.type === 'youtube') {
      const youtubeUrl = getYouTubeEmbedUrl(currentVideo.url, config.autoplay, config.muted);
      
      return (
        <div className="relative w-full h-full bg-black">
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
    
    // Vídeo direto (MP4, WebM, etc)
    return (
      <video
        ref={videoRef}
        key={currentVideo.id}
        src={currentVideo.url}
        autoPlay={config.autoplay}
        muted={config.muted}
        loop={false}
        controls
        className="w-full h-full object-contain bg-black"
      />
    );
  }
  
  let embedUrl = '';
  
  if (currentVideo.type === 'movie') {
    embedUrl = buildMovieUrl({
      imdb: currentVideo.imdb,
      tmdb: currentVideo.tmdb,
      ds_lang: config.ds_lang,
      autoplay: config.autoplay
    });
  } else if (currentVideo.type === 'tv') {
    embedUrl = buildTvUrl({
      imdb: currentVideo.imdb,
      tmdb: currentVideo.tmdb,
      ds_lang: config.ds_lang
    });
  } else if (currentVideo.type === 'episode') {
    embedUrl = buildEpisodeUrl({
      imdb: currentVideo.imdb,
      tmdb: currentVideo.tmdb,
      season: currentVideo.season || 1,
      episode: currentVideo.episode || 1,
      ds_lang: config.ds_lang,
      autoplay: config.autoplay,
      autonext: true
    });
  }
  
  return (
    <div className="relative w-full h-full bg-black">
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
