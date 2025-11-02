import { useEffect, useRef } from 'react';
import { Film } from 'lucide-react';
import type { VideoSource, PlayerConfig } from '../types';
import { buildMovieUrl, buildTvUrl, buildEpisodeUrl } from '../utils/vidsrc';

type VideoPlayerProps = {
  config: PlayerConfig;
  currentVideo: VideoSource | null;
  onVideoEnd?: () => void;
};

export default function VideoPlayer({ config, currentVideo, onVideoEnd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Bloqueio de popups e propagandas
  useEffect(() => {
    const blockPopups = () => {
      // Bloqueia window.open
      const originalOpen = window.open;
      window.open = function(...args) {
        console.log('🚫 Popup bloqueado:', args[0]);
        return null;
      };
      
      return () => {
        window.open = originalOpen;
      };
    };
    
    const cleanup = blockPopups();
    
    // Bloqueia cliques que abrem novas janelas
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
        const href = target.getAttribute('href');
        if (href && !href.includes(window.location.hostname)) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚫 Link externo bloqueado:', href);
        }
      }
    };
    
    document.addEventListener('click', handleClick, true);
    
    return () => {
      cleanup?.();
      document.removeEventListener('click', handleClick, true);
    };
  }, []);
  
  useEffect(() => {
    if (videoRef.current && currentVideo?.type === 'direct') {
      const video = videoRef.current;
      video.muted = config.muted;
      
      if (config.autoplay) {
        video.play().catch(() => {
          console.log('Autoplay bloqueado pelo navegador');
        });
      }
      
      // Listener para quando o vídeo terminar
      const handleEnded = () => {
        console.log('🎬 Vídeo direto terminou, chamando próximo');
        onVideoEnd?.();
      };
      
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentVideo, config, onVideoEnd]);

  // Script para clicar automaticamente no play do vidsrc
  useEffect(() => {
    if (!iframeRef.current || currentVideo?.type === 'direct' || !currentVideo) return;

    const clickPlayAfterLoad = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Aguarda alguns segundos para o vidsrc carregar completamente
      const attempts = [1500, 3000, 5000, 7000];
      
      attempts.forEach(delay => {
        setTimeout(() => {
          // Simula clique no centro do iframe onde geralmente fica o botão de play
          const iframeRect = iframe.getBoundingClientRect();
          const centerX = iframeRect.left + iframeRect.width / 2;
          const centerY = iframeRect.top + iframeRect.height / 2;
          
          // Dispara evento de clique
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY
          });
          
          iframe.dispatchEvent(clickEvent);
          console.log('🎬 Tentativa de autoplay no vidsrc');
        }, delay);
      });
    };

    clickPlayAfterLoad();
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
    <div className="relative w-full h-full">
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
      {/* Camada invisível anti-popup - permite interação mas bloqueia propagandas */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
