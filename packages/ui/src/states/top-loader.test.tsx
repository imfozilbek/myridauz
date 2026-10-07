import { activity, counted } from '@platform/api-client';
import { act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { ScreenSkeleton } from './screen-skeleton';

const bar = () => document.querySelector('.top-loader');
// Work the screen waits for, through the one counter of the API (docs/121 §3).
const wait = (ms: number) =>
  act(() => {
    void counted(() => new Promise((resolve) => setTimeout(resolve, ms)));
  });
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// The thin line of the Mini App color at the very top (docs/121 §3, G72, mockup g66/4).
describe('top loader (G72)', () => {
  it('never shows for a fast answer', async () => {
    renderInShell(<div />);
    await wait(200);
    await pass(400);
    expect(bar()).toBeNull();
  });

  it('shows after 300 ms and stays at least 400 ms', async () => {
    renderInShell(<div />);
    await wait(350);
    await pass(310);
    expect(bar()).not.toBeNull();
    // The answer came at 350 ms: the line stays until 300 + 400 ms, then leaves.
    await pass(300);
    expect(bar()).not.toBeNull();
    await pass(400);
    expect(bar()).toBeNull();
  });

  it('leaves for good when a fast request comes while it fades', async () => {
    renderInShell(<div />);
    await wait(350);
    await pass(710);
    await wait(50);
    await pass(1000);
    expect(bar()).toBeNull();
  });
});

// The code of a screen loads behind its skeleton: the line runs the same (docs/121 §3).
describe('top loader and the code of a screen (G72)', () => {
  it('counts the skeleton of a screen while it stands', async () => {
    const { unmount } = renderInShell(<ScreenSkeleton />);
    expect(activity.busy()).toBe(1);
    await act(async () => unmount());
    expect(activity.busy()).toBe(0);
  });
});
