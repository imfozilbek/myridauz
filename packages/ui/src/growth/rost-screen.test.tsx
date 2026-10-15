import type { StatsClient } from '@platform/api-client';
import type { Rost } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { RostScreen } from './rost-screen';

afterEach(cleanup);

const loops = [
  'qr',
  'req-share',
  'seats',
  'follow',
  'share-join',
  'share-trip',
  'share-driver',
  'share-riders',
] as const;
const ROST: Rost = {
  period: 'week',
  events: 'off',
  loops: loops.map((loop) => ({
    loop,
    came: loop === 'qr' ? 6 : 0,
    registered: loop === 'qr' ? 2 : 0,
    rode: loop === 'qr' ? 1 : 0,
  })),
  directions: [{ route: '1726-1730', searches: 10, found: 7 }],
  at: 0,
};

// «Rost» of the owner (G69, docs/123): each loop and each direction.
describe('«Rost»', () => {
  it('shows what each loop brought and how many searches of a direction found a trip', async () => {
    const rost = vi.fn<StatsClient['rost']>(async (period) => ({ ...ROST, period }));
    renderMarket(<RostScreen onBack={() => undefined} />, testClients({ stats: { rost } }));
    expect(await screen.findByText('Oynadagi QR')).toBeTruthy();
    expect(screen.getByText('6 keldi · 2 roʻyxatdan oʻtdi · 1 safarga chiqdi')).toBeTruthy();
    expect(screen.getByText('Toshkent shahri → Fargʻona viloyati')).toBeTruthy();
    expect(screen.getByText('7 / 10 qidiruvda safar topildi')).toBeTruthy();
    expect(screen.getByText('70%')).toBeTruthy();
    expect(screen.getByText('Kelganlar soni analitika ulanganda chiqadi.')).toBeTruthy();
    await tap('30 kun');
    expect(rost).toHaveBeenLastCalledWith('month');
  });
});
