import { afterEach, describe, expect, it, vi } from 'vitest';
import { markLowMotion, motionIsLow } from './low-motion';

const ANDROID =
  'Mozilla/5.0 (Linux; Android 10; K) Chrome/120.0 Mobile Safari/537.36 Telegram-Android/11.2.3';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
const reduced = (on: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: on && query.includes('reduce') }));
const lowFor = (userAgent: string) => {
  delete document.documentElement.dataset['motion'];
  markLowMotion(userAgent);
  return motionIsLow();
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset['motion'];
});

describe('fewer animations on a weak phone and by the setting of the person (G43)', () => {
  it('a weak Android, as Telegram names its class', () => {
    reduced(false);
    expect(lowFor(`${ANDROID} (Xiaomi Redmi 9A; Android 10; SDK 29; LOW)`)).toBe(true);
    expect(lowFor(`${ANDROID} (Samsung SM-S918B; Android 14; SDK 34; HIGH)`)).toBe(false);
    expect(lowFor(`${ANDROID} (Samsung SM-A515F; Android 12; SDK 31; AVERAGE)`)).toBe(false);
    expect(lowFor(IPHONE)).toBe(false);
  });

  it('«Reduce motion» of the phone', () => {
    reduced(true);
    expect(lowFor(IPHONE)).toBe(true);
  });
});
