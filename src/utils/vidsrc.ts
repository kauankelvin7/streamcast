type MovieUrlOptions = {
  imdb?: string;
  tmdb?: string | number;
  ds_lang?: string;
  autoplay?: boolean;
  sub_url?: string;
};

type EpisodeUrlOptions = MovieUrlOptions & {
  season: number;
  episode: number;
  autonext?: boolean;
};

/**
 * EmbedMaster - Movie Embed URL
 * https://embedmaster.link/movie/{id}
 * {id} pode ser IMDb (com prefixo tt) ou TMDb
 */
export function buildMovieUrl(opts: MovieUrlOptions): string {
  const base = 'https://embedmaster.link/movie';
  let url = base;
  
  // Prioriza IMDb (com tt)
  if (opts.imdb && /^tt\d+/i.test(opts.imdb)) {
    url = `${base}/${opts.imdb}`;
  }
  // Usa TMDb se disponível
  else if (opts.tmdb && String(opts.tmdb).match(/^\d+$/)) {
    url = `${base}/${opts.tmdb}`;
  }
  // Fallback: tenta IMDb sem validação
  else if (opts.imdb) {
    const cleanId = opts.imdb.replace(/^tt/i, '');
    url = `${base}/tt${cleanId}`;
  }
  // Última tentativa: TMDb
  else if (opts.tmdb) {
    url = `${base}/${opts.tmdb}`;
  }
  
  return url;
}

/**
 * EmbedMaster - TV Show Embed URL (sem episódio específico)
 * https://embedmaster.link/tv/{id}
 */
export function buildTvUrl(opts: MovieUrlOptions): string {
  const base = 'https://embedmaster.link/tv';
  
  // Prioriza IMDb (com tt)
  if (opts.imdb && /^tt\d+/i.test(opts.imdb)) {
    return `${base}/${opts.imdb}`;
  }
  
  // Usa TMDb se disponível
  if (opts.tmdb && String(opts.tmdb).match(/^\d+$/)) {
    return `${base}/${opts.tmdb}`;
  }
  
  // Fallback: tenta IMDb sem validação
  if (opts.imdb) {
    const cleanId = opts.imdb.replace(/^tt/i, '');
    return `${base}/tt${cleanId}`;
  }
  
  // Última tentativa: TMDb
  if (opts.tmdb) {
    return `${base}/${opts.tmdb}`;
  }
  
  return base;
}

/**
 * EmbedMaster - TV Episode Embed URL
 * https://embedmaster.link/tv/{id}/{season}/{episode}
 */
export function buildEpisodeUrl(opts: EpisodeUrlOptions): string {
  const base = 'https://embedmaster.link/tv';
  let url = base;
  
  // Prioriza IMDb (com tt)
  if (opts.imdb && /^tt\d+/i.test(opts.imdb)) {
    url = `${base}/${opts.imdb}/${opts.season}/${opts.episode}`;
  }
  // Usa TMDb se disponível
  else if (opts.tmdb && String(opts.tmdb).match(/^\d+$/)) {
    url = `${base}/${opts.tmdb}/${opts.season}/${opts.episode}`;
  }
  // Fallback: tenta IMDb sem validação
  else if (opts.imdb) {
    const cleanId = opts.imdb.replace(/^tt/i, '');
    url = `${base}/tt${cleanId}/${opts.season}/${opts.episode}`;
  }
  // Última tentativa: TMDb
  else if (opts.tmdb) {
    url = `${base}/${opts.tmdb}/${opts.season}/${opts.episode}`;
  }
  
  return url;
}
