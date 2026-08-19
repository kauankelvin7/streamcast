import { buildMovieUrl, buildEpisodeUrl } from './vidsrc';
import type { VideoSource } from '../types';

export const PROVIDERS = {
  VIDSRC_RU: 'VidSrc / EmbedMaster',
  VIDSRC_ME: 'VidSrc Me',
  SUPEREMBED: 'SuperEmbed',
  DIRECT: 'Direto (HLS / MP4)',
} as const;

export type ProviderName = typeof PROVIDERS[keyof typeof PROVIDERS];

export function buildPlayerUrl(video: VideoSource): string {
  if (!video) return '';

  const id = video.tmdb || video.imdb || video.id;
  const isSeries = video.type === 'tv' || video.type === 'anime' || video.type === 'episode';
  const season = video.season ?? 1;
  const episode = video.episode ?? 1;
  const provider = video.provider || PROVIDERS.VIDSRC_RU;

  // Se o vídeo já for uma URL direta ou modo direto selecionado
  if (video.type === 'direct' || provider === PROVIDERS.DIRECT) {
    return video.url || '';
  }

  // 1. Provedor VidSrc Me
  if (provider === PROVIDERS.VIDSRC_ME) {
    if (isSeries) {
      return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
    }
    return `https://vidsrc.me/embed/movie?tmdb=${id}`;
  }

  // 2. Provedor SuperEmbed (MultiEmbed)
  if (provider === PROVIDERS.SUPEREMBED) {
    if (isSeries) {
      return `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
    }
    return `https://multiembed.mov/?video_id=${id}&tmdb=1`;
  }

  // 3. Provedor Padrão: VidSrc RU / EmbedMaster
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
