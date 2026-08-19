export * from './types/tmdb.types';

export type ContentType = 'movie' | 'tv' | 'anime' | 'direct' | 'youtube' | 'episode';

export interface VideoSource {
  id: string | number;
  title: string;
  url?: string;
  type: ContentType;
  imdb?: string;
  tmdb?: string | number;
  season?: number;
  episode?: number;
  posterPath?: string;
  addedAt?: string;
  tags?: string[];
  provider?: string;
}

export interface NextContentResult {
  tmdbId: number;
  tmdb: string;
  title: string;
}
