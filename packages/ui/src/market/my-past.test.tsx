import { toCyrillic } from '@platform/i18n';
import { arrivalAt, DAY_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { renderMarket, tap } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const done = { ...confirmed, status: 'completed' as const, plate: null };
const arrival = arrivalAt(done.trip.departAt, done.trip.km);
const open = (rated: boolean) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [{ ...done, rated }], myOffers: async () => [] },
      subscriptions: { mine: async () => [] },
    }),
  );

describe('«Oʻtgan» in «Mening safarlarim» (G60, mockup g60/6)', () => {
  it('keeps a past trip apart from the live ones, with what is still to do', async () => {
    vi.setSystemTime(arrival + HOUR);
    open(false);
    expect(await screen.findByText(toCyrillic('Faol'))).toBeTruthy();
    await tap(toCyrillic('Oʻtgan'));
    expect(screen.getByText(toCyrillic('Baho bering · 7 kun'))).toBeTruthy();
    expect(screen.getByText(/^Хабар · /u)).toBeTruthy();
  });

  it('a rated trip says so, with a short day and the sum without «soʻm» (mockup g60/6)', async () => {
    vi.setSystemTime(arrival + 3 * DAY_MS);
    open(true);
    await tap(toCyrillic('Oʻtgan'));
    expect(screen.getByText(toCyrillic('Baho berildi'))).toBeTruthy();
    expect(screen.getByText(/^\d+-[а-яёўқғҳ]{3} · \d\d:\d\d$/u)).toBeTruthy();
    expect(screen.queryByText(/сўм$/u)).toBeNull();
  });

  it('a month later only says the exact points are gone', async () => {
    vi.setSystemTime(arrival + 31 * DAY_MS);
    open(true);
    await tap(toCyrillic('Oʻtgan'));
    expect(screen.getByText(toCyrillic('Aniq joylar oʻchirildi'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Baho berildi'))).toBeNull();
    expect(screen.queryByText(/^Хабар · /u)).toBeNull();
  });

  // «Obunalar» lives under the past trips, one tap away (docs/24, G49).
  it('opens the followed routes from under the past trips', async () => {
    vi.setSystemTime(arrival + HOUR);
    open(true);
    await tap(toCyrillic('Oʻtgan'));
    expect(screen.getByText(toCyrillic('Yoʻnalish boʻyicha xabarlar'))).toBeTruthy();
    await tap(toCyrillic('Obunalar'));
    expect(await screen.findByText(toCyrillic('Hali obunalar yoʻq'))).toBeTruthy();
  });
});
