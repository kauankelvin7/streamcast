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
    
    setConfig(cfg);
    
    let videoToPlay: VideoSource | null = null;
    
    if (cfg.useSchedule && sch.length > 0) {
      videoToPlay = getActiveSchedule(sch, pl);
    }
    
    if (!videoToPlay && pl.length > 0) {
      if (cfg.currentVideoId) {
        videoToPlay = pl.find(v => v.id === cfg.currentVideoId) || pl[0] || null;
      } else {
        videoToPlay = pl[0] || null;
      }
    }
    
    setCurrentVideo(videoToPlay);
  };
  
  useEffect(() => {
    loadPlayerData();
    
    let unsubscribeFirebase: (() => void) | null = null;
    
    if (isFirebaseEnabled()) {
      unsubscribeFirebase = listenToFirebase((data) => {
        if (data) {
          const safeConfig = data.config || DEFAULT_CONFIG;
          const safePlaylist = Array.isArray(data.playlist) ? data.playlist : [];
          const safeSchedules = Array.isArray(data.schedules) ? data.schedules : [];
          
          try {
            localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(safeConfig));
            localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(safePlaylist));
            localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(safeSchedules));
          } catch (e) {
            console.warn('Erro ao salvar no localStorage:', e);
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
          
          setCurrentVideo(videoToPlay);
        }
      });
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('streamcast-')) {
        loadPlayerData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STREAMCAST_SYNC') {
        loadPlayerData();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    const interval = setInterval(loadPlayerData, 10000);
    
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
