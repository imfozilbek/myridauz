import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeTop } from './home-top';

const KEY = 'home_top_height';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

// Calls back at once, as the browser does when it starts to watch.
class SeenAtOnce {
  constructor(private readonly seen: () => void) {}
  observe() {
    this.seen();
  }
  disconnect() {}
}

describe('the trips block of the main screen (G41, docs/108)', () => {
  it('keeps the place of last time while it loads', () => {
    localStorage.setItem(KEY, '150');
    const { container } = render(
      <HomeTop>
        <div aria-busy="true" />
      </HomeTop>,
    );
    const block = container.querySelector<HTMLElement>('.home-top');
    expect(block?.style.getPropertyValue('--home-top-height')).toBe('150px');
    expect(block?.hasAttribute('data-fresh')).toBe(false);
  });

  it('marks the first time on this phone, when the height is not known yet', () => {
    const { container } = render(
      <HomeTop>
        <div aria-busy="true" data-hidden="" />
      </HomeTop>,
    );
    expect(container.querySelector('.home-top')?.hasAttribute('data-fresh')).toBe(true);
  });

  it('remembers the real block, never the gray rows', () => {
    vi.stubGlobal('ResizeObserver', SeenAtOnce);
    render(
      <HomeTop>
        <div aria-busy="true" />
      </HomeTop>,
    );
    expect(localStorage.getItem(KEY)).toBeNull();
    cleanup();
    render(
      <HomeTop>
        <p>Yaqin safarlar</p>
      </HomeTop>,
    );
    expect(localStorage.getItem(KEY)).toBe('0');
  });
});
