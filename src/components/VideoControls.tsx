import { useState } from 'react';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconMessages,
} from '@tabler/icons-react';

type VideoControlsProps = {
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
  onFindSubtitles: () => void;
  hasSubtitles: boolean;
};

export default function VideoControls({
  isPaused,
  volume,
  isMuted,
  currentTime,
  duration,
  onPlayPause,
  onVolumeChange,
  onMuteToggle,
  onSeek,
  onFullscreenToggle,
  isFullscreen,
  onFindSubtitles,
  hasSubtitles,
}: VideoControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      {/* Progress Bar */}
      <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-3">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="absolute w-full h-full appearance-none bg-transparent cursor-pointer"
          style={{ zIndex: 2 }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onPlayPause} className="hover:text-primary transition-colors">
            {isPaused ? <IconPlayerPlay size={24} /> : <IconPlayerPause size={24} />}
          </button>
          <div className="flex items-center gap-2" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
            <button onClick={onMuteToggle} className="hover:text-primary transition-colors">
              {isMuted || volume === 0 ? <IconVolumeOff size={24} /> : <IconVolume size={24} />}
            </button>
            {showVolumeSlider && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-24 h-1.5 appearance-none bg-white/20 rounded-full cursor-pointer"
              />
            )}
          </div>
          <span className="text-xs font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onFindSubtitles}
            className={`hover:text-primary transition-colors ${hasSubtitles ? 'text-primary' : ''}`}
            title={hasSubtitles ? "Legenda Carregada" : "Procurar Legenda"}
          >
            <IconMessages size={24} />
          </button>
          <button onClick={onFullscreenToggle} className="hover:text-primary transition-colors">
            {isFullscreen ? <IconArrowsMinimize size={24} /> : <IconArrowsMaximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
