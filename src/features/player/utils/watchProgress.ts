/**
 * Per-title watch state stays on the viewer's device; it is never sent to the
 * shared Firebase sync/currentContent path (which is global to all viewers).
 * Store episode immediately, time at a throttled cadence.
 */
export interface SavedWatchProgress {
  type: string;
  tmdbId: string;
  season: number;
  episode: number;
  seconds: number;
  updatedAt: number;
}

export interface EpisodePosition { season: number; episode: number }

const PREFIX = 'streamcast:watch-progress:v1:';
const MAX_SECONDS = 24 * 60 * 60;
const MAX_AGE = 365 * 24 * 60 * 60 * 1000;

function key(type: string, tmdbId: string | number): string | null {
  const id = String(tmdbId ?? '');
  if (!/^(tv|anime|movie)$/.test(type) || !/^[a-zA-Z0-9_-]{1,40}$/.test(id)) return null;
  return PREFIX + type + ':' + id;
}

export function readWatchProgress(type: string, tmdbId: string | number): SavedWatchProgress | null {
  const storageKey = key(type, tmdbId);
  if (!storageKey) return null;
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!data || typeof data !== 'object') return null;
    const item = data as Partial<SavedWatchProgress>;
    if (item.type !== type || item.tmdbId !== String(tmdbId)
      || !Number.isInteger(item.season) || item.season! < 1 || item.season! > 1000
      || !Number.isInteger(item.episode) || item.episode! < 1 || item.episode! > 10000
      || typeof item.seconds !== 'number' || !Number.isFinite(item.seconds) || item.seconds < 0 || item.seconds > MAX_SECONDS
      || typeof item.updatedAt !== 'number' || !Number.isFinite(item.updatedAt)
      || item.updatedAt > Date.now() + 60000 || Date.now() - item.updatedAt > MAX_AGE) return null;
    return item as SavedWatchProgress;
  } catch { return null; }
}

export function saveWatchProgress(
  type: string,
  tmdbId: string | number,
  position: EpisodePosition,
  seconds = 0,
): void {
  const storageKey = key(type, tmdbId);
  if (!storageKey || !Number.isInteger(position.season) || position.season < 1 || position.season > 1000
    || !Number.isInteger(position.episode) || position.episode < 1 || position.episode > 10000
    || !Number.isFinite(seconds) || seconds < 0 || seconds > MAX_SECONDS) return;
  const record: SavedWatchProgress = {
    type, tmdbId: String(tmdbId), ...position,
    seconds: Math.floor(seconds), updatedAt: Date.now(),
  };
  try { localStorage.setItem(storageKey, JSON.stringify(record)); }
  catch { /* Disabled storage/private mode: playback must still work. */ }
}

/** Ignore legacy data and odd values; PlayerJS `time` is seconds in `info`. */
export function readPlayerTime(info: unknown): number | null {
  const value = typeof info === 'object' && info !== null && 'time' in info
    ? (info as { time: unknown }).time
    : info;
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_SECONDS ? n : null;
}

/** TMDB episode counts are used only for deciding the next episode's identity. */
export function nextEpisode(
  current: EpisodePosition,
  episodeCount: number | null | undefined,
  seasonCount: number | null | undefined,
): EpisodePosition | null {
  if (!Number.isInteger(episodeCount) || !Number.isInteger(seasonCount)
    || (episodeCount ?? 0) < 1 || (seasonCount ?? 0) < 1) return null;
  if (current.episode < episodeCount!) return { season: current.season, episode: current.episode + 1 };
  if (current.season < seasonCount!) return { season: current.season + 1, episode: 1 };
  return null;
}
