/**
 * Sincronização de player em tempo real via Firebase
 * Permite controlar play/pause/seek em todos os players conectados
 */

import { ref, set, onValue, off, Database } from 'firebase/database';
import { initFirebase } from '../api/firebase';

export interface PlayerSyncState {
  isPlaying: boolean;
  currentTime: number;
  videoId: string;
  timestamp: number;
}

let database: Database | null = null;

/**
 * Inicializa sincronização de player
 */
export function initPlayerSync(): boolean {
  if (initFirebase()) {
    const { getDatabase } = require('firebase/database');
    database = getDatabase();
    return true;
  }
  return false;
}

/**
 * Envia estado do player para Firebase (ADMIN/CONTROLE)
 */
export async function sendPlayerState(state: PlayerSyncState): Promise<boolean> {
  if (!database) {
    if (!initPlayerSync()) return false;
  }
  
  try {
    const playerRef = ref(database!, 'playerSync');
    await set(playerRef, {
      ...state,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar estado do player:', error);
    return false;
  }
}

/**
 * Escuta mudanças no estado do player (EMBED/VISUALIZAÇÃO)
 */
export function listenToPlayerState(
  callback: (state: PlayerSyncState | null) => void
): () => void {
  if (!database) {
    if (!initPlayerSync()) {
      return () => {};
    }
  }
  
  const playerRef = ref(database!, 'playerSync');
  
  onValue(playerRef, (snapshot) => {
    const state = snapshot.val();
    callback(state || null);
  });
  
  return () => {
    off(playerRef);
  };
}

/**
 * Para o player em todos os dispositivos
 */
export async function pauseAllPlayers(videoId: string, currentTime: number): Promise<boolean> {
  return sendPlayerState({
    isPlaying: false,
    currentTime,
    videoId,
    timestamp: Date.now()
  });
}

/**
 * Inicia o player em todos os dispositivos
 */
export async function playAllPlayers(videoId: string, currentTime: number): Promise<boolean> {
  return sendPlayerState({
    isPlaying: true,
    currentTime,
    videoId,
    timestamp: Date.now()
  });
}

/**
 * Sincroniza tempo do vídeo em todos os dispositivos
 */
export async function seekAllPlayers(videoId: string, currentTime: number): Promise<boolean> {
  return sendPlayerState({
    isPlaying: true,
    currentTime,
    videoId,
    timestamp: Date.now()
  });
}
