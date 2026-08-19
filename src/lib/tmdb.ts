import {
  TMDBSearchResponse,
  TMDBTVShow,
  TMDBSeason,
  TMDBMovieDetails,
  TMDBCollectionDetails,
  TMDBMovie,
} from '../types/tmdb.types';

export const TMDB_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb';
const BASE_URL = 'https://api.themoviedb.org/3';

export const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'TV',
  53: 'Thriller',
  10752: 'Guerra',
  37: 'Faroeste',
};

export function mapGenreIdsToTags(genreIds?: number[]): string[] {
  if (!genreIds || genreIds.length === 0) return [];
  return genreIds.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean);
}

export const tmdb = {
  async fetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    url.searchParams.append('language', 'pt-BR');

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    return response.json();
  },

  async searchMulti(query: string, page = 1) {
    return this.fetch<TMDBSearchResponse>('/search/multi', { query, page });
  },

  async searchMovies(query: string): Promise<TMDBMovie[]> {
    if (!query.trim()) return [];
    try {
      const data = await this.fetch<{ results: TMDBMovie[] }>('/search/movie', {
        query,
        region: 'BR',
        include_adult: 'false',
      });
      const results = data.results || [];
      if (results.length === 0) {
        const enResponse = await fetch(
          `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false`
        );
        if (enResponse.ok) {
          const enData = await enResponse.json();
          return enData.results || [];
        }
      }
      return results;
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
      return [];
    }
  },

  async searchTVShows(query: string): Promise<TMDBTVShow[]> {
    if (!query.trim()) return [];
    try {
      const data = await this.fetch<{ results: TMDBTVShow[] }>('/search/tv', {
        query,
        region: 'BR',
        include_adult: 'false',
      });
      const results = data.results || [];
      if (results.length === 0) {
        const enResponse = await fetch(
          `${BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false`
        );
        if (enResponse.ok) {
          const enData = await enResponse.json();
          return enData.results || [];
        }
      }
      return results;
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
      return [];
    }
  },

  async getTrending(type: 'movie' | 'tv' | 'all', window: 'day' | 'week' = 'week', page = 1) {
    return this.fetch<TMDBSearchResponse>(`/trending/${type}/${window}`, { page });
  },

  async getTopRated(type: 'movie' | 'tv' = 'movie', page = 1) {
    return this.fetch<TMDBSearchResponse>(`/${type}/top_rated`, { page });
  },

  async getPopular(type: 'movie' | 'tv' = 'movie', page = 1) {
    return this.fetch<TMDBSearchResponse>(`/${type}/popular`, { page });
  },

  async getFamilyMovies(page = 1) {
    return this.fetch<TMDBSearchResponse>('/discover/movie', {
      with_genres: '10751,16', // Família & Animação
      sort_by: 'popularity.desc',
      'vote_count.gte': '150',
      page,
    });
  },

  async getByDecade(startYear: number, endYear: number, page = 1) {
    return this.fetch<TMDBSearchResponse>('/discover/movie', {
      'primary_release_date.gte': `${startYear}-01-01`,
      'primary_release_date.lte': `${endYear}-12-31`,
      sort_by: 'vote_average.desc',
      'vote_count.gte': '400',
      page,
    });
  },

  async discoverMovies(params: Record<string, string | number> = {}) {
    return this.fetch<TMDBSearchResponse>('/discover/movie', params);
  },

  async discoverTV(params: Record<string, string | number> = {}) {
    return this.fetch<TMDBSearchResponse>('/discover/tv', params);
  },

  async getAnimeTrending(page = 1) {
    return this.fetch<TMDBSearchResponse>('/discover/tv', {
      with_genres: '16',
      sort_by: 'popularity.desc',
      'vote_count.gte': '100',
      page,
    });
  },

  async getAnime(page = 1) {
    return this.getAnimeTrending(page);
  },

  async getTVDetails(id: number) {
    return this.fetch<TMDBTVShow>(`/tv/${id}`);
  },

  async getMovieDetails(id: number) {
    return this.fetch<TMDBMovieDetails>(`/movie/${id}`);
  },

  async getCollectionDetails(id: number) {
    return this.fetch<TMDBCollectionDetails>(`/collection/${id}`);
  },

  async getTVSeason(tvId: number, season: number) {
    return this.fetch<TMDBSeason>(`/tv/${tvId}/season/${season}`);
  },

  async getTVEpisodeDetails(tvId: number, season: number, episode: number) {
    return this.fetch<{ runtime: number | null }>(`/tv/${tvId}/season/${season}/episode/${episode}`);
  },

  async getMovieExternalIds(tmdbId: number): Promise<{ imdb_id: string | null }> {
    try {
      return await this.fetch<{ imdb_id: string | null }>(`/movie/${tmdbId}/external_ids`);
    } catch {
      return { imdb_id: null };
    }
  },

  async getTVExternalIds(tmdbId: number): Promise<{ imdb_id: string | null }> {
    try {
      return await this.fetch<{ imdb_id: string | null }>(`/tv/${tmdbId}/external_ids`);
    } catch {
      return { imdb_id: null };
    }
  },

  getImageUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500') {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },

  getTMDBPosterUrl(path: string | null, size: 'w200' | 'w500' = 'w200'): string {
    if (!path) return 'https://via.placeholder.com/200x300?text=Sem+Poster';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },
};

export default tmdb;
