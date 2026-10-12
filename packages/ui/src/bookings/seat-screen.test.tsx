import type { Booking } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking, confirmed } from './booking-test-kit';
import { DriverBooking } from './driver-booking';

afterEach(cleanup);

function open(seat: Booking) {
  renderMarket(
    <PlacesGate>
      <DriverBooking booking={seat} onClose={() => undefined} />
    </PlacesGate>,
    testClients({}),
  );
}

// The seat of a passenger for the driver (G78 sheet 3, d-seat): the passenger and the state first,
// the route of her points, the actions, the steps done as rows.
describe('the seat of a passenger', () => {
  it('puts the passenger first with how many and the last step', async () => {
    open(confirmed);
    expect(await screen.findByText('Dilnoza')).toBeTruthy();
    expect(screen.getByText('2 kishi')).toBeTruthy();
    expect(document.querySelector('.seat-state-done')?.textContent).toBe('Joy tasdiqlandi');
  });

  it('shows the points of the seat on the route, the end under them unless they name it', async () => {
    open(confirmed);
    expect(await screen.findByText('Chilonzor bozori yaqinida')).toBeTruthy();
    expect(screen.getByText('Toshkent shahri')).toBeTruthy();
    expect(screen.getByText('Registon mahallasi')).toBeTruthy();
  });

  it('before the confirmation says the area with the extra km, the state in amber', async () => {
    open(booking);
    expect(await screen.findByText('Qatortol atrofi · +2 km')).toBeTruthy();
    expect(screen.getByText('Chilonzor, Toshkent shahri')).toBeTruthy();
    expect(screen.getByText(/^Samarqand shahri atrofi/u)).toBeTruthy();
    expect(document.querySelector('.seat-state-asked')?.textContent).toBe('Joy soʻraldi');
    // No call before the seat is confirmed.
    expect(screen.queryByText('Qoʻngʻiroq')).toBeNull();
  });

  it('offers the chat, the call and the complaint of a confirmed seat, the steps as rows', async () => {
    open(confirmed);
    expect(await screen.findByText('Xabar yozish')).toBeTruthy();
    expect(screen.getByText('Qoʻngʻiroq')).toBeTruthy();
    expect(screen.getByText('Shikoyat qilish')).toBeTruthy();
    expect(screen.getAllByText('Joy tasdiqlandi')).toHaveLength(2);
    expect(screen.getByText('Joy soʻraldi')).toBeTruthy();
  });
});
