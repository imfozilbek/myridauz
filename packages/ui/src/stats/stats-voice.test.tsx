import { toCyrillic } from '@platform/i18n';
import type { StatsClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { statsOf } from './stats-fixtures';
import { StatsScreen } from './stats-screen';

afterEach(cleanup);

// The row of a title: its hint and its value are in the same row (manage-page).
const rowOf = (title: string | RegExp) => screen.getByText(title).closest('.manage-row')?.textContent ?? '';

// G87 (docs/191): what people feel, in numbers only.
describe('the voice of people in Statistika', () => {
  it('shows who blocked a bot, the ratings, the reasons and how the apps were opened', async () => {
    const get = vi.fn<StatsClient['get']>(async (period) => statsOf(period));
    renderMarket(<StatsScreen onBack={() => undefined} />, testClients({ stats: { get } }));
    expect(await screen.findByText(toCyrillic('Botni bloklaganlar'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Qaytdi: 1'))).toBeTruthy();
    // The bot of the channels lost nobody: it is not in the list of blocks.
    expect(screen.getAllByText(toCyrillic('Kanallar boti'))).toHaveLength(1);
    expect(rowOf(toCyrillic('Oʻrtacha baho'))).toContain('4,6');
    expect(rowOf(toCyrillic('Oʻrtacha baho'))).toContain(toCyrillic('18 ta baho'));
    expect(rowOf(toCyrillic('1 yoki 2 yulduz'))).toContain(toCyrillic('Baholarning 6%'));
    expect(screen.getByText(toCyrillic('Nimasi yoqdi'))).toBeTruthy();
    expect(rowOf(toCyrillic('Vaqtida'))).toContain('11');
    expect(screen.getByText(toCyrillic('Shikoyat sabablari'))).toBeTruthy();
    expect(rowOf(toCyrillic('Kelishilgandan koʻp pul soʻradi'))).toContain('2');
    expect(screen.getByText(toCyrillic('Nega bekor qilishdi'))).toBeTruthy();
    expect(rowOf(toCyrillic('Boshqa yoʻl topdim'))).toContain(toCyrillic('Joy bekor qilindi'));
    expect(rowOf(toCyrillic('Kerakli safar topilmadi'))).toContain(toCyrillic('Maʼlumotlar oʻchirildi'));
    expect(screen.getByText(toCyrillic('Ilova qanday ochildi'))).toBeTruthy();
    // «Bot xabaridan»: the word has the letters of the brand in it, the check reads its start.
    expect(rowOf(/^Бот хабар/u)).toContain('63');
    expect(rowOf(toCyrillic('Havola orqali'))).toContain('22');
  });

  it('keeps the ratings from the database when the events are off', async () => {
    const clients = testClients({ stats: { get: async (period) => statsOf(period, 'off') } });
    renderMarket(<StatsScreen onBack={() => undefined} />, clients);
    expect(await screen.findByText(toCyrillic('Baholar'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Botni bloklaganlar'))).toBeNull();
    expect(screen.queryByText(toCyrillic('Nega bekor qilishdi'))).toBeNull();
    expect(screen.queryByText(toCyrillic('Ilova qanday ochildi'))).toBeNull();
  });
});
