import type { TMDBMovie, TMDBTVShow } from '../types';

const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; // Chave pública de exemplo - usuário pode trocar depois

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!query.trim()) return [];
  
  try {
    // Busca com idioma PT-BR e região Brasil para melhores resultados
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&region=BR&include_adult=false`
    );
    
    if (!response.ok) throw new Error('Erro na busca');
    
    const data = await response.json();
    const results = data.results || [];
    
    // Se não encontrou resultados em PT-BR, tenta em inglês também
    if (results.length === 0) {
      const enResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false`
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
}

export async function searchTVShows(query: string): Promise<TMDBTVShow[]> {
  if (!query.trim()) return [];
  
  try {
    // Busca com idioma PT-BR e região Brasil para melhores resultados
    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&region=BR&include_adult=false`
    );
    
    if (!response.ok) throw new Error('Erro na busca');
    
    const data = await response.json();
    const results = data.results || [];
    
    // Se não encontrou resultados em PT-BR, tenta em inglês também
    if (results.length === 0) {
      const enResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false`
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
}

export function getTMDBPosterUrl(path: string | null, size: 'w200' | 'w500' = 'w200'): string {
  if (!path) return 'https://via.placeholder.com/200x300?text=Sem+Poster';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function getMovieExternalIds(tmdbId: number): Promise<{ imdb_id: string | null }> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) throw new Error('Erro ao buscar IDs externos');
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar IMDB ID:', error);
    return { imdb_id: null };
  }
}

export async function getTVExternalIds(tmdbId: number): Promise<{ imdb_id: string | null }> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) throw new Error('Erro ao buscar IDs externos');
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar IMDB ID:', error);
    return { imdb_id: null };
  }
}

// Mapeamento de IDs de gêneros do TMDB para tags em português
const TMDB_GENRE_MAP: Record<number, string> = {
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
  37: 'Faroeste'
};

export function mapGenreIdsToTags(genreIds?: number[]): string[] {
  if (!genreIds || genreIds.length === 0) return [];
  return genreIds
    .map(id => TMDB_GENRE_MAP[id])
    .filter(Boolean);
}

// Busca idiomas de áudio disponíveis para um filme
export async function getMovieAudioLanguages(tmdbId: number): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=translations`
    );
    
    if (!response.ok) throw new Error('Erro ao buscar idiomas');
    
    const data = await response.json();
    const translations = data.translations?.translations || [];
    
    // Extrai códigos de idioma únicos (iso_639_1)
    const languages = translations
      .map((t: any) => t.iso_639_1)
      .filter((lang: string) => lang);
    
    // Remove duplicatas e retorna
    return [...new Set(languages)] as string[];
  } catch (error) {
    console.error('Erro ao buscar idiomas do filme:', error);
    return ['pt', 'en']; // Fallback para português e inglês
  }
}

// Busca idiomas de áudio disponíveis para uma série
export async function getTVAudioLanguages(tmdbId: number): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=translations`
    );
    
    if (!response.ok) throw new Error('Erro ao buscar idiomas');
    
    const data = await response.json();
    const translations = data.translations?.translations || [];
    
    // Extrai códigos de idioma únicos (iso_639_1)
    const languages = translations
      .map((t: any) => t.iso_639_1)
      .filter((lang: string) => lang);
    
    // Remove duplicatas e retorna
    return [...new Set(languages)] as string[];
  } catch (error) {
    console.error('Erro ao buscar idiomas da série:', error);
    return ['pt', 'en']; // Fallback para português e inglês
  }
}

// Mapeamento de códigos de idioma para nomes em português
export const LANGUAGE_NAMES: Record<string, string> = {
  'pt': '🇧🇷 Português',
  'en': '🇺🇸 Inglês',
  'es': '🇪🇸 Espanhol',
  'fr': '🇫🇷 Francês',
  'de': '🇩🇪 Alemão',
  'it': '🇮🇹 Italiano',
  'ja': '🇯🇵 Japonês',
  'ko': '🇰🇷 Coreano',
  'zh': '🇨🇳 Chinês',
  'ru': '🇷🇺 Russo',
  'hi': '🇮🇳 Hindi',
  'ar': '🇸🇦 Árabe'
};

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}
