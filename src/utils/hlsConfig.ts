import type { HlsConfig } from 'hls.js';

export function createVodHlsConfig(): Partial<HlsConfig> {
  return {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 90,
    maxBufferLength: 60,
    maxMaxBufferLength: 600,
    maxBufferSize: 60 * 1000 * 1000,
    progressive: true
  };
}

export function createLiveHlsConfig(): Partial<HlsConfig> {
  return {
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 30,
    maxBufferLength: 15,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 10,
  };
}
