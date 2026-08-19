import { describe, it, expect } from 'vitest';
import { createVodHlsConfig, createLiveHlsConfig } from './hlsConfig';

describe('hlsConfig', () => {
  it('deve gerar configuração otimizada para VOD', () => {
    const config = createVodHlsConfig();
    expect(config.enableWorker).toBe(true);
    expect(config.lowLatencyMode).toBe(false);
    expect(config.maxBufferLength).toBe(60);
  });

  it('deve gerar configuração otimizada para Live Streaming (baixo atraso)', () => {
    const config = createLiveHlsConfig();
    expect(config.enableWorker).toBe(true);
    expect(config.lowLatencyMode).toBe(true);
    expect(config.liveSyncDurationCount).toBe(3);
  });
});
