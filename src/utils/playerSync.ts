/**
 * Sincronização de player em tempo real via Firebase
 * Permite controlar play/pause/seek em todos os players conectados
 */

/**
 * Player synchronization utilities.
 * Primary channel: BroadcastChannel (local / simple multi-tab/users on same origin)
 * Optional: Firebase realtime database if `api/firebase` is configured.
 */

export interface PlayerSyncState {
  isPlaying: boolean;
  currentTime: number;
  videoId: string;
  timestamp: number;
}

let bc: BroadcastChannel | null = null;
let firebaseAvailable = false;
let firebaseUnsubscribe: (() => void) | null = null;

// Try to initialize BroadcastChannel
function initBroadcastChannel() {
  try {
    bc = new BroadcastChannel('streamcast-player-sync');
  } catch (e) {
    bc = null;
  }
}

// Try to dynamically load firebase integration if available
async function initFirebaseIfAvailable(): Promise<boolean> {
  if (firebaseAvailable) return true;
  try {
    // dynamic import to avoid build errors when module not present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fb = require('../api/firebase');
    if (fb && typeof fb.initFirebase === 'function' && fb.initFirebase()) {
      const { getDatabase } = require('firebase/database');
      const db = getDatabase();
      firebaseAvailable = true;
      return true;
    }
  } catch (e) {
    // firebase not configured, ignore
  }
  return false;
}

export async function sendPlayerState(state: PlayerSyncState): Promise<boolean> {
  // send via BroadcastChannel
  if (!bc) initBroadcastChannel();
  try {
    bc?.postMessage(state);
  } catch (e) {}

  // try firebase if available
  try {
    const ok = await initFirebaseIfAvailable();
    if (ok) {
      const { getDatabase, ref, set } = require('firebase/database');
      const db = getDatabase();
      const playerRef = ref(db, 'playerSync');
      await set(playerRef, { ...state, timestamp: Date.now() });
    }
  } catch (e) {
    // ignore firebase errors
  }

  return true;
}

export function listenToPlayerState(callback: (state: PlayerSyncState | null) => void): () => void {
  // BroadcastChannel listener
  if (!bc) initBroadcastChannel();
  const bcHandler = (ev: MessageEvent) => {
    try {
      const data = ev.data as PlayerSyncState;
      callback(data || null);
    } catch (e) {}
  };

  if (bc) bc.addEventListener('message', bcHandler);

  // Firebase listener (optional)
  let fbOff: (() => void) | null = null;
  initFirebaseIfAvailable().then((ok) => {
    if (!ok) return;
    try {
      const { getDatabase, ref, onValue, off } = require('firebase/database');
      const db = getDatabase();
      const playerRef = ref(db, 'playerSync');
      const listener = (snapshot: any) => {
        const state = snapshot.val();
        callback(state || null);
      };
      onValue(playerRef, listener);
      fbOff = () => off(playerRef);
    } catch (e) {}
  });

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
