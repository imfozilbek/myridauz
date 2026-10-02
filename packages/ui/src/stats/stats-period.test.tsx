import type { Stats, StatsPeriod } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { skeleton } from '../market/list-test-kit';
import { testClients } from '../test-shell';
import { statsOf } from './stats-fixtures';
import { StatsScreen } from './stats-screen';

afterEach(cleanup);

describe('Statistika: a new period (docs/94 S4)', () => {
  it('keeps the numbers of the old period on the screen until the new ones come', async () => {
    let answer: (stats: Stats) => void = () => undefined;
    const get = (period: StatsPeriod) =>
      period === 'day'
        ? Promise.resolve(statsOf(period))
        : new Promise<Stats>((resolve) => (answer = resolve));
    renderMarket(<StatsScreen onBack={() => undefined} />, testClients({ stats: { get } }));
    expect(await screen.findByText('24')).toBeTruthy();
    await tap('7 kun');
    expect(skeleton()).toBeNull();
    expect(screen.getByText('24')).toBeTruthy();
    answer(statsOf('week'));
    expect(await screen.findByText('158')).toBeTruthy();
  });
});
