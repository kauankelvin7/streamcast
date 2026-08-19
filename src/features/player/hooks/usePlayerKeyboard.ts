import { useEffect } from 'react';

interface PlayerKeyboardOptions {
  onPlayPause: () => void;
  onFullscreenToggle: () => void;
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

/**
 * Hook for managing video player keyboard shortcuts
 */
export const usePlayerKeyboard = ({
  onPlayPause,
  onFullscreenToggle,
  onMuteToggle,
  onSeek,
  onVolumeChange,
  currentTime,
  duration,
  volume,
  isMuted,
}: PlayerKeyboardOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          onPlayPause();
          break;
        case 'f':
          e.preventDefault();
          onFullscreenToggle();
          break;
        case 'm':
          e.preventDefault();
          onMuteToggle();
          break;
        case 'arrowleft':
          e.preventDefault();
          onSeek(Math.max(0, currentTime - 10));
          break;
        case 'arrowright':
          e.preventDefault();
          onSeek(Math.min(duration, currentTime + 10));
          break;
        case 'arrowup':
          e.preventDefault();
          onVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          onVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'j':
          e.preventDefault();
          onSeek(Math.max(0, currentTime - 10));
          break;
        case 'l':
          e.preventDefault();
          onSeek(Math.min(duration, currentTime + 10));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayPause, onFullscreenToggle, onMuteToggle, onSeek, onVolumeChange, currentTime, duration, volume, isMuted]);
};
