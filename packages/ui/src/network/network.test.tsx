import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { markExpired } from './session-expired';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const goOffline = (online: boolean) => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  act(() => void window.dispatchEvent(new Event(online ? 'online' : 'offline')));
};

describe('the connection of the whole app (G43)', () => {
  it('says the network is gone above the screen and keeps the screen', () => {
    renderInShell(<p>my trips</p>);
    expect(screen.queryByText('Internet yoʻq')).toBeNull();
    goOffline(false);
    expect(screen.getByText('Internet yoʻq')).toBeTruthy();
    expect(screen.getByText('my trips')).toBeTruthy();
    goOffline(true);
    expect(screen.queryByText('Internet yoʻq')).toBeNull();
  });

  // The last test: an old launch stays old for the rest of the app.
  it('asks to open the app again once the launch is too old', () => {
    renderInShell(<p>my trips</p>);
    act(() => markExpired());
    expect(screen.getByText('Ilovani qayta oching')).toBeTruthy();
    expect(screen.queryByText('my trips')).toBeNull();
  });
});
