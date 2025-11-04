import { useEffect, useState } from 'react';
import { IconSettings2 } from '@tabler/icons-react';
import type { VideoSource, PlayerConfig, ScheduleItem } from './types';
import VideoPlayer from './components/VideoPlayer';
import AdminPanel from './components/AdminPanel';
import { loadData, saveData, STORAGE_KEYS } from './utils/storage';
import { getActiveSchedule } from './utils/schedule';

const DEFAULT_CONFIG: PlayerConfig = {
  autoplay: true,
  muted: true,
  loop: true,
  currentVideoId: null,
  ds_lang: 'pt-BR',
  useSchedule: true,
  tmdbApiKey: '',
  playerMode: 'vidsrc' // Modo padrão
};

export default function CastPlayerApp() {
  const [config, setConfig] = useState<PlayerConfig>(DEFAULT_CONFIG);
  const [playlist, setPlaylist] = useState<VideoSource[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoSource | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showVideoInfo, setShowVideoInfo] = useState(true);
  
  const loadPlayerData = async () => {
    const cfg = await loadData(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    const pl = await loadData<VideoSource[]>(STORAGE_KEYS.PLAYLIST, []);
    const sch = await loadData<ScheduleItem[]>(STORAGE_KEYS.SCHEDULES, []);
    
    setConfig(cfg);
    setPlaylist(pl);
    setSchedules(sch);
    
    let videoToPlay: VideoSource | null = null;
    
    if (cfg.useSchedule) {
      videoToPlay = getActiveSchedule(sch, pl);
    }
    
    if (!videoToPlay) {
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
    const interval = setInterval(loadPlayerData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-ocultar informações do vídeo após 2 segundos
  useEffect(() => {
    if (currentVideo) {
      setShowVideoInfo(true);
      const timer = setTimeout(() => {
        setShowVideoInfo(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentVideo]);

  const handleVideoEnd = () => {
    if (!currentVideo || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(v => v.id === currentVideo.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextVideo = playlist[nextIndex];
    
    console.log('🎬 Mudando para próximo vídeo:', nextVideo.title);
    setCurrentVideo(nextVideo);
    
    // Atualiza a config com o novo vídeo
    const newConfig = { ...config, currentVideoId: nextVideo.id };
    setConfig(newConfig);
    saveData(STORAGE_KEYS.CONFIG, newConfig);
  };

  const handleSaveData = async (
    newConfig: PlayerConfig,
    newPlaylist: VideoSource[],
    newSchedules: ScheduleItem[]
  ) => {
    await Promise.all([
      saveData(STORAGE_KEYS.CONFIG, newConfig),
      saveData(STORAGE_KEYS.PLAYLIST, newPlaylist),
      saveData(STORAGE_KEYS.SCHEDULES, newSchedules)
    ]);
    
    await loadPlayerData();
  };
  
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        <VideoPlayer 
          config={{
            ...config,
            // Define playerMode baseado no tipo do vídeo atual
            playerMode: currentVideo?.type === 'direct' || currentVideo?.type === 'upload' 
              ? 'direct' 
              : currentVideo?.url?.includes('youtube.com') || currentVideo?.url?.includes('youtu.be')
              ? 'youtube'
              : config.playerMode
          }} 
          currentVideo={currentVideo}
          onVideoEnd={handleVideoEnd}
          enableSync={true}
          isController={showAdmin}
        />
      </div>
      
      <button
        onClick={() => setShowAdmin(true)}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 px-3 py-2 sm:px-4 rounded-xl font-semibold z-40 flex items-center gap-2 text-sm sm:text-base
        bg-slate-900/80 border border-blue-500/40 text-blue-300 hover:text-white hover:bg-slate-800/80 hover:border-blue-400/60
        shadow-lg shadow-blue-500/20 backdrop-blur-sm transition-all duration-200"
      >
  <IconSettings2 className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Admin</span>
      </button>
      
      {currentVideo && showVideoInfo && (
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto px-3 py-2 sm:px-4 bg-black/90 text-white rounded-lg z-40 transition-opacity duration-500">
          <p className="font-semibold text-sm sm:text-base truncate">{currentVideo.title}</p>
          <p className="text-xs text-gray-400">
            {currentVideo.type === 'direct' ? '🎬 URL Direta' :
             currentVideo.type === 'movie' ? '🎥 Filme' : 
             currentVideo.type === 'tv' ? '📺 Série' : '📺 Episódio'}
          </p>
        </div>
      )}
      
      {showAdmin && (
        <AdminPanel
          config={config}
          playlist={playlist}
          schedules={schedules}
          onClose={() => setShowAdmin(false)}
          onSave={handleSaveData}
        />
      )}
    </div>
  );
}
