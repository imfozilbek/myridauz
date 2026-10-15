import { describe, expect, it } from 'vitest';
import { directionsOf, reachBy, shareOf, shortageOf, topPainOf } from './domain/gold';
import { randomCode } from '../../shared/codes/random-code';
import { sourceOf } from './domain/sources';
import { mondayStart, orderedPains, waitingOf } from './domain/waiting';

const PAINS = { total: 0, chats: 0, fixed: 0, phone: 0, wait: 0, price: 0, woman: 0, empty: 0, safety: 0 };

describe('the rules of the waitlist (G83, docs/181)', () => {
  it('shows who waits only from 10 passengers, with the share of the first pain', () => {
    expect(waitingOf({ passengers: 9, drivers: 4, withPain: 9 })).toBeNull();
    expect(waitingOf({ passengers: 124, drivers: 12, withPain: 79 })).toEqual({
      passengers: 124,
      drivers: 12,
      share: 64,
    });
  });

  it('keeps the pains in the order of the screen of the role', () => {
    expect(orderedPains('passenger', ['woman', 'chats', 'phone'])).toEqual(['chats', 'phone', 'woman']);
    expect(orderedPains('driver', ['safety', 'empty', 'price'])).toEqual(['empty', 'safety']);
  });

  it('finds Monday 00:00 of Tashkent for the weekly cards', () => {
    const monday = Date.parse('2026-10-11T19:00:00Z');
    expect(mondayStart(Date.parse('2026-10-14T10:00:00Z'))).toBe(monday);
    expect(mondayStart(monday)).toBe(monday);
    expect(mondayStart(monday - 1)).toBe(monday - 7 * 24 * 3_600_000);
  });

  it('names the source by the mark of the first touch and makes random codes', () => {
    expect([null, 'ch-samarqand', 'fr-k7f2qx1a', 'ad-k7f2qx', 'site', 'story'].map(sourceOf)).toEqual([
      'direct',
      'channel',
      'friend',
      'ad',
      'site',
      'other',
    ]);
    expect(randomCode(6)).toMatch(/^[a-z0-9]{6}$/u);
    expect(randomCode(8)).not.toBe(randomCode(8));
  });
});

describe('the numbers of the team (docs/181, docs/183)', () => {
  const rows = directionsOf([
    { region: '1718', role: 'passenger', count: 124 },
    { region: '1718', role: 'driver', count: 9 },
    { region: '1703', role: 'passenger', count: 87 },
    { region: '1703', role: 'driver', count: 1 },
    { region: '1730', role: 'driver', count: 3 },
  ]);

  it('puts the directions with the most people first', () => {
    expect(rows.map((row) => row.region)).toEqual(['1718', '1703', '1730']);
    expect(rows[1]).toEqual({ region: '1703', passengers: 87, drivers: 1 });
  });

  it('finds where drivers are missing: passengers per driver, only where passengers wait', () => {
    expect(shortageOf(rows).map((row) => row.region)).toEqual(['1703', '1718']);
  });

  it('names the most chosen pain and its share, none while nobody waits', () => {
    expect(topPainOf(PAINS)).toBeNull();
    expect(topPainOf({ ...PAINS, total: 10, phone: 4, chats: 7 })).toEqual({ pain: 'chats', share: 70 });
    expect([shareOf(1, 3), shareOf(5, 0)]).toEqual([33, 0]);
  });

  it('sums the first touches by a key of their own, the most opened first', () => {
    const summed = reachBy(
      [
        { key: 'ad-aaaaaa', opened: 3, listed: 1 },
        { key: null, opened: 2, listed: 2 },
        { key: 'ad-bbbbbb', opened: 4, listed: 2 },
      ],
      sourceOf,
    );
    expect(summed).toEqual([
      { key: 'ad', opened: 7, listed: 3 },
      { key: 'direct', opened: 2, listed: 2 },
    ]);
  });
});
