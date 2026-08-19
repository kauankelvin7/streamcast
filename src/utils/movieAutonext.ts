import { tmdb } from '../lib/tmdb';
import type { VideoSource, NextContentResult } from '../types';

/**
 * Resolve o próximo filme de uma franquia/coleção TMDB ou da playlist
 */
export async function resolveNextMovie(
  current: VideoSource | number | null,
  playlist?: VideoSource[]
): Promise<NextContentResult | VideoSource | null> {
  if (typeof current === 'number') {
    try {
      const details = await tmdb.getMovieDetails(current);
      if (details?.belongs_to_collection) {
        const collection = await tmdb.getCollectionDetails(details.belongs_to_collection.id);
        const parts = collection?.parts || [];
        const sortedParts = [...parts].sort(
          (a, b) => new Date(a.release_date || 0).getTime() - new Date(b.release_date || 0).getTime()
        );
        const currentIndex = sortedParts.findIndex((p) => p.id === current);
        if (currentIndex !== -1 && currentIndex < sortedParts.length - 1) {
          const next = sortedParts[currentIndex + 1];
          return {
            tmdbId: next.id,
            tmdb: String(next.id),
            title: next.title,
          };
        }
      }
    } catch (e) {
      console.warn('Erro ao resolver franquia do filme:', e);
    }
    return null;
  }

  if (!playlist || playlist.length === 0) return null;
  if (!current) return playlist[0];

  const index = playlist.findIndex((v) => v.id === current.id);
  if (index === -1) return playlist[0];

  const nextIndex = (index + 1) % playlist.length;
  return playlist[nextIndex];
}
