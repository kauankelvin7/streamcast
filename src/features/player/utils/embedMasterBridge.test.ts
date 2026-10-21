import { describe, it, expect, vi } from 'vitest';
import { isEmbedMasterUrl, sendEmbedMasterCommand, readEmbedMasterEvent, readEmbeddedPlaybackEvent, EMBEDMASTER_ORIGIN, EMBEDMASTER_PLAYER_ORIGIN } from './embedMasterBridge';

describe('EmbedMaster bridge', () => {
  it('only accepts the documented provider origin', () => {
    expect(isEmbedMasterUrl('https://embedmaster.link/movie/550')).toBe(true);
    expect(isEmbedMasterUrl('https://embedmaster.link.evil.test/movie/550')).toBe(false);
  });
  it('uses the documented mute/play command structure', () => {
    const postMessage = vi.fn();
    const frame = { src: 'https://embedmaster.link/movie/550', contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
    sendEmbedMasterCommand(frame, 'mute');
    sendEmbedMasterCommand(frame, 'play');
    expect(postMessage).toHaveBeenCalledWith({ source: 'embedmaster_player_command', command: 'mute' }, EMBEDMASTER_ORIGIN);
    expect(postMessage).toHaveBeenCalledWith({ source: 'embedmaster_player_command', command: 'play' }, EMBEDMASTER_ORIGIN);
    expect(postMessage).toHaveBeenCalledWith({ source: 'embedmaster_player_command', command: 'mute' }, EMBEDMASTER_PLAYER_ORIGIN);
    expect(postMessage).toHaveBeenCalledWith({ source: 'embedmaster_player_command', command: 'play' }, EMBEDMASTER_PLAYER_ORIGIN);
    expect(postMessage).toHaveBeenCalledTimes(4);
  });
  it('ignores spoofed and unrelated postMessage events', () => {
    const win = {} as Window;
    const frame = { src: 'https://embedmaster.link/tv/1/1/1', contentWindow: win } as HTMLIFrameElement;
    const valid = { origin: EMBEDMASTER_ORIGIN, source: win, data: { source: 'embedmaster_player', event: 'ended' } } as unknown as MessageEvent;
    expect(readEmbedMasterEvent(valid, frame)?.event).toBe('ended');
    expect(readEmbedMasterEvent({ ...valid, origin: EMBEDMASTER_PLAYER_ORIGIN }, frame)?.event).toBe('ended');
    expect(readEmbedMasterEvent({ ...valid, origin: 'https://embdmstrplayer.com.evil.example' }, frame)).toBeNull();
    expect(readEmbedMasterEvent({ ...valid, origin: 'https://evil.test' }, frame)).toBeNull();
    expect(readEmbedMasterEvent({ ...valid, source: ({} as Window) }, frame)).toBeNull();
    expect(readEmbedMasterEvent({ ...valid, data: { event: 'ended' } }, frame)).toBeNull();
  });
  it('recognizes the real PlayerJS end event rather than advertisement finish', () => {
    const win = {} as Window;
    const frame = { src: 'https://embedmaster.link/tv/1399/1/1', contentWindow: win } as HTMLIFrameElement;
    const event = { origin: EMBEDMASTER_ORIGIN, source: win, data: { source: 'embedmaster_player', event: 'end' } } as MessageEvent;
    expect(readEmbeddedPlaybackEvent(event, frame)).toBe('ended');
    expect(readEmbeddedPlaybackEvent({ ...event, origin: EMBEDMASTER_PLAYER_ORIGIN }, frame)).toBe('ended');
    expect(readEmbeddedPlaybackEvent({ ...event, data: { source: 'embedmaster_player', event: 'finish' } }, frame)).toBeNull();
  });

  it('supports VidSrc TW documented PLAYER_EVENT statuses only from active iframe', () => {
    const win = {} as Window;
    const frame = { src: 'https://vidsrc.tw/embed/tv/1399/1/1?autoplay=1', contentWindow: win } as HTMLIFrameElement;
    const event = { origin: 'https://vidsrc.tw', source: win, data: { type: 'PLAYER_EVENT', data: { player_status: 'completed' } } } as MessageEvent;
    expect(readEmbeddedPlaybackEvent(event, frame)).toBe('ended');
    expect(readEmbeddedPlaybackEvent({ ...event, origin: 'https://vidsrc.tw.evil.test' }, frame)).toBeNull();
    expect(readEmbeddedPlaybackEvent({ ...event, source: ({} as Window) }, frame)).toBeNull();
    expect(readEmbeddedPlaybackEvent({ ...event, data: { type: 'PLAYER_EVENT', data: { player_status: 'unknown' } } }, frame)).toBeNull();
    const migratedFrame = { src: 'https://vsembed.ru/embed/tv/1399/1/1?autoplay=1', contentWindow: win } as HTMLIFrameElement;
    expect(readEmbeddedPlaybackEvent({ ...event, origin: 'https://vsembed.ru' }, migratedFrame)).toBe('ended');
    expect(readEmbeddedPlaybackEvent(event, migratedFrame)).toBeNull();
  });

});
