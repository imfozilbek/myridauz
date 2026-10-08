import type { Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed, wallet } from '../bookings/booking-test-kit';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';
import { fiveStars } from '../trip-end/past-trip-kit';

afterEach(cleanup);

const MINUTE = 60 * 1000;
const rider = { ...confirmed, id: 'b2' };
// On the road since the time of the trip; the server has not closed it yet (docs/35).
const left: Trip = { ...trip, seatsLeft: 1, departedAt: trip.departAt };
const NOW = trip.departAt + 6 * 60 * MINUTE;

// The list keeps what the server answers: fresh: after «Yetib keldik» it brings the mark. The seat is
// rated once the stars came (docs/24).
function open(start: Trip, fresh: boolean) {
  vi.setSystemTime(NOW);
  let shown = start;
  let rated = false;
  const arriveTrip = vi.fn(async () => {
    const arrived = { ...left, arrivedAt: Date.now() };
    if (fresh) shown = arrived;
    return arrived;
  });
  renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [shown], searchRequests: async () => [], arriveTrip },
      bookings: { driverBookings: async () => [{ ...rider, rated }], driverOffers: async () => [] },
      feedback: { review: async () => void (rated = true), target: fiveStars },
      wallet: { mine: async () => wallet },
    }),
  );
  return arriveTrip;
}

async function openTrip() {
  await vi.waitFor(() => expect(document.querySelector('.trip-card')).toBeTruthy());
  fireEvent.click(document.querySelector('.trip-card') as HTMLElement);
}

// The past trip and not «Mening safarim»: «Safardan keyin», no main button of the way.
async function pastShown() {
  expect(await screen.findByText('Safardan keyin')).toBeTruthy();
  expect(screen.queryByText('Yetib keldik')).toBeNull();
  expect(screen.queryByText('Yaqinlarimga')).toBeNull();
}

describe('after «Yetib keldik» the trip is past at once (lead decision)', { timeout: 20_000 }, () => {
  it('a trip the driver arrived on opens as the past trip before the server closes it', async () => {
    open({ ...left, arrivedAt: NOW - 30 * MINUTE }, true);
    await openTrip();
    await pastShown();
    expect(screen.getByText('Safar tugadi')).toBeTruthy();
  });

  it('its card in the list says it ended and what is left after it', async () => {
    open({ ...left, arrivedAt: NOW - 30 * MINUTE }, true);
    expect(await screen.findByText('Yakunlangan')).toBeTruthy();
    expect(screen.queryByText('Faol')).toBeNull();
    expect(screen.getByText(/^Baho bering · \d kun$/u)).toBeTruthy();
  });

  it('«Safar tugadi» once after the arrival; «Назад» leads to the past trip, the list may lag', async () => {
    const arriveTrip = open(left, false);
    await openTrip();
    await tap('Yetib keldik');
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
    await tap('Orqaga');
    await pastShown();
    expect(arriveTrip).toHaveBeenCalledOnce();
  });

  it('the stars of «Safar tugadi» are on the past trip at once, not offered again', async () => {
    open(left, true);
    await openTrip();
    await tap('Yetib keldik');
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
    await tap('Yuborish');
    expect(await screen.findByText('Qaytishga yoʻlovchi olasizmi?')).toBeTruthy();
    await tap('Orqaga');
    await pastShown();
    expect(await screen.findByText('Baho: ★★★★★ qoʻydingiz')).toBeTruthy();
  });

  it('opened again from the list after «Safar tugadi», the trip is past', async () => {
    open(left, true);
    await openTrip();
    await tap('Yetib keldik');
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
    await tap('Orqaga');
    await pastShown();
    await tap('Orqaga');
    await openTrip();
    await pastShown();
    // «Safar tugadi» with the stars came once: the past trip offers them in its row.
    expect(screen.queryByText('Yoʻlovchilarni baholang')).toBeNull();
  });
});
