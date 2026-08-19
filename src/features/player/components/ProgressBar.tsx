import React, { useState, useRef } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered?: number;
  onSeek: (time: number) => void;
}

/**
 * Premium Progress Bar for Streamcast Video Player
 * Features: hover expansion, buffer display, seek preview (placeholder)
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  buffered = 0,
  onSeek,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const calculatePosition = (e: React.MouseEvent | React.TouchEvent) => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const pos = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      return pos;
    }
    return 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoverPosition(calculatePosition(e));
  };

  const handleClick = (e: React.MouseEvent) => {
    const pos = calculatePosition(e);
    onSeek(pos * duration);
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100 || 0;
  const bufferProgress = (buffered / duration) * 100 || 0;

  return (
    <div
      className="relative w-full py-4 cursor-pointer group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Track Container */}
      <div
        ref={barRef}
        className={`relative w-full bg-white/20 rounded-full transition-all duration-200 ${
          isHovering ? 'h-1.5' : 'h-1'
        }`}
      >
        {/* Buffer Bar */}
        <div
          className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all duration-300"
          style={{ width: `${bufferProgress}%` }}
        />

        {/* Progress Bar */}
        <div
          className="absolute top-0 left-0 h-full bg-brand-primary rounded-full"
          style={{ width: `${progress}%` }}
        />

        {/* Hover Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-primary rounded-full shadow-lg transition-opacity duration-200 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ left: `${progress}%`, marginLeft: '-6px' }}
        />

        {/* Seek Preview Tooltip */}
        {isHovering && (
          <div
            className="absolute bottom-6 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            <div className="bg-bg-card border border-border px-2 py-1 rounded text-xs font-bold text-text-primary shadow-xl">
              {formatTime(hoverPosition * duration)}
            </div>
            <div className="w-2 h-2 bg-bg-card border-r border-b border-border rotate-45 -mt-1" />
          </div>
        )}
      </div>
    </div>
  );
};
