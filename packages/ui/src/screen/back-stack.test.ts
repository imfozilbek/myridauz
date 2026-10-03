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
    vi.useFakeTimers();
    releaseParent();
    vi.runAllTimers();
    vi.useRealTimers();
    expect(api.hide).toHaveBeenCalledOnce();
    expect(listeners).toHaveLength(0);
  });

  // G38 (docs/103): a step of a wizard gives way to the next one in the same moment. Telegram got
  // «hide» and «show» at once, and on a phone «Назад» sometimes stopped answering.
  it('keeps «Назад» on, with one listener, when a step gives way to the next one', () => {
    vi.useFakeTimers();
    const { api, tap, listeners } = native();
    const releaseFirst = claimBack(owner(), api);
    releaseFirst();
    const next = owner();
    const releaseNext = claimBack(next, api);
    vi.runAllTimers();
    expect(api.hide).not.toHaveBeenCalled();
    expect(api.show).toHaveBeenCalledOnce();
    expect(api.onClick).toHaveBeenCalledOnce();
    tap();
    expect(next.press.current).toHaveBeenCalledOnce();
    expect(listeners).toHaveLength(1);
    releaseNext();
    vi.runAllTimers();
    expect(api.hide).toHaveBeenCalledOnce();
    vi.useRealTimers();
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
