import { useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';
import type { VideoSource, PlayerConfig } from '../types';
import { buildMovieUrl, buildTvUrl, buildEpisodeUrl } from '../utils/vidsrc';
import { detectVideoType, getYouTubeEmbedUrl } from '../utils/videoDetector';
import { listenToPlayerState, sendPlayerState } from '../utils/playerSync';
import { loadVideoBlob } from '../utils/indexedDB';

type VideoPlayerProps = {
  config: PlayerConfig;
  currentVideo: VideoSource | null;
  onVideoEnd?: () => void;
  enableSync?: boolean; // Habilita sincronização em tempo real
  isController?: boolean; // Se é o player controlador (admin)
};

export default function VideoPlayer({ config, currentVideo, onVideoEnd, enableSync = false, isController = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadVideoUrl, setUploadVideoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState(false);
  
  // Carrega vídeo do IndexedDB quando necessário
  useEffect(() => {
    if (currentVideo?.type === 'upload' && currentVideo.url.startsWith('indexeddb://')) {
      const videoId = currentVideo.url.replace('indexeddb://', '');
      
      setUploadError(false);
      setUploadVideoUrl(null);
      
      // Timeout de 10 segundos
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
      
      // Cleanup: revoga Blob URL quando componente desmonta ou vídeo muda
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
  }, [currentVideo]);
  
  useEffect(() => {
    // Suporta vídeos diretos E uploads (ambos usam tag <video>)
    if (videoRef.current && (currentVideo?.type === 'direct' || currentVideo?.type === 'upload')) {
      const video = videoRef.current;
      video.muted = config.muted;
      
      if (config.autoplay) {
        video.play().catch(() => {});
      }
      
      const handleEnded = () => {
        onVideoEnd?.();
      };
      
      video.addEventListener('ended', handleEnded);
      
      // SINCRONIZAÇÃO EM TEMPO REAL (vídeos diretos)
      if (enableSync && currentVideo) {
        // Se é CONTROLADOR (admin): envia eventos
        if (isController) {
          const handlePlay = () => {
            sendPlayerState({
              isPlaying: true,
              currentTime: video.currentTime,
              videoId: currentVideo.id,
              timestamp: Date.now(),
              muted: video.muted,
              volume: video.volume
            });
          };
          
          const handlePause = () => {
            sendPlayerState({
              isPlaying: false,
              currentTime: video.currentTime,
              videoId: currentVideo.id,
              timestamp: Date.now(),
              muted: video.muted,
              volume: video.volume
            });
          };
          
          const handleSeeked = () => {
            sendPlayerState({
              isPlaying: !video.paused,
              currentTime: video.currentTime,
              videoId: currentVideo.id,
              timestamp: Date.now(),
              muted: video.muted,
              volume: video.volume
            });
          };
          
          const handleVolumeChange = () => {
            sendPlayerState({
              isPlaying: !video.paused,
              currentTime: video.currentTime,
              videoId: currentVideo.id,
              timestamp: Date.now(),
              muted: video.muted,
              volume: video.volume
            });
          };
          
          video.addEventListener('play', handlePlay);
          video.addEventListener('pause', handlePause);
          video.addEventListener('seeked', handleSeeked);
          video.addEventListener('volumechange', handleVolumeChange);
          
          return () => {
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('volumechange', handleVolumeChange);
          };
        }
        
        // Se é VISUALIZADOR (embed): recebe eventos
        const unsubscribe = listenToPlayerState((state) => {
          if (!state || state.videoId !== currentVideo.id || isSyncing) return;
          
          setIsSyncing(true);
          
          const timeDiff = Math.abs(video.currentTime - state.currentTime);
          
          // Sincroniza tempo se diferença > 2s
          if (timeDiff > 2) {
            video.currentTime = state.currentTime;
          }
          
          // Sincroniza play/pause
          if (state.isPlaying && video.paused) {
            video.play().catch(() => {});
          } else if (!state.isPlaying && !video.paused) {
            video.pause();
          }
          
          // Sincroniza mute/volume
          if (state.muted !== undefined && video.muted !== state.muted) {
            video.muted = state.muted;
          }
          
          if (state.volume !== undefined && video.volume !== state.volume) {
            video.volume = state.volume;
          }
          
          setTimeout(() => setIsSyncing(false), 500);
        });
        
        return () => {
          video.removeEventListener('ended', handleEnded);
          unsubscribe();
        };
      }
      
      return () => {
        video.removeEventListener('ended', handleEnded);
      };
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
          <Film className="w-20 h-20 text-blue-400 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 text-lg">Nenhum vídeo selecionado</p>
          <p className="text-gray-600 text-sm mt-2">Configure sua playlist no painel Admin</p>
        </div>
      </div>
    );
  }
  
  // MODO UPLOAD (vídeos enviados pelo usuário - IndexedDB)
  if (currentVideo.type === 'upload') {
    // Erro ao carregar do IndexedDB
    if (uploadError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-white text-xl font-bold mb-3">Vídeo não disponível</p>
            <p className="text-red-300 text-sm mb-2">
              ⚠️ Este vídeo foi enviado em <strong>outro dispositivo/navegador</strong>
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Vídeos do tipo "upload" são armazenados localmente no IndexedDB de cada navegador.
              Para reproduzir em outros dispositivos, você precisa fazer o upload novamente neste navegador.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-left">
              <p className="text-blue-300 text-xs">
                💡 <strong>Dica:</strong> Para compartilhar vídeos entre dispositivos, use URLs diretas 
                (YouTube, Vimeo, etc.) ou hospede os arquivos em um servidor.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Se ainda está carregando do IndexedDB
    if (!uploadVideoUrl && currentVideo.url.startsWith('indexeddb://')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Carregando vídeo...</p>
            <p className="text-slate-400 text-sm mt-2">Buscando do armazenamento local</p>
          </div>
        </div>
      );
    }
    
    return (
      <video
        ref={videoRef}
        key={currentVideo.id}
        src={uploadVideoUrl || currentVideo.url}
        autoPlay={config.autoplay}
        muted={config.muted}
        loop={false}
        controls
        className="w-full h-full object-contain bg-black"
      />
    );
  }
  
  // MODO VÍDEO DIRETO (sincronização em tempo real)
  if (config.playerMode === 'direct') {
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
  
  // MODO YOUTUBE (sincronização parcial)
  if (config.playerMode === 'youtube') {
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
  
  // MODO VIDSRC (sem sincronização - padrão para TMDB/IMDB)
  if (currentVideo.type === 'direct') {
    const detected = detectVideoType(currentVideo.url);
    
    // YouTube detectado automaticamente (apenas se modo não for especificado)
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
