export type VideoQuality = '4K' | '1080p' | '720p' | '480p' | '360p';

export interface VideoSource {
  quality: VideoQuality;
  url: string;
  type: 'hls' | 'dash' | 'mp4';
  bitrate?: number; // kbps
}

export interface PlayerState {
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  playbackRate: number;
  quality: VideoQuality | 'auto';
  isFullscreen: boolean;
}
