import { describe, expect, it } from 'vitest';
import { startReply } from '../../bots/start-reply';
import { loadBrand } from '@platform/brands';
import { driverShareStatus, hashToken, newToken, shareStatus } from './domain/share';

const DEPART = Date.parse('2026-10-02T03:00:00Z');
const trip = {
  status: 'confirmed' as const,
  departAt: DEPART,
  departedAt: null,
  boardedAt: null,
  arrivedAt: null,
};

describe('what close people read (docs/43)', () => {
  it('follows the passenger buttons, then the clock', () => {
    expect(shareStatus(trip, DEPART - 1)).toBe('waiting');
    expect(shareStatus({ ...trip, boardedAt: DEPART - 5 }, DEPART - 1)).toBe('boarded');
    expect(shareStatus(trip, DEPART + 1)).toBe('on_the_way');
    expect(shareStatus({ ...trip, arrivedAt: DEPART + 9 }, DEPART + 10)).toBe('arrived');
    expect(shareStatus({ ...trip, status: 'completed' }, DEPART + 10)).toBe('completed');
    expect(shareStatus({ ...trip, status: 'cancelled_by_driver' }, DEPART - 1)).toBe('cancelled');
    // «Yoʻlga chiqdim» of the driver before the time (G63).
    expect(shareStatus({ ...trip, departedAt: DEPART - 9 }, DEPART - 1)).toBe('on_the_way');
  });

  it('reads the clock for a driver, who has no boarding step (G18)', () => {
    const own = { status: 'active' as const, departAt: DEPART, departedAt: null, arrivedAt: null, km: 300 };
    expect(driverShareStatus(own, DEPART - 1)).toBe('waiting');
    expect(driverShareStatus({ ...own, departedAt: DEPART - 9 }, DEPART - 1)).toBe('on_the_way');
    // «Yetib keldik» of the driver: the family reads it at once, not hours later by the clock (G63).
    const home = { ...own, departedAt: DEPART - 9, arrivedAt: DEPART + 9 };
    expect(driverShareStatus(home, DEPART + 10)).toBe('arrived');
    expect(driverShareStatus({ ...home, status: 'cancelled' }, DEPART + 10)).toBe('cancelled');
    expect(driverShareStatus({ ...own, status: 'full' }, DEPART + 1)).toBe('on_the_way');
    expect(driverShareStatus(own, DEPART + 6 * 3_600_000)).toBe('completed');
    expect(driverShareStatus({ ...own, status: 'completed' }, DEPART + 1)).toBe('completed');
    expect(driverShareStatus({ ...own, status: 'cancelled' }, DEPART - 1)).toBe('cancelled');
  });

  it('makes tokens nobody can guess and keeps only their hash', async () => {
    const [first, second] = [newToken(), newToken()];
    expect(first).toMatch(/^[\w-]{43}$/u);
    expect(first).not.toBe(second);
    expect(await hashToken(first)).toMatch(/^[0-9a-f]{64}$/u);
    expect(await hashToken(first)).not.toContain(first);
  });

  it('opens the follow mode from the card link in the passenger bot', () => {
    const token = newToken();
    const reply = startReply({
      brand: loadBrand(),
      role: 'passenger',
      chatId: 5,
      access: 'allowed',
      payload: `follow_${token}`,
    });
    expect(JSON.stringify(reply)).toContain(`/?follow=${token}`);
    const plain = startReply({
      brand: loadBrand(),
      role: 'passenger',
      chatId: 5,
      access: 'allowed',
      payload: 'x',
    });
    expect(JSON.stringify(plain)).not.toContain('follow=');
  });
});
