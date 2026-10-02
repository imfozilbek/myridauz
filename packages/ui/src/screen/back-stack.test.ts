import { describe, expect, it, vi } from 'vitest';
import { claimBack, type NativeBack } from './back-stack';

const native = () => {
  const listeners: (() => void)[] = [];
  const api: NativeBack = {
    show: vi.fn(),
    hide: vi.fn(),
    onClick: vi.fn((listener: () => void) => {
      listeners.push(listener);
      return () => listeners.splice(listeners.indexOf(listener), 1);
    }),
  };
  return { api, tap: () => listeners.forEach((listener) => listener()), listeners };
};
const owner = (overlay = false) => {
  const press = { current: vi.fn() };
  return { overlay, press };
};

describe('«Назад» of Telegram (docs/94 B1, B2)', () => {
  it('one tap is one step: only the newest screen goes back', () => {
    const { api, tap, listeners } = native();
    const parent = owner();
    const child = owner();
    const releaseParent = claimBack(parent, api);
    const releaseChild = claimBack(child, api);
    tap();
    expect(child.press.current).toHaveBeenCalledOnce();
    expect(parent.press.current).not.toHaveBeenCalled();
    expect(listeners).toHaveLength(1);
    // The child leaves: «Назад» stays for the parent, it does not hide.
    releaseChild();
    expect(api.hide).not.toHaveBeenCalled();
    tap();
    expect(parent.press.current).toHaveBeenCalledOnce();
    releaseParent();
    expect(api.hide).toHaveBeenCalledOnce();
    expect(listeners).toHaveLength(0);
  });

  it('a camera or a window takes «Назад» before the screen, even if the screen came later', () => {
    const { api, tap } = native();
    const camera = owner(true);
    const screen = owner();
    const releaseCamera = claimBack(camera, api);
    const releaseScreen = claimBack(screen, api);
    tap();
    expect(camera.press.current).toHaveBeenCalledOnce();
    expect(screen.press.current).not.toHaveBeenCalled();
    releaseCamera();
    tap();
    expect(screen.press.current).toHaveBeenCalledOnce();
    releaseScreen();
  });
});
