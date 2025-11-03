import { useEffect, useState } from 'react';
import type { VideoSource, PlayerConfig, ScheduleItem } from './types';
import VideoPlayer from './components/VideoPlayer';
import { loadData, STORAGE_KEYS } from './utils/storage';
import { getActiveSchedule } from './utils/schedule';
import { listenToFirebase, isFirebaseEnabled } from './api/firebase';

const DEFAULT_CONFIG: PlayerConfig = {
  autoplay: true,
  muted: true,
  loop: true,
  currentVideoId: null,
  ds_lang: 'pt-BR',
  useSchedule: true,
  tmdbApiKey: ''
};

export default function EmbedPlayer() {
  const [config, setConfig] = useState<PlayerConfig>(DEFAULT_CONFIG);
  const [currentVideo, setCurrentVideo] = useState<VideoSource | null>(null);
  
  const loadPlayerData = async () => {
    const cfg = await loadData(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    const pl = await loadData<VideoSource[]>(STORAGE_KEYS.PLAYLIST, []);
    const sch = await loadData<ScheduleItem[]>(STORAGE_KEYS.SCHEDULES, []);
    
    console.log('🔄 [EMBED] Carregando dados:', { 
      config: cfg, 
      playlist: pl.length, 
      schedules: sch.length,
      currentVideoId: cfg.currentVideoId 
    });
    
    setConfig(cfg);
    
    let videoToPlay: VideoSource | null = null;
    
    if (cfg.useSchedule && sch.length > 0) {
      videoToPlay = getActiveSchedule(sch, pl);
      console.log('📅 [EMBED] Modo Schedule ativo:', videoToPlay?.title || 'Nenhum no horário');
    }
    
    if (!videoToPlay && pl.length > 0) {
      if (cfg.currentVideoId) {
        videoToPlay = pl.find(v => v.id === cfg.currentVideoId) || pl[0] || null;
        console.log('🎯 [EMBED] Vídeo por ID:', videoToPlay?.title);
      } else {
        videoToPlay = pl[0] || null;
        console.log('🎲 [EMBED] Primeiro vídeo da playlist:', videoToPlay?.title);
      }
    }
    
    if (pl.length === 0) {
      console.warn('⚠️ [EMBED] Playlist vazia! Configure vídeos no Admin.');
    }
    
    console.log('🎬 [EMBED] Vídeo selecionado:', videoToPlay?.title || 'Nenhum');
    setCurrentVideo(videoToPlay);
  };
  
  useEffect(() => {
    loadPlayerData();
    
    // Escutar Firebase em tempo real (se configurado)
    let unsubscribeFirebase: (() => void) | null = null;
    
    if (isFirebaseEnabled()) {
      console.log('☁️ [EMBED] Firebase ativado - escutando mudanças em tempo real');
      
      unsubscribeFirebase = listenToFirebase((data) => {
        if (data) {
          console.log('🔄 [EMBED] Dados atualizados via Firebase');
          
          // Garantir que config, playlist e schedules existam
          const safeConfig = data.config || DEFAULT_CONFIG;
          const safePlaylist = Array.isArray(data.playlist) ? data.playlist : [];
          const safeSchedules = Array.isArray(data.schedules) ? data.schedules : [];
          
          console.log('📊 [EMBED] Dados recebidos:', { 
            playlist: safePlaylist.length, 
            schedules: safeSchedules.length,
            useSchedule: safeConfig.useSchedule
          });
          
          // 🔥 SALVAR NO LOCALSTORAGE para evitar que interval sobrescreva
          try {
            localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(safeConfig));
            localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(safePlaylist));
            localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(safeSchedules));
            console.log('💾 [EMBED] Dados do Firebase salvos no localStorage');
          } catch (e) {
            console.warn('⚠️ Erro ao salvar no localStorage:', e);
          }
          
          setConfig(safeConfig);
          
          let videoToPlay: VideoSource | null = null;
          
          if (safeConfig.useSchedule && safeSchedules.length > 0) {
            videoToPlay = getActiveSchedule(safeSchedules, safePlaylist);
          }
          
          if (!videoToPlay && safePlaylist.length > 0) {
            if (safeConfig.currentVideoId) {
              videoToPlay = safePlaylist.find(v => v.id === safeConfig.currentVideoId) || safePlaylist[0] || null;
            } else {
              videoToPlay = safePlaylist[0] || null;
            }
          }
          
          console.log('🎬 [EMBED] Vídeo Firebase:', videoToPlay?.title || 'Nenhum');
          setCurrentVideo(videoToPlay);
        }
      });
    }
    
    // Recarregar quando o localStorage mudar (mesma origem)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('streamcast-')) {
        console.log('📡 [EMBED] Storage atualizado:', e.key);
        loadPlayerData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listener para mensagens do parent (se em iframe)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STREAMCAST_SYNC') {
        console.log('📨 [EMBED] Mensagem recebida do parent:', event.data);
        loadPlayerData();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Interval de verificação a cada 10 segundos (fallback)
    const interval = setInterval(loadPlayerData, 10000);
    
    // Notificar parent que embed está pronto
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'STREAMCAST_EMBED_READY' }, '*');
    }
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
      if (unsubscribeFirebase) {
        unsubscribeFirebase();
      }
    };
  }, []);
  
  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {currentVideo ? (
        <VideoPlayer config={config} currentVideo={currentVideo} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">StreamCast</h2>
            <p className="text-gray-400">Nenhum vídeo na playlist</p>
            <p className="text-sm text-gray-500 mt-2">Configure vídeos no painel admin</p>
          </div>
        </div>
      )}
    </div>
  );
}
