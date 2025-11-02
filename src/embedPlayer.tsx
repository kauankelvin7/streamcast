import { useEffect, useState } from 'react';
import type { VideoSource, PlayerConfig, ScheduleItem } from './types';
import VideoPlayer from './components/VideoPlayer';
import { loadData, STORAGE_KEYS } from './utils/storage';
import { getActiveSchedule } from './utils/schedule';

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
  
  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <VideoPlayer config={config} currentVideo={currentVideo} />
    </div>
  );
}
