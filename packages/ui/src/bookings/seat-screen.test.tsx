import { toCyrillic } from '@platform/i18n';
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
    expect(screen.getByText(toCyrillic('2 kishi'))).toBeTruthy();
    expect(document.querySelector('.seat-state-done')?.textContent).toBe(toCyrillic('Joy tasdiqlandi'));
  });

  it('shows the points of the seat on the route, the end under them unless they name it', async () => {
    open(confirmed);
    expect(await screen.findByText(toCyrillic('Chilonzor bozori yaqinida'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Toshkent shahri'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Registon mahallasi'))).toBeTruthy();
  });

  it('before the confirmation says the area with the extra km, the state in amber', async () => {
    open(booking);
    expect(await screen.findByText(toCyrillic('Qatortol atrofi · +2 km'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Chilonzor, Toshkent shahri'))).toBeTruthy();
    expect(screen.getByText(/^Самарқанд шаҳри атрофи/u)).toBeTruthy();
    expect(document.querySelector('.seat-state-asked')?.textContent).toBe(toCyrillic('Joy soʻraldi'));
    // No call before the seat is confirmed.
    expect(screen.queryByText(toCyrillic('Qoʻngʻiroq'))).toBeNull();
  });

  it('offers the chat, the call and the complaint of a confirmed seat, the steps as rows', async () => {
    open(confirmed);
    expect(await screen.findByText(toCyrillic('Xabar yozish'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Qoʻngʻiroq'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Shikoyat qilish'))).toBeTruthy();
    expect(screen.getAllByText(toCyrillic('Joy tasdiqlandi'))).toHaveLength(2);
    expect(screen.getByText(toCyrillic('Joy soʻraldi'))).toBeTruthy();
  });
});

// G91 DRV-6: the server keeps a seat that rode or was missed, and every seat once the car left
// (docs/35); the page offers no «Bekor qilish» it would refuse.
describe('a seat the driver cannot cancel any more', () => {
  it('has no «Joyni bekor qilish» after «Keldi», «Kelmadi» or the departure', async () => {
    const { departAt } = confirmed.trip;
    open(confirmed);
    expect(await screen.findByText(toCyrillic('Joyni bekor qilish'))).toBeTruthy();
    cleanup();
    for (const seat of [
      { ...confirmed, metAt: departAt - 60_000 },
      { ...confirmed, noShowAt: departAt - 60_000 },
      { ...confirmed, trip: { ...confirmed.trip, departedAt: departAt } },
    ]) {
      open(seat);
      expect(await screen.findByText('Dilnoza')).toBeTruthy();
      expect(screen.queryByText(toCyrillic('Joyni bekor qilish'))).toBeNull();
      cleanup();
    }
  });
});
