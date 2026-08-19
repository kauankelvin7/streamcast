import { useEffect, useRef, useCallback } from 'react';

interface EpisodeInfo {
  tmdbId: number;
  season: number;
  episode: number;
  totalEpisodes: number;
  totalSeasons: number;
}

interface Options {
  episode: EpisodeInfo;
  onNextEpisode: (season: number, episode: number) => void;
  triggerAt?: number;
  countdownSec?: number;
  enabled?: boolean;
}

export function useAutoNextEpisode({
  episode,
  onNextEpisode,
  triggerAt = 85,
  countdownSec = 10,
  enabled = true,
}: Options) {
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredRef = useRef(false);
  const remainingRef    = useRef(countdownSec);

  // Extrai os campos primitivos do objeto episode.
  // Isso evita que o efeito principal reinicie a cada render do
  // componente pai só porque ele recriou o objeto `episode` com
  // uma referência nova (mesmos valores, ref diferente).
  const { tmdbId, season, episode: ep, totalEpisodes, totalSeasons } = episode;

  const getNext = useCallback(() => {
    if (ep < totalEpisodes)
      return { season, episode: ep + 1 };
    if (season < totalSeasons)
      return { season: season + 1, episode: 1 };
    return null;
  }, [season, ep, totalEpisodes, totalSeasons]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    hasTriggeredRef.current = false;
    window.dispatchEvent(new CustomEvent('nextEpisodeCountdown', { detail: null }));
  }, []);

  const startCountdown = useCallback((next: { season: number; episode: number }) => {
    if (countdownRef.current) return;
    remainingRef.current = countdownSec;
    window.dispatchEvent(
      new CustomEvent('showNextEpisodeCard', { detail: { next, countdown: countdownSec } })
    );
    countdownRef.current = setInterval(() => {
      remainingRef.current -= 1;
      window.dispatchEvent(
        new CustomEvent('nextEpisodeCountdown', { detail: remainingRef.current })
      );
      if (remainingRef.current <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        onNextEpisode(next.season, next.episode);
      }
    }, 1000);
  }, [countdownSec, onNextEpisode]);

  useEffect(() => {
    if (!enabled) return;

    // Resetar ao trocar de episódio
    cancelCountdown();
    hasTriggeredRef.current = false;

    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://vidlink.pro') return;

      const { type, data } = event.data ?? {};

      if (type === 'PLAYER_EVENT' && data?.event === 'timeupdate') {
        if (hasTriggeredRef.current) return;

        const pct = (data.currentTime / data.duration) * 100;

        if (pct >= triggerAt) {
          const next = getNext();
          if (next) {
            hasTriggeredRef.current = true;
            startCountdown(next);
          }
        }
      }

      if (type === 'PLAYER_EVENT' && data?.event === 'ended') {
        if (!hasTriggeredRef.current) {
          const next = getNext();
          if (next) onNextEpisode(next.season, next.episode);
        }
      }

      if (type === 'PLAYER_EVENT' && data?.event === 'pause') {
        cancelCountdown();
      }

      // Salva progresso no localStorage (formato VidLink)
      if (type === 'MEDIA_DATA') {
        localStorage.setItem('vidLinkProgress', JSON.stringify(event.data.data));
      }
    };

    window.addEventListener('message', handler);

    return () => {
      window.removeEventListener('message', handler);
      cancelCountdown();
    };
    // Deps trocadas de `episode` (objeto) para os campos primitivos:
    // o efeito só reinicia quando o episódio de fato muda.
  }, [enabled, triggerAt, tmdbId, season, ep, totalEpisodes, totalSeasons, getNext, startCountdown, cancelCountdown, onNextEpisode]);

  return { cancelCountdown };
}
