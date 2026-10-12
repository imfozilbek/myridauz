import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trip } from '../market/market-test-kit';
import { asked, board, NOW, openBoard, salon } from './board-test-kit';

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const BUSY = 'Yangi taklif shu safar tugagach';

// One live trip of a driver (owner decision 12.10.2026, docs/172, sheet 7-edits-1): the board offers
// only to it; the other requests keep the chat and the call.
describe('the board while a trip of the driver is live', { timeout: 20_000 }, () => {
  it('offers only to the trip: the others say a new offer waits, without the button', async () => {
    openBoard({
      requestBoard: async () =>
        board({ trip, busy: true, fits: [{ ...asked, extraKm: 2 }], others: [{ ...salon, id: 'r3' }] }),
    });
    expect(await screen.findByText('Boshqa soʻrovlar (1)')).toBeTruthy();
    expect(screen.getByText(BUSY)).toBeTruthy();
    expect(screen.getAllByText('Safarimga taklif qilish')).toHaveLength(1);
    expect(screen.queryByText('Safar ochib taklif qilish')).toBeNull();
    expect(screen.getAllByLabelText('Xabar yozish')).toHaveLength(2);
    expect(screen.getAllByLabelText('Qoʻngʻiroq')).toHaveLength(2);
  });

  it('a route without the trip on it: the same, and an empty day asks for no new trip', async () => {
    openBoard({ requestBoard: async () => board({ busy: true }) });
    expect(await screen.findByText(BUSY)).toBeTruthy();
    expect(screen.queryByText('Taklif yuborish')).toBeNull();
    cleanup();
    openBoard({ requestBoard: async () => board({ busy: true, others: [] }) });
    expect(await screen.findByText('Bu kunga soʻrov yoʻq')).toBeTruthy();
    expect(screen.queryByText('Safar eʼlon qilish')).toBeNull();
    expect(screen.queryByText(BUSY)).toBeNull();
  });

  it('a free driver offers on every request', async () => {
    openBoard();
    expect(await screen.findByText('Taklif yuborish')).toBeTruthy();
    expect(screen.queryByText(BUSY)).toBeNull();
  });
});
