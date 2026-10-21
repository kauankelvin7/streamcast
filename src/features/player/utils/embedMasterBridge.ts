/** EmbedMaster starts on embedmaster.link but can navigate the very same iframe
 * to embdmstrplayer.com/v2. Observed in Edge on 21 Oct 2026.
 * postMessage requires the RECEIVER'S actual origin, not iframe.src's attribute.
 * Trust only these exact vendor origins and the original frame window.
 */
export const EMBEDMASTER_ORIGIN = 'https://embedmaster.link';
export const EMBEDMASTER_PLAYER_ORIGIN = 'https://embdmstrplayer.com';
const TRUSTED_EMBEDMASTER_ORIGINS = [EMBEDMASTER_ORIGIN, EMBEDMASTER_PLAYER_ORIGIN] as const;
export const isEmbedMasterUrl = (url: string) => {
  try { return new URL(url).origin === EMBEDMASTER_ORIGIN; } catch { return false; }
};
export function sendEmbedMasterCommand(frame: HTMLIFrameElement | null, command: 'mute' | 'play' | 'seek', value?: number) {
  if (!frame?.contentWindow || !isEmbedMasterUrl(frame.src)) return;
  // Only ONE origin matches the current document; the other gets discarded by
  // the browser. Never broadcast to "*" or a third-party ad/streaming origin.
  const payload = value === undefined
    ? { source: 'embedmaster_player_command', command }
    : { source: 'embedmaster_player_command', command, value };
  for (const origin of TRUSTED_EMBEDMASTER_ORIGINS) {
    frame.contentWindow.postMessage(payload, origin);
  }
}
export function readEmbedMasterEvent(event: MessageEvent, frame: HTMLIFrameElement | null) {
  if (!frame?.contentWindow || !isEmbedMasterUrl(frame.src)
    || !TRUSTED_EMBEDMASTER_ORIGINS.includes(event.origin as typeof TRUSTED_EMBEDMASTER_ORIGINS[number])
    || event.source !== frame.contentWindow) return null;
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

  // Other integrations do not currently document cross-origin redirect relays.
  if (event.origin !== origin) return null;
  if (origin === 'https://vidsrc.tw' || origin === 'https://vsembed.ru') {
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
