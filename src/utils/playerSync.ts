/**
 * Sincronização de player em tempo real
 * 
 * - BroadcastChannel: Sincroniza entre abas/janelas no mesmo domínio (local)
 * - Firebase Realtime Database: Sincroniza entre diferentes sites/dispositivos (global)
 */

import { getDatabase, ref, set, onValue, off } from 'firebase/database';
import { initFirebase, isFirebaseEnabled } from '../api/firebase';

export interface PlayerSyncState {
  isPlaying: boolean;
  currentTime: number;
  videoId: string;
  timestamp: number;
  muted?: boolean;
  volume?: number;
}

let bc: BroadcastChannel | null = null;
let firebaseDb: any = null;

// Inicializa BroadcastChannel (sincronização local)
function initBroadcastChannel() {
  try {
    if (!bc) {
      bc = new BroadcastChannel('streamcast-player-sync');
      console.log('📡 BroadcastChannel inicializado (sync local)');
    }
  } catch (e) {
    console.warn('⚠️ BroadcastChannel não suportado neste navegador');
    bc = null;
  }
}

// Inicializa Firebase (sincronização global cross-origin)
function initFirebaseSync(): boolean {
  // TEMPORARIAMENTE DESABILITADO - Firebase com erro de permissão
  return false;
  
  /*
  if (firebaseDb) return true;
  
  try {
    if (isFirebaseEnabled() && initFirebase()) {
      firebaseDb = getDatabase();
      console.log('🔥 Firebase inicializado (sync global cross-origin)');
      return true;
    }
  } catch (e) {
    console.warn('⚠️ Firebase não configurado ou erro:', e);
  }
  
  return false;
  */
}

/**
 * Envia estado do player para todos os listeners (local + global)
 */
export async function sendPlayerState(state: PlayerSyncState): Promise<boolean> {
  // 1. Envia via BroadcastChannel (sincronização local - mesma origem)
  if (!bc) initBroadcastChannel();
  try {
    bc?.postMessage(state);
  } catch (e) {
    console.warn('Erro ao enviar via BroadcastChannel:', e);
  }

  // 2. Envia via Firebase (sincronização global - cross-origin)
  if (initFirebaseSync()) {
    try {
      const playerRef = ref(firebaseDb, 'playerSync');
      await set(playerRef, { ...state, timestamp: Date.now() });
    } catch (e) {
      console.warn('Erro ao enviar via Firebase:', e);
    }
  }

  return true;
}

/**
 * Escuta mudanças de estado do player (local + global)
 */
export function listenToPlayerState(callback: (state: PlayerSyncState | null) => void): () => void {
  // 1. Listener BroadcastChannel (local)
  if (!bc) initBroadcastChannel();
  
  const bcHandler = (ev: MessageEvent) => {
    try {
      const data = ev.data as PlayerSyncState;
      callback(data || null);
    } catch (e) {
      console.warn('Erro ao processar mensagem BroadcastChannel:', e);
    }
  };

  if (bc) bc.addEventListener('message', bcHandler);

  // 2. Listener Firebase (global)
  let fbOff: (() => void) | null = null;
  
  if (initFirebaseSync()) {
    try {
      const playerRef = ref(firebaseDb, 'playerSync');
      
      const listener = (snapshot: any) => {
        const state = snapshot.val();
        callback(state || null);
      };
      
      onValue(playerRef, listener);
      
      fbOff = () => {
        off(playerRef);
      };
    } catch (e) {
      console.warn('Erro ao escutar Firebase:', e);
    }
  }

  // Retorna função para cancelar todos os listeners
  return () => {
    if (bc) bc.removeEventListener('message', bcHandler);
    if (fbOff) fbOff();
  };
}

export async function pauseAllPlayers(videoId: string, currentTime: number): Promise<boolean> {
  return sendPlayerState({ isPlaying: false, currentTime, videoId, timestamp: Date.now() });
}

export async function playAllPlayers(videoId: string, currentTime: number): Promise<boolean> {
  return sendPlayerState({ isPlaying: true, currentTime, videoId, timestamp: Date.now() });
}

export async function seekAllPlayers(videoId: string, currentTime: number): Promise<boolean> {
  return sendPlayerState({ isPlaying: true, currentTime, videoId, timestamp: Date.now() });
}
