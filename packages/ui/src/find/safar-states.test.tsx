import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Trip } from '@platform/contracts';
import { booking } from '../bookings/booking-test-kit';
import { PlacesGate } from '../market/places-gate';
import { renderMarket, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { SafarScreen } from './safar-screen';

afterEach(cleanup);

const BOOK = '1 ta joy band qilish';
// The person of renderMarket has the id …01; trip is driven by …07.
const open = (shown: Trip, clients = testClients({})) =>
  renderMarket(
    <PlacesGate>
      <SafarScreen
        trip={shown}
        onBack={() => undefined}
        onBook={() => undefined}
        onOthers={() => undefined}
      />
    </PlacesGate>,
    clients,
  );

// «Safar» instead of «Joy band qilish» when the trip cannot be booked (G52, docs/112, docs/65 B8 and C);
// these checks came from the old trip screen, now the screen of the team only (G75, docs/159).
describe('«Safar» that cannot be booked', () => {
  it('says the own trip is theirs', async () => {
    open({ ...trip, driver: { ...trip.driver, id: '00000000000000000000000000000001' } });
    expect(await screen.findByText('Bu sizning safaringiz.')).toBeTruthy();
    expect(screen.queryByText(BOOK)).toBeNull();
  });

  it('says the seat is asked already', async () => {
    open(
      trip,
      testClients({
        bookings: { myBookings: async () => [{ ...booking, trip: { ...booking.trip, id: trip.id } }] },
      }),
    );
    expect(await screen.findByText('Bu safarda joyingiz bor.')).toBeTruthy();
    expect(screen.queryByText(BOOK)).toBeNull();
  });

  it('says a trip on the road left and a cancelled one is closed', async () => {
    open({ ...trip, departAt: Date.now() - 60 * 60 * 1000 });
    expect(await screen.findByText('Bu safar yoʻlga chiqqan. Joy band qilib boʻlmaydi.')).toBeTruthy();
    expect(screen.queryByText(BOOK)).toBeNull();
    cleanup();
    open({ ...trip, status: 'cancelled' });
    expect(await screen.findByText('Haydovchi bu safarni bekor qildi. Boshqa safarni tanlang.')).toBeTruthy();
    // One plate of how it ended for a seat, «Safar» and a request (G75, docs/158 А).
    expect(document.querySelector('.outcome-plate.outcome-plate-off')?.textContent).toContain('bekor qildi');
  });

  it('books the trip of another driver', async () => {
    open(trip);
    expect(await screen.findByText(BOOK)).toBeTruthy();
  });
});
