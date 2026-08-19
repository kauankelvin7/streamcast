import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  Monitor,
} from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface VideoControlsProps {
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  buffered?: number;
  title?: string;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
  onSettingsClick?: () => void;
  onSubtitlesClick?: () => void;
}

/**
 * Premium Video Player Controls for Streamcast
 * Features: auto-hide, keyboard shortcuts (via parent), responsive UI
 */
export const VideoControls: React.FC<VideoControlsProps> = ({
  isPaused,
  volume,
  isMuted,
  currentTime,
  duration,
  buffered = 0,
  title = 'Streamcast Player',
  onPlayPause,
  onVolumeChange,
  onMuteToggle,
  onSeek,
  onFullscreenToggle,
  isFullscreen,
  onSettingsClick,
  onSubtitlesClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  let hideTimeout: any;


  const handleMouseMove = () => {
    setIsVisible(true);
    clearTimeout(hideTimeout);
    if (!isPaused) {
      hideTimeout = setTimeout(() => setIsVisible(false), 3000);
    }
  };

  useEffect(() => {
    if (isPaused) {
      setIsVisible(true);
    } else {
      hideTimeout = setTimeout(() => setIsVisible(false), 3000);
    }
    return () => clearTimeout(hideTimeout);
  }, [isPaused]);

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 z-20 flex flex-col justify-end p-4 md:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent ${
        isVisible ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Top Bar: Title (Optional) */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between pointer-events-none">
        <h2 className="text-lg md:text-xl font-bold text-text-primary drop-shadow-lg opacity-80">
          {title}
        </h2>
      </div>

      {/* Center: Play/Pause Large (Optional, shown on interaction) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* You can add a transient play/pause icon here */}
      </div>

      {/* Bottom Area: Progress & Controls */}
      <div className="space-y-2 md:space-y-4">
        {/* Progress Bar */}
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          onSeek={onSeek}
        />

        {/* Main Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2 md:gap-6">
            <button
              onClick={onPlayPause}
              className="p-2 text-text-primary hover:text-brand-primary transition-colors"
            >
              {isPaused ? <Play size={28} className="fill-current" /> : <Pause size={28} className="fill-current" />}
            </button>

            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <RotateCcw size={24} />
            </button>

            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <RotateCw size={24} />
            </button>

            <div
              className="flex items-center gap-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={onMuteToggle}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={24} /> : volume < 0.5 ? <Volume1 size={24} /> : <Volume2 size={24} />}
              </button>
              
              <AnimatePresence>
                {showVolumeSlider && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 80, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(Number(e.target.value))}
                      className="w-20 h-1 accent-brand-primary cursor-pointer"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-sm font-bold text-text-secondary hidden sm:block">
              {formatTime(currentTime)} <span className="text-text-muted mx-1">/</span> {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={onSubtitlesClick}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Legendas"
            >
              <Subtitles size={24} />
            </button>

            <button
              onClick={onSettingsClick}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Configurações"
            >
              <Settings size={24} />
            </button>

            <button
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Picture in Picture"
            >
              <Monitor size={24} />
            </button>

            <button
              onClick={onFullscreenToggle}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Tela Cheia"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
