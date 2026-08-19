import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, set, onValue, serverTimestamp } from 'firebase/database';

interface WatchPartySession {
  hostId: string;
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  participants: Record<string, Participant>;
  lastSync: number;
}

interface Participant {
  name: string;
  avatar: string;
  status: 'watching' | 'paused' | 'buffering' | 'offline';
}

/**
 * Hook for managing real-time watch party sessions via Firebase
 */
export const useWatchParty = (sessionId: string | null) => {
  const [session, setSession] = useState<WatchPartySession | null>(null);
  const [isHost, setIsHost] = useState(false);
  const db = getDatabase();

  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = ref(db, `sessions/${sessionId}`);
    
    return onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSession(data);
        // In a real app, compare hostId with current userId
        setIsHost(data.hostId === 'current-user-id');
      }
    });
  }, [sessionId, db]);

  const syncPlayback = useCallback((action: 'play' | 'pause' | 'seek', time: number) => {
    if (!sessionId || !isHost) return;

    const sessionRef = ref(db, `sessions/${sessionId}`);
    set(sessionRef, {
      ...session,
      isPlaying: action === 'play',
      currentTime: time,
      lastSync: serverTimestamp(),
    });
  }, [sessionId, isHost, session, db]);

  return {
    session,
    isHost,
    syncPlayback,
  };
};
