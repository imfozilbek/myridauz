import { counted } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { splashHtml } from './splash-html';

const LOGO = '<svg viewBox="0 0 64 64"><rect rx="14"/><path d="M1 1Z"/></svg>';
const splash = () => document.getElementById('splash');
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const load = (ms: number) =>
  act(() => {
    void counted(() => new Promise((resolve) => setTimeout(resolve, ms)));
  });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  const { head, body } = splashHtml(loadBrand(), LOGO, '');
  document.head.insertAdjacentHTML('beforeend', head);
  document.body.insertAdjacentHTML('afterbegin', body);
});
afterEach(() => {
  cleanup();
  splash()?.remove();
  document.getElementById('splash-style')?.remove();
  vi.useRealTimers();
});

// The splash stands at least 0,6 s, while the first screen loads, then fades out by itself
// (docs/121 §4, G72).
describe('splash (G72)', () => {
  it('stands at least 0,6 s even when the first screen is ready at once, then leaves for good', async () => {
    const { tracked } = renderInShell(<div />);
    await pass(500);
    expect(splash()?.className).toBe('splash');
    await pass(100);
    expect(splash()?.classList.contains('splash-out')).toBe(true);
    await pass(300);
    expect(splash()).toBeNull();
    expect(document.getElementById('splash-style')).toBeNull();
    expect(tracked).toContainEqual({ name: 'app_ready', screen: 'app', ms: 150, client: 'browser' });
  });

  it('stands while the first screen loads, one load after another, and leaves when it is ready', async () => {
    const { tracked } = renderInShell(<div />);
    await load(1000);
    await pass(1100);
    await load(500);
    await pass(600);
    expect(splash()?.className).toBe('splash');
    await pass(100);
    expect(splash()?.classList.contains('splash-out')).toBe(true);
    expect(tracked.find((event) => event.name === 'app_ready')).toMatchObject({ ms: 1750 });
  });
});
