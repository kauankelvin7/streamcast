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
    <div className="relative w-full h-screen bg-background text-text-primary overflow-hidden">
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
        className="absolute top-4 right-4 p-2 rounded-full font-semibold z-40 flex items-center gap-2
        bg-primary/50 text-text-primary hover:bg-primary/80 backdrop-blur-sm transition-all duration-300
        shadow-lg shadow-primary/30 hover:shadow-primary/50"
      >
        <IconSettings2 className="w-5 h-5" />
      </button>
      
      {currentVideo && showVideoInfo && (
        <div className="absolute bottom-4 left-4 max-w-md px-4 py-2 bg-background/80 text-text-primary rounded-lg z-40 
        backdrop-blur-sm shadow-lg shadow-black/30
        border border-primary/20
        animate-fade-in-up">
          <p className="font-bold text-base truncate">{currentVideo.title}</p>
          <p className="text-xs text-text-secondary">
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
