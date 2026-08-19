import { useState, useMemo } from 'react';
import { VideoSource, VideoQuality } from '../types/player.types';

interface UseVideoSourceOptions {
  sources: VideoSource[];
  defaultQuality?: VideoQuality | 'auto';
}

/**
 * Hook for managing video sources and automatic quality selection
 */
export const useVideoSource = ({ sources, defaultQuality = 'auto' }: UseVideoSourceOptions) => {
  const [quality, setQuality] = useState<VideoQuality | 'auto'>(defaultQuality);

  const availableQualities = useMemo(() => sources.map(s => s.quality), [sources]);

  const selectedSource = useMemo(() => {
    if (quality === 'auto') {
      // Logic for automatic selection based on bandwidth (mocked)
      // In a real app, use Network Information API: (navigator as any).connection.downlink
      return sources[0] || null; // Return highest available for now
    }
    return sources.find(s => s.quality === quality) || sources[0] || null;
  }, [quality, sources]);

  return {
    source: selectedSource,
    quality,
    setQuality,
    availableQualities,
  };
};
