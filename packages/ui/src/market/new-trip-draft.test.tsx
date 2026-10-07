import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DriverContext, type Driver } from '../driver/driver-context';
import { testClients } from '../test-shell';
import { chooseRoute, recommendation, renderMarket, tap, trip } from './market-test-kit';
import { NewTripFlow } from './new-trip-flow';

const COMMENT = 'Yukxona boʻsh';
const RESTORED = 'Oldingi yozganingiz tiklandi.';
const driver: Driver = {
  application: {
    status: 'approved',
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    photos: { front: true, side: true, interior: true },
    reasons: [],
  },
  editCar: () => undefined,
};

afterEach(cleanup);
beforeEach(() => localStorage.clear());

function open(recommend = async () => recommendation) {
  const publishTrip = vi.fn(async () => trip);
  const clients = testClients({ market: { recommend, publishTrip } });
  renderMarket(
    <DriverContext.Provider value={driver}>
      <NewTripFlow onBack={() => undefined} />
    </DriverContext.Provider>,
    clients,
  );
  return publishTrip;
}

// Route, tomorrow, 08:00, 4 seats, the price, seats only (G61): the comment is next.
async function toComment() {
  await chooseRoute();
  for (const step of [/^Ertaga/, 'Davom etish', 'Davom etish', 'Davom etish', 'Davom etish']) await tap(step);
  return screen.findByPlaceholderText('Izoh yozing');
}

describe('NewTripFlow keeps its answers (docs/94 F3, F8, B3)', { timeout: 20_000 }, () => {
  it('«Назад» shows every earlier step with its answer', async () => {
    open();
    fireEvent.change(await toComment(), { target: { value: COMMENT } });
    // The rule, price, seats, the day and time: each one back.
    for (let back = 0; back < 4; back += 1) await tap('Orqaga');
    // The day and time: tomorrow at 08:00; the way of pickup had no choice, so the route is next
    // with both ends (G40, docs/106 K2).
    expect(await screen.findByText('Davom etish')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Chilonzor')).toBeTruthy();
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
    // Route, day and time, seats, price, the rule: each answer kept, one tap each.
    for (let step = 0; step < 5; step += 1) await tap('Davom etish');
    expect(((await screen.findByPlaceholderText('Izoh yozing')) as HTMLTextAreaElement).value).toBe(COMMENT);
  });

  it('a closed app opens the same step with the typed comment; published, the draft is gone', async () => {
    open();
    fireEvent.change(await toComment(), { target: { value: COMMENT } });
    cleanup();
    const publishTrip = open();
    const comment = (await screen.findByPlaceholderText('Izoh yozing')) as HTMLTextAreaElement;
    expect(comment.value).toBe(COMMENT);
    expect(screen.getByText(RESTORED)).toBeTruthy();
    await tap('Davom etish');
    await tap('Eʼlon qilish');
    expect(await screen.findByText('Safar eʼlon qilindi')).toBeTruthy();
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ comment: COMMENT, seats: 4 }));
    cleanup();
    open();
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
    expect(screen.queryByText(RESTORED)).toBeNull();
  });

  it('B3: the way back waits for its price with a skeleton and «Назад», not a blank screen', async () => {
    let recommendations = 0;
    open(() =>
      recommendations++ === 0 ? Promise.resolve(recommendation) : new Promise<never>(() => undefined),
    );
    await toComment();
    await tap('Izohsiz davom etish');
    await tap('Eʼlon qilish');
    await tap('Qaytish safari');
    await tap(/^Ertaga/);
    await tap('Davom etish');
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    await tap('Orqaga');
    expect(await screen.findByLabelText('Soat nechada joʻnaysiz?')).toBeTruthy();
  });
});
