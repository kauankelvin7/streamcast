import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import EmbedPlayerPage from './EmbedPlayerPage';

type SyncData = {
  tmdbId: number; type: 'tv' | 'direct' | 'movie'; title: string;
  season: number | null; episode: number | null; startedAt: number; startedBy: string;
  url?: string | null;
};
const fake = vi.hoisted(() => ({
  listener: null as ((payload: any) => void) | null,
  queries: [] as Array<{ key: unknown[]; enabled: boolean }>
}));

vi.mock('@features/sync/hooks/useSync', () => ({
  useSyncListener: (listener: (payload: unknown) => void) => {
    fake.listener = listener;
  }
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey, enabled }: { queryKey: unknown[]; enabled: boolean }) => {
    fake.queries.push({ key: queryKey, enabled });
    if (!enabled) return { data: undefined };
    if (queryKey[2] === 'season') {
      return { data: { episodes: [{ episode_number: 1 }, { episode_number: 2 }] } };
    }
    return { data: { number_of_seasons: 2 } };
  }
}));
vi.mock('@lib/tmdb', () => ({
  tmdb: {
    getTVDetails: vi.fn(),
    getTVSeason: vi.fn(),
    getMovieDetails: vi.fn(),
    getCollectionDetails: vi.fn()
  }
}));
vi.mock('../../../utils/movieAutonext', () => ({ resolveNextMovie: vi.fn(async () => null) }));

const episode: SyncData = {
  tmdbId: 1399, type: 'tv', title: 'Test', season: 1,
  episode: 1, startedAt: 1, startedBy: 'test'
};

function sync(value: SyncData) {
  act(() => { fake.listener?.(value); });
}
function currentFrame(): HTMLIFrameElement {
  const frame = document.querySelector('iframe');
  if (!(frame instanceof HTMLIFrameElement)) throw new Error('Expected iframe');
  return frame;
}
function providerEvent(frame: HTMLIFrameElement, origin: string, status: string) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', {
      origin, source: frame.contentWindow,
      data: {
        type: 'PLAYER_EVENT',
        data: { player_status: status, player_info: { tmdb: 1399, season: 1, episode: 1 } }
      }
    }));
  });
}

beforeEach(() => {
  fake.listener = null;
  fake.queries.length = 0;
  window.history.replaceState(null, '', '/embed');
});
afterEach(() => cleanup());

describe('EmbedPlayerPage integration', () => {
  it('renders a safe waiting state until Firebase sync', () => {
    render(<EmbedPlayerPage />);
    expect(screen.getByText('Aguardando sincronização...')).toBeTruthy();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('loads the default EmbedMaster with muted autoplay params and native API commands', () => {
    render(<EmbedPlayerPage />);
    sync(episode);
    const frame = currentFrame();
    expect(frame.src).toContain('https://embedmaster.link/tv/1399/1/1?welcome_page=off&autoplay=on');
    const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    expect(postMessage).toHaveBeenCalledWith(
      { source: 'embedmaster_player_command', command: 'mute' }, 'https://embedmaster.link'
    );
    expect(postMessage).toHaveBeenCalledWith(
      { source: 'embedmaster_player_command', command: 'play' }, 'https://embedmaster.link'
    );
    postMessage.mockRestore();
  });

  it('moves to the next episode exactly once on verified EmbedMaster end event', () => {
    render(<EmbedPlayerPage />);
    sync(episode);
    const frame = currentFrame();
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://embedmaster.link',
        source: frame.contentWindow,
        data: { source: 'embedmaster_player', event: 'end' }
      }));
    });
    expect(currentFrame().src).toContain('/tv/1399/1/2?');
    // The old frame must not advance the new episode.
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://embedmaster.link', source: frame.contentWindow,
        data: { source: 'embedmaster_player', event: 'end' }
      }));
    });
    expect(currentFrame().src).toContain('/tv/1399/1/2?');
  });

  it('forbids spoofed origin and unrelated video statuses from navigating', () => {
    window.history.replaceState(null, '', '/embed?provider=vidsrc-tw');
    render(<EmbedPlayerPage />);
    sync(episode);
    const frame = currentFrame();
    providerEvent(frame, 'https://evil.example', 'completed');
    providerEvent(frame, 'https://vidsrc.tw', 'paused');
    expect(currentFrame().src).toContain('/tv/1399/1/1?');
    providerEvent(frame, 'https://vidsrc.tw', 'completed');
    expect(currentFrame().src).toContain('/tv/1399/1/2?');
  });

  it('delegates sequential playback to the provider without replacing the iframe', () => {
    window.history.replaceState(null, '', '/embed?provider=vidsrc-me&nativeAutonext=1');
    render(<EmbedPlayerPage />);
    sync(episode);
    const frame = currentFrame();
    expect(frame.src).toContain('/tv/1399/1/1?autoplay=1&autonext=1');
    providerEvent(frame, 'https://vsembed.ru', 'completed');
    expect(currentFrame()).toBe(frame);
    expect(currentFrame().src).toContain('/tv/1399/1/1?autoplay=1&autonext=1');
  });

  it('treats null season in Firebase as season one and still loads its episodes', () => {
    render(<EmbedPlayerPage />);
    sync({ ...episode, season: null, episode: null });
    expect(currentFrame().src).toContain('/tv/1399/1/1?');
    expect(fake.queries.some(q => q.key[2] === 'season' && q.key[3] === 1 && q.enabled)).toBe(true);
  });

  it('uses a real muted HTML5 video element for direct URLs', () => {
    render(<EmbedPlayerPage />);
    sync({ ...episode, type: 'direct', url: 'https://cdn.example.com/trailer.mp4' });
    const video = document.querySelector('video');
    expect(video?.src).toBe('https://cdn.example.com/trailer.mp4');
    expect(video?.muted).toBe(true);
    expect(video?.autoplay).toBe(true);
    expect(document.querySelector('iframe')).toBeNull();
  });
});
