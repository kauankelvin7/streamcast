import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  isEmbedMasterUrl,
  readEmbeddedPlaybackEvent,
  sendEmbedMasterCommand,
} from '../utils/embedMasterBridge';

/**
 * Starting a new episode replaces the cross-origin iframe. Sending play in
 * onLoad alone races the embedded PlayerJS initialization on slow loads.
 *
 * All attempts are bounded, always mute before play, and stop after a genuine
 * playback event or user pause. This doesn't bypass browser autoplay policy.
 */
export function useEmbedMasterAutoStart(
  iframeRef: RefObject<HTMLIFrameElement>,
  mediaKey: string,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase = useRef<'idle' | 'starting' | 'playing' | 'stopped'>('idle');
  const attempts = useRef(0);

  const clearRetry = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const requestPlayback = useCallback(function attemptPlayback() {
    const frame = iframeRef.current;
    if (!frame || !isEmbedMasterUrl(frame.src)) return;
    if (phase.current === 'playing' || phase.current === 'stopped') return;
    if (attempts.current >= 5) {
      phase.current = 'stopped';
      clearRetry();
      return;
    }

    phase.current = 'starting';
    clearRetry();
    // Mute on every attempt before play, even after a navigation.
    sendEmbedMasterCommand(frame, 'mute');
    sendEmbedMasterCommand(frame, 'play');
    attempts.current += 1;
    if (attempts.current < 5) {
      const delay = [700, 1300, 2200, 3500][attempts.current - 1];
      timer.current = setTimeout(attemptPlayback, delay);
    }
  }, [iframeRef, clearRetry]);

  useEffect(() => {
    phase.current = 'idle';
    attempts.current = 0;
    clearRetry();

    const onMessage = (event: MessageEvent) => {
      const playbackEvent = readEmbeddedPlaybackEvent(event, iframeRef.current);
      if (!playbackEvent || !isEmbedMasterUrl(iframeRef.current?.src ?? '')) return;

      if (playbackEvent === 'ready') {
        // The provider's init event confirms PlayerJS is ready to accept play.
        requestPlayback();
      } else if (playbackEvent === 'playing') {
        phase.current = 'playing';
        clearRetry();
      } else if (playbackEvent === 'paused') {
        // Never force playback after an actual pause.
        if (phase.current === 'playing') {
          phase.current = 'stopped';
          clearRetry();
        }
      } else if (playbackEvent === 'ended' || playbackEvent === 'error') {
        phase.current = 'stopped';
        clearRetry();
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      clearRetry();
      window.removeEventListener('message', onMessage);
    };
  }, [mediaKey, iframeRef, requestPlayback, clearRetry]);

  return { requestPlayback };
}
