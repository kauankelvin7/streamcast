/** Protocol supported by EmbedMaster. Never trust messages from unrelated windows. */
export const EMBEDMASTER_ORIGIN = 'https://embedmaster.link';
export const isEmbedMasterUrl = (url: string) => {
  try { return new URL(url).origin === EMBEDMASTER_ORIGIN; } catch { return false; }
};
export function sendEmbedMasterCommand(frame: HTMLIFrameElement | null, command: 'mute' | 'play') {
  if (!frame?.contentWindow || !isEmbedMasterUrl(frame.src)) return;
  frame.contentWindow.postMessage({ source: 'embedmaster_player_command', command }, EMBEDMASTER_ORIGIN);
}
export function readEmbedMasterEvent(event: MessageEvent, frame: HTMLIFrameElement | null) {
  if (!frame?.contentWindow || !isEmbedMasterUrl(frame.src) || event.origin !== EMBEDMASTER_ORIGIN || event.source !== frame.contentWindow) return null;
  const data = event.data;
  if (!data || typeof data !== 'object' || data.source !== 'embedmaster_player' || typeof data.event !== 'string') return null;
  return data as { source: string; event: string; info?: unknown };
}

/**
 * Normalize only providers that document postMessage events.
 * Unknown iframe messages are ignored; in particular, an untrusted
 * advertising iframe must never be able to advance a playlist.
 */
export type EmbeddedPlaybackEvent = 'playing' | 'paused' | 'ended' | 'ready' | 'error';
export function readEmbeddedPlaybackEvent(
  event: MessageEvent,
  frame: HTMLIFrameElement | null
): EmbeddedPlaybackEvent | null {
  if (!frame?.contentWindow || event.source !== frame.contentWindow) return null;
  let origin: string;
  try { origin = new URL(frame.src).origin; } catch { return null; }
  if (event.origin !== origin) return null;

  if (origin === EMBEDMASTER_ORIGIN) {
    const message = readEmbedMasterEvent(event, frame);
    if (!message) return null;
    // PlayerJS emits "end" (not "ended"); "finish" can include advertising.
    if (message.event === 'end' || message.event === 'ended') return 'ended';
    if (message.event === 'play' || message.event === 'start') return 'playing';
    if (message.event === 'pause' || message.event === 'userpause') return 'paused';
    if (message.event === 'init') return 'ready';
    if (message.event === 'error' || message.event === 'loaderror') return 'error';
    return null;
  }

  if (origin === 'https://vidsrc.tw') {
    const data = event.data;
    if (!data || typeof data !== 'object' || data.type !== 'PLAYER_EVENT'
      || !data.data || typeof data.data !== 'object') return null;
    const status = data.data.player_status;
    if (status === 'completed') return 'ended';
    if (status === 'playing') return 'playing';
    if (status === 'paused') return 'paused';
    return null;
  }
  return null;
}
