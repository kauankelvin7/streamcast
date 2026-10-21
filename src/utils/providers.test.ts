import { describe, expect, it } from 'vitest';
import { PROVIDERS, getEmbedProvider, buildPlayerUrl } from './providers';

const video = {
  id: '1399', tmdb: '1399', type: 'tv' as const,
  title: 'Série teste', season: 2, episode: 3,
};

describe('provider URL and embed selection', () => {
  it('uses an explicit default and rejects unknown or prototype names', () => {
    expect(getEmbedProvider(null)).toBe(PROVIDERS.VIDSRC_RU);
    expect(getEmbedProvider('vidsrc-cc')).toBe(PROVIDERS.VIDSRC_CC);
    expect(getEmbedProvider('vidsrc-tw')).toBe(PROVIDERS.VIDSRC_TW);
    expect(getEmbedProvider('__proto__')).toBe(PROVIDERS.VIDSRC_RU);
    expect(getEmbedProvider('https://evil.test')).toBe(PROVIDERS.VIDSRC_RU);
  });

  it('uses documented VidSrc TW options but keeps next-episode selection in Streamcast', () => {
    const url = new URL(buildPlayerUrl({ ...video, provider: PROVIDERS.VIDSRC_TW }));
    expect(url.origin).toBe('https://vidsrc.tw');
    expect(url.pathname).toBe('/embed/tv/1399/2/3');
    expect(url.searchParams.get('autoplay')).toBe('1');
    expect(url.searchParams.get('autonext')).toBe('0');
  });

  it('preserves each existing provider route and its supported options', () => {
    const cc = buildPlayerUrl({ ...video, provider: PROVIDERS.VIDSRC_CC });
    expect(cc).toBe('https://vidsrc.cc/v2/embed/tv/1399/2/3?autoPlay=true');
    const me = buildPlayerUrl({ ...video, provider: PROVIDERS.VIDSRC_ME });
    expect(me).toContain('https://vidsrc.me/embed/tv?tmdb=1399&season=2&episode=3&autoplay=1');
    expect(buildPlayerUrl({ ...video, provider: PROVIDERS.SUPEREMBED })).toContain('multiembed.mov');
    expect(buildPlayerUrl({ ...video, provider: PROVIDERS.TWO_EMBED })).toContain('2embed.cc');
  });

  it('passes through direct video URL instead of treating it as a film ID', () => {
    expect(buildPlayerUrl({ title: 'Video', id: 'video', type: 'direct', url: 'https://cdn.example.com/movie.mp4' }))
      .toBe('https://cdn.example.com/movie.mp4');
  });
});
