export type VideoSource = {
  id: string;
  title: string;
  url: string;
  type: 'direct' | 'movie' | 'tv' | 'episode';
  imdb?: string;
  tmdb?: string;
  season?: number;
  episode?: number;
  posterPath?: string;
  addedAt: string;
  tags?: string[];
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
};
