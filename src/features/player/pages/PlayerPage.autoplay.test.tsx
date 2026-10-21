import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readWatchProgress } from '../utils/watchProgress';
import PlayerPage from './PlayerPage';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ type: 'tv', tmdbId: '1399' }),
  useLocation: () => ({ state: { season: 3, episode: 1 } }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@features/sync/hooks/useSync', () => ({ useSyncListener: vi.fn() }));
vi.mock('@lib/tmdb', () => ({ tmdb: { getTVDetails: vi.fn(), getTVSeason: vi.fn() } }));
vi.mock('../../../utils/movieAutonext', () => ({ resolveNextMovie: vi.fn(async () => null) }));
vi.mock('../../../utils/cacheManager', () => ({ silentCacheCleanup: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => ({
    data: queryKey[2] === 'season'
      ? { episodes: [{ episode_number: 1 }, { episode_number: 2 }, { episode_number: 3 }] }
      : { number_of_seasons: 4 },
  }),
}));

function sendEvent(frame: HTMLIFrameElement, event: string, origin = 'https://embedmaster.link', info?: unknown) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', {
      origin,
      source: frame.contentWindow,
      data: { source: 'embedmaster_player', event, info },
    }));
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  sessionStorage.removeItem('streamcast-autoplay-diagnostics');
});

describe('/watch episode-to-episode autoplay', () => {
  it('recreates the iframe, re-sends muted play, and ignores old-frame end messages', () => {
    const view = render(<PlayerPage />);
    const frame1 = view.container.querySelector('iframe')!;
    expect(frame1.src).toContain('/tv/1399/3/1?');
    const post1 = vi.spyOn(frame1.contentWindow!, 'postMessage');
    fireEvent.load(frame1);
    expect(post1).toHaveBeenCalledWith(
      { source: 'embedmaster_player_command', command: 'mute' }, 'https://embedmaster.link'
    );
    sendEvent(frame1, 'end');

    const frame2 = view.container.querySelector('iframe')!;
    expect(frame2).not.toBe(frame1);
    expect(frame2.src).toContain('/tv/1399/3/2?');
    const post2 = vi.spyOn(frame2.contentWindow!, 'postMessage');
    fireEvent.load(frame2);
    sendEvent(frame2, 'init');
    expect(post2.mock.calls.some(([value]) => (value as { command: string }).command === 'mute')).toBe(true);
    expect(post2.mock.calls.some(([value]) => (value as { command: string }).command === 'play')).toBe(true);

    sendEvent(frame1, 'end');
    expect(view.container.querySelector('iframe')?.src).toContain('/tv/1399/3/2?');
    post1.mockRestore();
    post2.mockRestore();
  });
  it('calls mute and play again after the provider changes episode internally via new', () => {
    const view = render(<PlayerPage />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'play');
    const initialCommands = post.mock.calls.length;
    // Provider-native autoplay countdown changes the video without changing React state.
    sendEvent(frame, 'new');
    expect(view.container.querySelector('iframe')).toBe(frame);
    expect(post).toHaveBeenCalledTimes(initialCommands + 4);
    expect(post).toHaveBeenNthCalledWith(initialCommands + 1,
      { source: 'embedmaster_player_command', command: 'mute' }, 'https://embedmaster.link');
    expect(post).toHaveBeenNthCalledWith(initialCommands + 3,
      { source: 'embedmaster_player_command', command: 'play' }, 'https://embedmaster.link');
    expect(post).toHaveBeenNthCalledWith(initialCommands + 4,
      { source: 'embedmaster_player_command', command: 'play' }, 'https://embdmstrplayer.com');
    post.mockRestore();
  });

  it('rearms autoplay when PlayerJS new arrives from the redirected player origin', () => {
    const view = render(<PlayerPage />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'play', 'https://embdmstrplayer.com');
    const count = post.mock.calls.length;
    sendEvent(frame, 'new', 'https://embdmstrplayer.com');
    expect(post.mock.calls.length).toBe(count + 4);
    expect(view.container.querySelector('iframe')).toBe(frame);
    post.mockRestore();
  });

  it('shows a persistent on-screen diagnostic when provider scripts clear the console', () => {
    window.history.replaceState(null, '', '/watch/tv/1399?autoplayDebug=1');
    const view = render(<PlayerPage />);
    const frame = view.container.querySelector('iframe')!;
    const overlay = view.getByTestId('autoplay-diagnostic');
    expect(overlay.textContent).toContain('Streamcast media changed');
    fireEvent.load(frame);
    sendEvent(frame, 'play', 'https://embdmstrplayer.com');
    expect(overlay.textContent).toContain('Playback confirmed');
    expect(sessionStorage.getItem('streamcast-autoplay-diagnostics')).toContain('Playback confirmed');
  });

  it('bookmarks a provider-native episode change without remounting, then restores it after reload', () => {
    const view = render(<PlayerPage />);
    const frame = view.container.querySelector('iframe')!;
    expect(frame.src).toContain('/tv/1399/3/1?');
    sendEvent(frame, 'play', 'https://embdmstrplayer.com');
    sendEvent(frame, 'next', 'https://embdmstrplayer.com');
    sendEvent(frame, 'new', 'https://embdmstrplayer.com');
    expect(view.container.querySelector('iframe')).toBe(frame);
    expect(readWatchProgress('tv', '1399')).toMatchObject({ season: 3, episode: 2, seconds: 0 });
    view.unmount();
    const restored = render(<PlayerPage />);
    expect(restored.container.querySelector('iframe')?.src).toContain('/tv/1399/3/2?');
    restored.unmount();
  });

  it('bookmarks seconds and sends documented seek after page reload', () => {
    const view = render(<PlayerPage />);
    const frame = view.container.querySelector('iframe')!;
    sendEvent(frame, 'time', 'https://embdmstrplayer.com', 142);
    expect(readWatchProgress('tv', 1399)?.seconds).toBe(142);
    view.unmount();
    const restored = render(<PlayerPage />);
    const newFrame = restored.container.querySelector('iframe')!;
    const post = vi.spyOn(newFrame.contentWindow!, 'postMessage');
    sendEvent(newFrame, 'time', 'https://embdmstrplayer.com', 1);
    expect(post).toHaveBeenCalledWith(
      { source: 'embedmaster_player_command', command: 'seek', value: 142 },
      'https://embdmstrplayer.com'
    );
    expect(readWatchProgress('tv', 1399)?.seconds).toBe(142);
    post.mockRestore();
    restored.unmount();
  });

  it('remembers the most recent episode after several automatic transitions', () => {
    const view = render(<PlayerPage />);
    const frame = view.container.querySelector('iframe')!;
    sendEvent(frame, 'play', 'https://embdmstrplayer.com');
    sendEvent(frame, 'new', 'https://embdmstrplayer.com');
    expect(readWatchProgress('tv', '1399')).toMatchObject({ season: 3, episode: 2 });
    sendEvent(frame, 'play', 'https://embdmstrplayer.com');
    sendEvent(frame, 'new', 'https://embdmstrplayer.com');
    // A duplicate transition within a few seconds is ignored, not counted twice.
    expect(readWatchProgress('tv', '1399')).toMatchObject({ season: 3, episode: 2 });
    view.unmount();
  });

});
