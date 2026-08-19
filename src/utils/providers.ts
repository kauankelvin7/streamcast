import { buildMovieUrl, buildEpisodeUrl } from './vidsrc';
import type { VideoSource } from '../types';

export const PROVIDERS = {
  VIDSRC_RU: 'VidSrc / EmbedMaster',
  VIDSRC_CC: 'VidSrc CC (Ultra HD)',
  VIDSRC_ME: 'VidSrc Me',
  SUPEREMBED: 'SuperEmbed (Multi)',
  TWO_EMBED: '2Embed VIP',
} as const;

export type ProviderName = typeof PROVIDERS[keyof typeof PROVIDERS];

export function buildPlayerUrl(video: VideoSource): string {
  if (!video) return '';

  const id = video.tmdb || video.imdb || video.id;
  const isSeries = video.type === 'tv' || video.type === 'anime' || video.type === 'episode';
  const season = video.season ?? 1;
  const episode = video.episode ?? 1;
  const provider = video.provider || PROVIDERS.VIDSRC_RU;

  // 1. Provedor VidSrc CC (Alta estabilidade e legendas em português)
  if (provider === PROVIDERS.VIDSRC_CC) {
    if (isSeries) {
      return `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoPlay=true`;
    }
    return `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`;
  }

  // 2. Provedor VidSrc Me
  if (provider === PROVIDERS.VIDSRC_ME) {
    if (isSeries) {
      return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}&autoplay=1`;
    }
    return `https://vidsrc.me/embed/movie?tmdb=${id}&autoplay=1`;
  }

  // 3. Provedor SuperEmbed (MultiEmbed)
  if (provider === PROVIDERS.SUPEREMBED) {
    if (isSeries) {
      return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
    }
    return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
  }

  // 4. Provedor 2Embed
  if (provider === PROVIDERS.TWO_EMBED) {
    if (isSeries) {
      return `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;
    }
    return `https://www.2embed.cc/embed/${id}`;
  }

  // 5. Provedor Padrão: VidSrc RU / EmbedMaster
  if (isSeries) {
    return buildEpisodeUrl({
      imdb: video.imdb,
      tmdb: id,
      season,
      episode,
    });
  }

  if (video.type === 'movie') {
    return buildMovieUrl({
      imdb: video.imdb,
      tmdb: id,
    });
  }

  return video.url || '';
}
