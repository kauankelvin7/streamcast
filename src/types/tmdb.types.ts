export interface TMDBEpisode {
  episode_number: number;
  name: string;
  overview: string;
  runtime: number | null;
  still_path: string | null;
  air_date: string | null;
}

export interface TMDBSeason {
  season_number: number;
  name: string;
  episode_count: number;
  episodes: TMDBEpisode[];
  poster_path: string | null;
}

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  genre_ids: number[];
  release_date?: string;
  overview?: string;
  vote_average?: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  first_air_date?: string;
  genre_ids?: number[];
  vote_average?: number;
}

export interface TMDBCollectionSummary {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime?: number | null;
  genres: TMDBGenre[];
  belongs_to_collection: TMDBCollectionSummary | null;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCollectionPart {
  id: number;
  title: string;
  order: number;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string;
}

export interface TMDBCollectionDetails extends TMDBCollectionSummary {
  parts: TMDBCollectionPart[];
}

export interface TMDBSearchResponse {
  page: number;
  results: any[];
  total_pages: number;
  total_results: number;
}
