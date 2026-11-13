import type { Paths, StatsPeriod } from '@platform/contracts';
import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { statsOf } from './stats-fixtures';
import { StatsScreen } from './stats-screen';

afterEach(cleanup);

const steps = (counts: readonly number[], ids: readonly string[]) =>
  ids.map((step, index) => ({ step, count: counts[index] ?? 0, drop: index === 0 ? null : 0 }));
const PASSENGER = [
  'opened',
  'from',
  'to',
  'searched',
  'found',
  'trip_opened',
  'requested',
  'confirmed',
  'rode',
];
const DRIVER = ['opened', 'submitted', 'approved', 'trip_created', 'first_booking', 'trip_done'];
const paths = (period: StatsPeriod) =>
  ({
    period,
    events: 'on',
    sources: [
      {
        kind: 'channel',
        people: 42,
        errors: 3,
        paths: [
          { role: 'passenger', steps: steps([42, 30, 28, 25, 11, 9, 4, 3, 2], PASSENGER) },
          { role: 'driver', steps: steps([5, 2, 1, 1, 0, 0], DRIVER) },
        ],
      },
    ],
    versions: [{ tg: 'old', people: 3, errors: 7, paths: [] }],
    platforms: [{ platform: 'unknown', people: 2, errors: 5, paths: [] }],
    at: 1,
  }) as Paths;
const OWNER = { me: async () => ({ id: null, firstName: 'Ali', hasAvatar: false, role: 'owner' as const }) };

describe('Statistika: the paths by source and Telegram (G99, docs/234)', () => {
  it('shows each source with its people and errors; a row opens its two paths', async () => {
    const clients = testClients({
      stats: { get: async (period) => statsOf(period), paths: async (period) => paths(period) },
      moderation: OWNER,
    });
    renderMarket(<StatsScreen onBack={() => undefined} />, clients);
    expect(await screen.findByText(toCyrillic('Yoʻl manbalari'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('7.0 dan eski'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Nomaʼlum ilova'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('42 kishi · 3 xato'))).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('42 kishi · 3 xato')));
    expect(await screen.findByText(toCyrillic('Safar topdi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Birinchi yoʻlovchisi'))).toBeTruthy();
  });

  it('sends the files of the analyst to the owner and says so', async () => {
    const asked: StatsPeriod[] = [];
    const clients = testClients({
      stats: {
        get: async (period) => statsOf(period),
        paths: async (period) => paths(period),
        pathsFile: async (period) => void asked.push(period),
      },
      moderation: OWNER,
    });
    renderMarket(<StatsScreen onBack={() => undefined} />, clients);
    fireEvent.click(
      await screen.findByText(toCyrillic('Tahlilchi uchun fayl'), { selector: '.navbat-title' }),
    );
    expect(await screen.findByText(toCyrillic('Fayl botga yuborildi.'))).toBeTruthy();
    expect(asked).toEqual(['day']);
  });
});
