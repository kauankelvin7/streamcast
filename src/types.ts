export type VideoSource = {
  id: string;
  title: string;
  url: string;
  type: 'direct' | 'movie' | 'tv' | 'episode' | 'upload';
  imdb?: string;
  tmdb?: string;
  season?: number;
  episode?: number;
  posterPath?: string;
  addedAt: string;
  tags?: string[];
  isUpload?: boolean; // Marca se o vídeo é um upload local
  // Para vídeos enviados
  fileName?: string;
  fileSize?: number;
  duration?: number;
  thumbnail?: string;
};

export const GENRE_TAGS = [
  'Ação', 'Aventura', 'Comédia', 'Drama', 'Terror', 
  'Suspense', 'Ficção Científica', 'Fantasia', 'Romance', 
  'Animação', 'Documentário', 'Crime', 'Mistério', 'Thriller'
] as const;

export type ScheduleItem = {
  id: string;
  name: string;
  videoId: string;
  days: number[];
  startTime: string;
  endTime: string;
  active: boolean;
};

export type PlayerMode = 'vidsrc' | 'direct' | 'youtube';

export type PlayerConfig = {
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  currentVideoId: string | null;
  ds_lang: string;
  useSchedule: boolean;
  tmdbApiKey: string;
  playerMode: PlayerMode; // Modo do player
  
  // Sincronização em tempo real
  isPlaying?: boolean;
  currentTime?: number;
  lastSyncTime?: number;
  syncEnabled?: boolean; // Ativar/desativar sincronização
};

// Evento de sincronização para broadcast
export type SyncEvent = {
  type: 'play' | 'pause' | 'seek';
  videoId: string;
  currentTime: number;
  timestamp: number;
};

// Tipos mínimos para resultados do TMDB usados na UI
export type TMDBMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  release_date?: string;
  overview?: string;
  vote_average?: number;
};

export type TMDBTVShow = {
  id: number;
  name: string;
  poster_path: string | null;
  genre_ids: number[];
  first_air_date?: string;
  overview?: string;
  vote_average?: number;
};
