import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

function sendEvent(frame: HTMLIFrameElement, event: string) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://embedmaster.link',
      source: frame.contentWindow,
      data: { source: 'embedmaster_player', event },
    }));
  });
}

afterEach(() => cleanup());

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
});
