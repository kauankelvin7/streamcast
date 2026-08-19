import { useState, useEffect, useMemo } from 'react';
import { SubtitleCue, parseSubtitle } from '../utils/subtitleParser';

interface UseSubtitlesOptions {
  url: string | null;
  currentTime: number;
}

/**
 * Hook for managing active subtitles in the player
 */
export const useSubtitles = ({ url, currentTime }: UseSubtitlesOptions) => {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [delay, setDelay] = useState(0); // in seconds
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setCues([]);
      return;
    }

    const fetchSubtitles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(url);
        const text = await response.text();
        const format = url.endsWith('.vtt') ? 'vtt' : 'srt';
        const parsedCues = parseSubtitle(text, format);
        setCues(parsedCues);
      } catch (error) {
        console.error('Failed to load subtitles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubtitles();
  }, [url]);

  const activeCues = useMemo(() => {
    if (!isEnabled) return [];
    const adjustedTime = currentTime + delay;
    return cues.filter(cue => adjustedTime >= cue.startTime && adjustedTime <= cue.endTime);
  }, [cues, currentTime, delay, isEnabled]);

  const adjustDelay = (ms: number) => {
    setDelay(prev => prev + ms / 1000);
  };

  return {
    activeCues,
    delay,
    isEnabled,
    setIsEnabled,
    adjustDelay,
    isLoading,
  };
};
