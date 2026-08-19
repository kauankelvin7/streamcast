import { useRef, useEffect } from 'react';

interface PlayerGestureOptions {
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
}

/**
 * Hook for managing video player touch gestures (mobile)
 */
export const usePlayerGestures = (
  containerRef: React.RefObject<HTMLDivElement>,
  { onPlayPause, onSeek, onVolumeChange, currentTime, duration, volume }: PlayerGestureOptions
) => {
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      const delay = now - lastTapRef.current;

      if (delay < 300) {
        // Double tap
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const width = rect.width;

        if (x < width / 2) {
          // Left side: -10s
          onSeek(Math.max(0, currentTime - 10));
        } else {
          // Right side: +10s
          onSeek(Math.min(duration, currentTime + 10));
        }
        e.preventDefault();
      } else {
        // Single tap (handled by parent or controls)
      }
      lastTapRef.current = now;
    };

    container.addEventListener('touchstart', handleTouchStart);
    return () => container.removeEventListener('touchstart', handleTouchStart);
  }, [containerRef, onPlayPause, onSeek, onVolumeChange, currentTime, duration, volume]);
};
