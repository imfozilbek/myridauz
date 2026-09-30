import { describe, expect, it } from 'vitest';
import { feedName, signalsOf } from './domain/feed-signals';

describe('who hears "something changed" (docs/64)', () => {
  it('is the person of every bot message, once per Mini App, never a channel', () => {
    expect(
      signalsOf([
        { bot: 'passenger', chatId: 5 },
        { bot: 'passenger', chatId: 5 },
        { bot: 'driver', chatId: 5 },
        { bot: 'admin', chatId: 7 },
        { bot: 'passenger', chatId: '@ch_samarqand' },
      ]),
    ).toEqual([
      { userId: 5, app: 'passenger' },
      { userId: 5, app: 'driver' },
      { userId: 7, app: 'admin' },
    ]);
    expect(signalsOf([])).toEqual([]);
  });

  it('keeps one channel per person', () => {
    expect(feedName(42)).toBe('u42');
  });
});
