import { toCyrillic } from '@platform/i18n';
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
    expect(await screen.findByText(toCyrillic('Yangi foydalanuvchilar'))).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy();
    // Since the day before (G45, F-A12): 24 new people against 18, 9 trips against 11.
    expect(screen.getByText('↑ 6')).toBeTruthy();
    expect(screen.getByText('↓ 2')).toBeTruthy();
    expect(screen.getAllByText('±0')).toHaveLength(2);
    expect(screen.getByText(toCyrillic('↑ ↓ oldingi 24 soatga nisbatan'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Yoʻlovchi yoʻli'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('60% ketdi'))).toBeTruthy();
    // Where the new people came from and on what (G55, docs/116).
    expect(screen.getByText(toCyrillic('Qayerdan kelishdi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Samarqand shahri | Samarqand tumani'))).toBeTruthy();
    expect(screen.getByText('insta1')).toBeTruthy();
    expect(screen.getByText(toCyrillic('Haydovchi hikoyasi'))).toBeTruthy();
    expect(screen.getByText('iPhone')).toBeTruthy();
    // Crashes first with what broke; a refusal of a rule below, in the words people read (G52).
    const crashes = screen.getByText(toCyrillic('Ilova buzilishlari'));
    const refusals = screen.getByText(toCyrillic('Rad etilgan amallar'));
    expect(crashes.compareDocumentPosition(refusals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('TypeError: x is undefined')).toBeTruthy();
    expect(
      screen.getByText(toCyrillic('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.')),
    ).toBeTruthy();
    expect(screen.getByText(`${toCyrillic('Haydovchi')} · market.review`)).toBeTruthy();
    // The bots under load (G85 T1): a 429 and a lost post are marked.
    expect(screen.getByText(toCyrillic('Botlar xabarlari'))).toBeTruthy();
    expect(screen.getByText('412')).toBeTruthy();
    const passenger = screen.getByText(toCyrillic('429: 1 · yoʻqoldi: 0 · soniyada: 18'));
    expect(passenger.className).toContain('manage-danger');
    expect(screen.getByText(toCyrillic('429: 0 · yoʻqoldi: 0 · soniyada: 6')).className).not.toContain(
      'manage-danger',
    );
    expect(screen.getByText(toCyrillic('Navbat amallari, kuniga'))).toBeTruthy();
    // G97 (docs/226): the questions of the help opened most; after which people still wrote.
    expect(screen.getByText(toCyrillic('Yordam: koʻp ochilgan savollar'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Hamyonni qanday toʻldiraman?'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Javobdan keyin jamoaga yozdi: 9'))).toBeTruthy();
    await tap(toCyrillic('7 kun'));
    expect(await screen.findByText('158')).toBeTruthy();
    expect(get.mock.calls.map(([period]) => period)).toEqual(['day', 'week']);
  });

  it('keeps the numbers and explains when the events are not available', async () => {
    const clients = testClients({ stats: { get: async (period) => statsOf(period, 'off') } });
    renderMarket(<StatsScreen onBack={() => undefined} />, clients);
    expect(
      await screen.findByText(toCyrillic('Voronka va xatolarni koʻrish uchun analitika kaliti kerak.')),
    ).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Ilova buzilishlari'))).toBeNull();
    expect(screen.queryByText(toCyrillic('Botlar xabarlari'))).toBeNull();
    expect(screen.queryByText(toCyrillic('Yordam: koʻp ochilgan savollar'))).toBeNull();
  });
});
