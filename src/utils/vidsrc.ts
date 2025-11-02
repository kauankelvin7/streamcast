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

export function buildMovieUrl(opts: MovieUrlOptions): string {
  const base = 'https://vidsrc-embed.ru/embed/movie';
  const params = new URLSearchParams();
  
  if (opts.ds_lang) params.set('ds_lang', opts.ds_lang);
  if (opts.autoplay) params.set('autoplay', '1');
  if (opts.sub_url) params.set('sub_url', opts.sub_url);
  
  if (opts.imdb && /^tt\d+/i.test(opts.imdb)) {
    const query = params.toString();
    return query ? `${base}/${opts.imdb}?${query}` : `${base}/${opts.imdb}`;
  }
  
  if (opts.tmdb && String(opts.tmdb).match(/^\d+$/)) {
    const query = params.toString();
    return query ? `${base}/${opts.tmdb}?${query}` : `${base}/${opts.tmdb}`;
  }
  
  if (opts.imdb) params.set('imdb', opts.imdb);
  if (opts.tmdb) params.set('tmdb', String(opts.tmdb));
  return `${base}?${params.toString()}`;
}

export function buildTvUrl(opts: MovieUrlOptions): string {
  const base = 'https://vidsrc-embed.ru/embed/tv';
  const params = new URLSearchParams();
  
  if (opts.ds_lang) params.set('ds_lang', opts.ds_lang);
  
  if (opts.imdb && /^tt\d+/i.test(opts.imdb)) {
    const query = params.toString();
    return query ? `${base}/${opts.imdb}?${query}` : `${base}/${opts.imdb}`;
  }
  
  if (opts.tmdb && String(opts.tmdb).match(/^\d+$/)) {
    const query = params.toString();
    return query ? `${base}/${opts.tmdb}?${query}` : `${base}/${opts.tmdb}`;
  }
  
  if (opts.imdb) params.set('imdb', opts.imdb);
  if (opts.tmdb) params.set('tmdb', String(opts.tmdb));
  return `${base}?${params.toString()}`;
}

export function buildEpisodeUrl(opts: EpisodeUrlOptions): string {
  const base = 'https://vidsrc-embed.ru/embed/tv';
  const params = new URLSearchParams();
  
  if (opts.ds_lang) params.set('ds_lang', opts.ds_lang);
  if (opts.autoplay) params.set('autoplay', '1');
  if (opts.autonext) params.set('autonext', '1');
  if (opts.sub_url) params.set('sub_url', opts.sub_url);
  
  if (opts.imdb && /^tt\d+/i.test(opts.imdb)) {
    const path = `${opts.imdb}/${opts.season}-${opts.episode}`;
    const query = params.toString();
    return query ? `${base}/${path}?${query}` : `${base}/${path}`;
  }
  
  if (opts.tmdb && String(opts.tmdb).match(/^\d+$/)) {
    const path = `${opts.tmdb}/${opts.season}-${opts.episode}`;
    const query = params.toString();
    return query ? `${base}/${path}?${query}` : `${base}/${path}`;
  }
  
  params.set('season', String(opts.season));
  params.set('episode', String(opts.episode));
  if (opts.imdb) params.set('imdb', opts.imdb);
  if (opts.tmdb) params.set('tmdb', String(opts.tmdb));
  return `${base}?${params.toString()}`;
}
