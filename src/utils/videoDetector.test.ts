import { describe, it, expect } from 'vitest';
import { detectVideoType, getYouTubeEmbedUrl, isValidUrl } from './videoDetector';

describe('videoDetector', () => {
  describe('detectVideoType', () => {
    it('deve detectar link padrão do YouTube', () => {
      const result = detectVideoType('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.type).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('deve detectar link encurtado youtu.be', () => {
      const result = detectVideoType('https://youtu.be/dQw4w9WgXcQ');
      expect(result.type).toBe('youtube');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('deve detectar arquivo MP4 direto', () => {
      const result = detectVideoType('https://example.com/video.mp4');
      expect(result.type).toBe('direct');
    });

    it('deve detectar stream HLS (.m3u8)', () => {
      const result = detectVideoType('https://example.com/live/master.m3u8');
      expect(result.type).toBe('direct');
    });

    it('deve retornar vidsrc para URLs genéricas', () => {
      const result = detectVideoType('https://example.com/watch/something');
      expect(result.type).toBe('vidsrc');
    });
  });

  describe('getYouTubeEmbedUrl', () => {
    it('deve gerar URL de embed válida com parâmetros', () => {
      const embedUrl = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true);
      expect(embedUrl).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
      expect(embedUrl).toContain('autoplay=1');
      expect(embedUrl).toContain('mute=1');
    });
  });

  describe('isValidUrl', () => {
    it('deve retornar true para URLs válidas', () => {
      expect(isValidUrl('https://google.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('deve retornar false para strings inválidas', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });
});
