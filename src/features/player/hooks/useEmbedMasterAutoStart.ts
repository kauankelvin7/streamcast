import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  isEmbedMasterUrl,
  readEmbedMasterEvent,
  readEmbeddedPlaybackEvent,
  sendEmbedMasterCommand,
} from '../utils/embedMasterBridge';

/**
 * Supports BOTH navigation modes:
 * - Streamcast manually changes the episode (new iframe and mediaKey).
 * - EmbedMaster auto-advances inside the SAME iframe (PlayerJS "next"/"new").
 * Commands must be rearmed for the second case; onLoad alone cannot detect it.
 * Requests are bounded and never override a user's pause.
 */
export function useEmbedMasterAutoStart(
  iframeRef: RefObject<HTMLIFrameElement>,
  mediaKey: string,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase = useRef<'idle' | 'starting' | 'playing' | 'paused' | 'ended' | 'blocked'>('idle');
  const attempts = useRef(0);
  const [lastDiagnostic, setLastDiagnostic] = useState('');

  const debug = useCallback((message: string) => {
    if (new URLSearchParams(window.location.search).get('autoplayDebug') === '1') {
      const entry = new Date().toLocaleTimeString() + ' · ' + message;
      console.info('[Streamcast autoplay]', entry);
      setLastDiagnostic(entry);
      // Third-party embeds may clear DevTools console. Store only state text,
      // never URLs, IDs, tokens, media data or message payloads.
      try {
        const previous = JSON.parse(sessionStorage.getItem('streamcast-autoplay-diagnostics') || '[]') as string[];
        sessionStorage.setItem('streamcast-autoplay-diagnostics', JSON.stringify([...previous.slice(-39), entry]));
      } catch { /* Private browsing / storage blocked: on-screen indicator remains. */ }
    }
  }, []);

  const clearRetry = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const requestPlayback = useCallback(function attemptPlayback() {
    const frame = iframeRef.current;
    if (!frame || !isEmbedMasterUrl(frame.src)) return;
    if (phase.current === 'playing' || phase.current === 'paused' || phase.current === 'ended' || phase.current === 'blocked') return;
    if (attempts.current >= 5) {
      phase.current = 'blocked';
      clearRetry();
      debug('Five attempts completed without play confirmation; waiting for a new episode or user action');
      return;
    }

    phase.current = 'starting';
    clearRetry();
    // Both commands are the officially documented EmbedMaster postMessage protocol.
    sendEmbedMasterCommand(frame, 'mute');
    sendEmbedMasterCommand(frame, 'play');
    attempts.current += 1;
    debug(`mute/play sent: attempt ${attempts.current}/5`);
    if (attempts.current < 5) {
      const delay = [700, 1300, 2200, 3500][attempts.current - 1];
      timer.current = setTimeout(attemptPlayback, delay);
    }
  }, [iframeRef, clearRetry, debug]);

  const startNewInternalEpisode = useCallback((reason: string, delay = 0) => {
    clearRetry();
    attempts.current = 0;
    phase.current = 'idle';
    debug(`New video inside iframe (${reason}); rearming autoplay`);
    if (delay > 0) {
      // PlayerJS "next" can precede the new file becoming ready; "new" wins.
      timer.current = setTimeout(requestPlayback, delay);
    } else {
      requestPlayback();
    }
  }, [requestPlayback, clearRetry, debug]);

  const handleFrameLoad = useCallback(() => {
    if (phase.current === 'ended') {
      // The original iframe may navigate internally without React remounting it.
      startNewInternalEpisode('iframe-load');
    } else {
      debug(`iframe-load: ${phase.current}`);
      requestPlayback();
    }
  }, [startNewInternalEpisode, requestPlayback, debug]);

  useEffect(() => {
    phase.current = 'idle';
    attempts.current = 0;
    clearRetry();
    debug(`Streamcast media changed: ${mediaKey}`);

    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef.current;
      const raw = readEmbedMasterEvent(event, frame);
      if (!raw) return;

      // These two events are documented by PlayerJS for transitions within
      // one embedded player. They do not change the parent iframe's src/key.
      if (raw.event === 'next') {
        startNewInternalEpisode('player-next', 800);
        return;
      }
      if (raw.event === 'new') {
        startNewInternalEpisode('player-new');
        return;
      }

      const playbackEvent = readEmbeddedPlaybackEvent(event, frame);
      if (playbackEvent === 'ready') {
        if (phase.current === 'ended') {
          startNewInternalEpisode('player-init');
        } else {
          requestPlayback();
        }
      } else if (playbackEvent === 'playing') {
        phase.current = 'playing';
        clearRetry();
        debug('Playback confirmed');
      } else if (raw.event === 'userpause' || playbackEvent === 'paused') {
        if (phase.current === 'playing') {
          phase.current = 'paused';
          clearRetry();
          debug('Paused; autoplay retries cancelled');
        }
      } else if (playbackEvent === 'ended') {
        phase.current = 'ended';
        clearRetry();
        debug('Video ended; waiting for next/new/init or next iframe load');
      } else if (playbackEvent === 'error') {
        phase.current = 'blocked';
        clearRetry();
        debug('Playback error; autoplay retries cancelled');
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      clearRetry();
      window.removeEventListener('message', onMessage);
    };
  }, [mediaKey, iframeRef, requestPlayback, clearRetry, startNewInternalEpisode, debug]);

  return { requestPlayback: handleFrameLoad, lastDiagnostic };
}
