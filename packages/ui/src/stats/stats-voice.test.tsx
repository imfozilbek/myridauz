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
    expect(await screen.findByText('Botni bloklaganlar')).toBeTruthy();
    expect(screen.getByText('Qaytdi: 1')).toBeTruthy();
    // The bot of the channels lost nobody: it is not in the list of blocks.
    expect(screen.getAllByText('Kanallar boti')).toHaveLength(1);
    expect(rowOf('Oʻrtacha baho')).toContain('4,6');
    expect(rowOf('Oʻrtacha baho')).toContain('18 ta baho');
    expect(rowOf('1 yoki 2 yulduz')).toContain('Baholarning 6%');
    expect(screen.getByText('Nimasi yoqdi')).toBeTruthy();
    expect(rowOf('Vaqtida')).toContain('11');
    expect(screen.getByText('Shikoyat sabablari')).toBeTruthy();
    expect(rowOf('Kelishilgandan koʻp pul soʻradi')).toContain('2');
    expect(screen.getByText('Nega bekor qilishdi')).toBeTruthy();
    expect(rowOf('Boshqa yoʻl topdim')).toContain('Joy bekor qilindi');
    expect(rowOf('Kerakli safar topilmadi')).toContain('Maʼlumotlar oʻchirildi');
    expect(screen.getByText('Ilova qanday ochildi')).toBeTruthy();
    // «Bot xabaridan»: the word has the letters of the brand in it, the check reads its start.
    expect(rowOf(/^Bot xabar/u)).toContain('63');
    expect(rowOf('Havola orqali')).toContain('22');
  });

  it('keeps the ratings from the database when the events are off', async () => {
    const clients = testClients({ stats: { get: async (period) => statsOf(period, 'off') } });
    renderMarket(<StatsScreen onBack={() => undefined} />, clients);
    expect(await screen.findByText('Baholar')).toBeTruthy();
    expect(screen.queryByText('Botni bloklaganlar')).toBeNull();
    expect(screen.queryByText('Nega bekor qilishdi')).toBeNull();
    expect(screen.queryByText('Ilova qanday ochildi')).toBeNull();
  });
});
