import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useEmbedMasterAutoStart } from './useEmbedMasterAutoStart';

function Harness({ episode }: { episode: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const { requestPlayback } = useEmbedMasterAutoStart(ref, `tv:1399:1:${episode}:embedmaster`);
  return <iframe
    key={episode}
    data-testid="player"
    ref={ref}
    src={`https://embedmaster.link/tv/1399/1/${episode}?autoplay=on&welcome_page=off`}
    onLoad={requestPlayback}
    title="player"
  />;
}
function sendEvent(frame: HTMLIFrameElement, event: string, origin = 'https://embedmaster.link') {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', {
      origin,
      source: frame.contentWindow,
      data: { source: 'embedmaster_player', event },
    }));
  });
}

describe('EmbedMaster muted autoplay after changing episodes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('retries documented commands until actual play, then stops forever for that episode', () => {
    const { container } = render(<Harness episode={1}/>);
    const frame = container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    expect(post).toHaveBeenNthCalledWith(
      1, { source: 'embedmaster_player_command', command: 'mute' }, 'https://embedmaster.link'
    );
    expect(post).toHaveBeenNthCalledWith(
      2, { source: 'embedmaster_player_command', command: 'mute' }, 'https://embdmstrplayer.com'
    );
    expect(post).toHaveBeenNthCalledWith(
      4, { source: 'embedmaster_player_command', command: 'play' }, 'https://embdmstrplayer.com'
    );
    act(() => vi.advanceTimersByTime(700));
    expect(post).toHaveBeenCalledTimes(8);
    sendEvent(frame, 'play');
    act(() => vi.advanceTimersByTime(20000));
    expect(post).toHaveBeenCalledTimes(8);
    post.mockRestore();
  });

  it('reinitializes the *new* iframe after an episode change', () => {
    const view = render(<Harness episode={1}/>);
    const first = view.container.querySelector('iframe')!;
    const old = vi.spyOn(first.contentWindow!, 'postMessage');
    fireEvent.load(first);
    sendEvent(first, 'end');

    view.rerender(<Harness episode={2}/>);
    const second = view.container.querySelector('iframe')!;
    expect(second).not.toBe(first);
    const next = vi.spyOn(second.contentWindow!, 'postMessage');
    // PlayerJS may initialize after the iframe load event.
    fireEvent.load(second);
    sendEvent(second, 'init');
    expect(next.mock.calls.some(c => (c[0] as { command: string }).command === 'play')).toBe(true);
    expect(next.mock.calls.some(c => (c[0] as { command: string }).command === 'mute')).toBe(true);
    sendEvent(second, 'play');
    const calls = next.mock.calls.length;
    act(() => vi.advanceTimersByTime(20000));
    expect(next).toHaveBeenCalledTimes(calls);
    // Old iframe never receives any retry from the new media lifecycle.
    expect(old).toHaveBeenCalledTimes(4);
    next.mockRestore();
    old.mockRestore();
  });

  it('does not react to spoofed events or endlessly restart after a user pause', () => {
    const view = render(<Harness episode={1}/>);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://attacker.invalid',
        source: frame.contentWindow,
        data: { source: 'embedmaster_player', event: 'play' },
      }));
    });
    act(() => vi.advanceTimersByTime(700));
    expect(post).toHaveBeenCalledTimes(8);
    sendEvent(frame, 'play');
    sendEvent(frame, 'userpause');
    const calls = post.mock.calls.length;
    fireEvent.load(frame);
    act(() => vi.advanceTimersByTime(30000));
    expect(post).toHaveBeenCalledTimes(calls);
    post.mockRestore();
  });

  it('caps retries to five and never repeats indefinitely when autoplay is blocked', () => {
    const view = render(<Harness episode={1}/>);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    act(() => vi.advanceTimersByTime(60000));
    expect(post).toHaveBeenCalledTimes(20);
    post.mockRestore();
  });
  it('rearms muted autoplay for a provider-native NEXT without React changing the iframe', () => {
    const view = render(<Harness episode={1} />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'play');
    sendEvent(frame, 'end');
    const afterFirst = post.mock.calls.length;
    sendEvent(frame, 'next');
    act(() => vi.advanceTimersByTime(800));
    expect(view.container.querySelector('iframe')).toBe(frame);
    expect(post).toHaveBeenCalledTimes(afterFirst + 4);
    expect(post).toHaveBeenNthCalledWith(afterFirst + 1,
      { source: 'embedmaster_player_command', command: 'mute' }, 'https://embedmaster.link');
    expect(post).toHaveBeenNthCalledWith(afterFirst + 3,
      { source: 'embedmaster_player_command', command: 'play' }, 'https://embedmaster.link');
    expect(post).toHaveBeenNthCalledWith(afterFirst + 4,
      { source: 'embedmaster_player_command', command: 'play' }, 'https://embdmstrplayer.com');
    sendEvent(frame, 'play');
    const confirmed = post.mock.calls.length;
    act(() => vi.advanceTimersByTime(20000));
    expect(post).toHaveBeenCalledTimes(confirmed);
    post.mockRestore();
  });

  it('uses the provider NEW event to restart retries inside the same iframe', () => {
    const view = render(<Harness episode={1} />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'play');
    const before = post.mock.calls.length;
    sendEvent(frame, 'new');
    expect(post).toHaveBeenCalledTimes(before + 4);
    expect(view.container.querySelector('iframe')).toBe(frame);
    post.mockRestore();
  });

  it('rearms after end if the original iframe fires load again during internal navigation', () => {
    const view = render(<Harness episode={1} />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'end');
    const before = post.mock.calls.length;
    fireEvent.load(frame);
    expect(post).toHaveBeenCalledTimes(before + 4);
    post.mockRestore();
  });

  it('does not restart a manually paused video from a stray init, load or timer', () => {
    const view = render(<Harness episode={1} />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'play');
    sendEvent(frame, 'userpause');
    const pausedCount = post.mock.calls.length;
    sendEvent(frame, 'init');
    fireEvent.load(frame);
    act(() => vi.advanceTimersByTime(20000));
    expect(post).toHaveBeenCalledTimes(pausedCount);
    post.mockRestore();
  });

  it('ignores spoofed provider-native transitions from another origin', () => {
    const view = render(<Harness episode={1} />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'play');
    const before = post.mock.calls.length;
    act(() => window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://malicious.example', source: frame.contentWindow,
      data: { source: 'embedmaster_player', event: 'next' },
    })));
    act(() => vi.advanceTimersByTime(20000));
    expect(post).toHaveBeenCalledTimes(before);
    post.mockRestore();
  });

  it('handles real redirected EmbedMaster event origin on internal autoplay transition', () => {
    const view = render(<Harness episode={1} />);
    const frame = view.container.querySelector('iframe')!;
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    fireEvent.load(frame);
    sendEvent(frame, 'play', 'https://embdmstrplayer.com');
    const before = post.mock.calls.length;
    sendEvent(frame, 'new', 'https://embdmstrplayer.com');
    expect(post.mock.calls.length).toBe(before + 4);
    expect(post).toHaveBeenCalledWith(
      { source: 'embedmaster_player_command', command: 'play' }, 'https://embdmstrplayer.com'
    );
    post.mockRestore();
  });

});
