import { useCallback, useEffect, useState } from 'react';
import { ref, set, onValue, off } from 'firebase/database';
import { rtdb, auth } from '@lib/firebase';

export interface SyncPayload {
  tmdbId: number | string;
  type: 'movie' | 'tv' | 'anime' | 'youtube' | 'direct';
  title: string;
  // null em vez de undefined — Firebase não aceita undefined
  season: number | null;
  episode: number | null;
  startedAt: number;
  startedBy: string;
  url?: string | null;
}

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncContent = useCallback(async (content: {
    tmdbId: number | string;
    type: 'movie' | 'tv' | 'anime' | 'youtube' | 'direct';
    title: string;
    season?: number;
    episode?: number;
    url?: string;
  }) => {
    setIsSyncing(true);
    try {
      // Converte undefined → null para o Firebase não rejeitar
      const payload: SyncPayload = {
        tmdbId:    content.tmdbId,
        type:      content.type,
        title:     content.title,
        season:    content.season  ?? null,
        episode:   content.episode ?? null,
        startedAt: Date.now(),
        startedBy: auth.currentUser?.uid ?? 'anonymous',
        url:       content.url ?? null,
      };
      await set(ref(rtdb, 'sync/currentContent'), payload);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { syncContent, isSyncing };
}

// Hook para qualquer player ouvir — NÃO requer autenticação
// Funciona em sites externos com o player embedado
export function useSyncListener(
  onSync: (payload: SyncPayload) => void
) {
  useEffect(() => {
    const syncRef = ref(rtdb, 'sync/currentContent');

    const unsubscribe = onValue(syncRef, (snapshot) => {
      const data = snapshot.val() as SyncPayload | null;
      if (data?.tmdbId) {
        onSync(data);
      }
    });

    return () => off(syncRef, 'value', unsubscribe);
  }, [onSync]);
}