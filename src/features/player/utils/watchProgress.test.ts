import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextEpisode, readPlayerTime, readWatchProgress, saveWatchProgress } from './watchProgress';

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe('persistent per-title watch progress', () => {
  it('stores series and seconds, survives a new read, and separates content', () => {
    saveWatchProgress('tv', '1399', { season: 3, episode: 7 }, 1240);
    expect(readWatchProgress('tv', '1399')).toMatchObject({ season: 3, episode: 7, seconds: 1240 });
    expect(readWatchProgress('tv', '400')).toBeNull();
    expect(readWatchProgress('anime', '1399')).toBeNull();
  });
  it('stores episode immediately when a provider changes file', () => {
    saveWatchProgress('tv', 1399, { season: 2, episode: 1 }, 154);
    saveWatchProgress('tv', 1399, { season: 2, episode: 2 });
    expect(readWatchProgress('tv', 1399)).toMatchObject({ season: 2, episode: 2, seconds: 0 });
  });
  it('rejects malformed, stale and out-of-range cache values', () => {
    saveWatchProgress('tv', '1399', { season: 2, episode: 9 });
    localStorage.setItem('streamcast:watch-progress:v1:tv:1399', '{"season":2}');
    expect(readWatchProgress('tv', 1399)).toBeNull();
    saveWatchProgress('tv', '1399', { season: 2, episode: 9 }, 90);
    const key = 'streamcast:watch-progress:v1:tv:1399';
    const old = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(key, JSON.stringify({ ...old, updatedAt: Date.now() - 366 * 86400000 }));
    expect(readWatchProgress('tv', 1399)).toBeNull();
    saveWatchProgress('tv', '1399', { season: -1, episode: 2 });
    expect(readWatchProgress('tv', 1399)).toBeNull();
  });
  it('supports strict PlayerJS time events and never trusts invalid times', () => {
    expect(readPlayerTime(90.5)).toBe(90.5);
    expect(readPlayerTime('45')).toBe(45);
    expect(readPlayerTime({ time: 18 })).toBe(18);
    expect(readPlayerTime({ url: 'evil' })).toBeNull();
    expect(readPlayerTime(-1)).toBeNull();
    expect(readPlayerTime(Number.POSITIVE_INFINITY)).toBeNull();
  });
  it('returns the next episode and wraps seasons from TMDB metadata', () => {
    expect(nextEpisode({ season: 3, episode: 1 }, 4, 5)).toEqual({ season: 3, episode: 2 });
    expect(nextEpisode({ season: 3, episode: 4 }, 4, 5)).toEqual({ season: 4, episode: 1 });
    expect(nextEpisode({ season: 5, episode: 4 }, 4, 5)).toBeNull();
    expect(nextEpisode({ season: 3, episode: 4 }, null, 5)).toBeNull();
  });
});
