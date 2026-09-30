import { afterEach, describe, expect, it, vi } from 'vitest';
import { onAppVisible } from './app-visible';

afterEach(() => vi.restoreAllMocks());

describe('coming back to the Mini App (docs/64)', () => {
  it('calls the listener when the app shows again, not when it hides, until stopped', () => {
    const listener = vi.fn();
    const stop = onAppVisible(listener);
    const state = vi.spyOn(document, 'visibilityState', 'get');
    state.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(listener).not.toHaveBeenCalled();
    state.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
