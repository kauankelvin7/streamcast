/**
 * Detecta automaticamente o tipo de vídeo baseado na URL
 */

export type DetectedVideoType = 'youtube' | 'direct' | 'vidsrc';

export interface VideoDetection {
  type: DetectedVideoType;
  url: string;
  videoId?: string;
}

/**
 * Detecta se é link do YouTube
 */
function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

/**
 * Extrai ID do YouTube
 */
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Detecta se é arquivo de vídeo direto (MP4, WebM, etc)
 */
function isDirectVideo(url: string): boolean {
  const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv|m4v|flv)(\?.*)?$/i;
  return videoExtensions.test(url);
}

/**
 * Detecta se é link que pode ser reproduzido diretamente
 */
function canPlayDirectly(url: string): boolean {
  // Google Drive links diretos
  if (url.includes('drive.google.com') && url.includes('export=download')) {
    return true;
  }
  
  // Dropbox links diretos
  if (url.includes('dropbox.com') && url.includes('dl=1')) {
    return true;
  }
  
  // Arquivos de vídeo direto
  if (isDirectVideo(url)) {
    return true;
  }
  
  return false;
}

/**
 * Detecta automaticamente o tipo de vídeo e retorna informações
 */
export function detectVideoType(url: string): VideoDetection {
  // YouTube
  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${videoId}`,
        videoId
      };
    }
  }
  
  // Vídeo direto (MP4, WebM, etc)
  if (canPlayDirectly(url)) {
    return {
      type: 'direct',
      url
    };
  }
  
  // Fallback: usa Vidsrc (para IMDB/TMDB)
  return {
    type: 'vidsrc',
    url
  };
}

/**
 * Converte URL do YouTube para embed
 */
export function getYouTubeEmbedUrl(url: string, autoplay: boolean = false, muted: boolean = false): string {
  const videoId = extractYouTubeId(url);
  if (!videoId) return url;
  
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    rel: '0',
    modestbranding: '1'
  });
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Valida se URL é válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retorna informações legíveis sobre o tipo detectado
 */
export function getVideoTypeLabel(type: DetectedVideoType): string {
  switch (type) {
    case 'youtube':
      return 'YouTube';
    case 'direct':
      return 'Vídeo Direto (MP4/WebM)';
    case 'vidsrc':
      return 'Vidsrc Player';
    default:
      return 'Desconhecido';
  }
}
