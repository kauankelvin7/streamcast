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
