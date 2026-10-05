import type { StatsClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { statsOf } from './stats-fixtures';
import { StatsScreen } from './stats-screen';

afterEach(cleanup);

describe('Statistika of the team (docs/29)', () => {
  it('shows the numbers of a day, the funnel with the drops and the errors; switches to 7 days', async () => {
    const get = vi.fn<StatsClient['get']>(async (period) => statsOf(period));
    renderMarket(<StatsScreen onBack={() => undefined} />, testClients({ stats: { get } }));
    expect(await screen.findByText('Yangi foydalanuvchilar')).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchi yoʻli')).toBeTruthy();
    expect(screen.getByText('60% ketdi')).toBeTruthy();
    // Where the new people came from and on what (G55, docs/116).
    expect(screen.getByText('Qayerdan kelishdi')).toBeTruthy();
    expect(screen.getByText('yol-samarqand')).toBeTruthy();
    expect(screen.getByText('insta1')).toBeTruthy();
    expect(screen.getByText('Haydovchi hikoyasi')).toBeTruthy();
    expect(screen.getByText('iPhone')).toBeTruthy();
    // Crashes first with what broke; a refusal of a rule below, in the words people read (G52).
    const crashes = screen.getByText('Ilova buzilishlari');
    const refusals = screen.getByText('Rad etilgan amallar');
    expect(crashes.compareDocumentPosition(refusals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('TypeError: x is undefined')).toBeTruthy();
    expect(screen.getByText('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.')).toBeTruthy();
    expect(screen.getByText('Haydovchi · market.review')).toBeTruthy();
    await tap('7 kun');
    expect(await screen.findByText('158')).toBeTruthy();
    expect(get.mock.calls.map(([period]) => period)).toEqual(['day', 'week']);
  });

  it('keeps the numbers and explains when the events are not available', async () => {
    const clients = testClients({ stats: { get: async (period) => statsOf(period, 'off') } });
    renderMarket(<StatsScreen onBack={() => undefined} />, clients);
    expect(
      await screen.findByText('Voronka va xatolarni koʻrish uchun analitika kaliti kerak.'),
    ).toBeTruthy();
    expect(screen.queryByText('Ilova buzilishlari')).toBeNull();
  });
});
