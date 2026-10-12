import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppLink, Booking, RideRequest, Trip } from '@platform/contracts';
import { booking, request } from '../bookings/booking-test-kit';
import { AppLinkContext } from '../market/app-link';
import { PlacesGate } from '../market/places-gate';
import { renderMarket, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { SafarScreen } from './safar-screen';

afterEach(cleanup);

const BOOK = '1 ta joy band qilish';
// The person of renderMarket has the id …01; trip is driven by …07.
const open = (shown: Trip, clients = testClients({}), openLink: (link: AppLink) => void = () => undefined) =>
  renderMarket(
    <AppLinkContext.Provider value={openLink}>
      <PlacesGate>
        <SafarScreen
          trip={shown}
          onBack={() => undefined}
          onBook={() => undefined}
          onOthers={() => undefined}
        />
      </PlacesGate>
    </AppLinkContext.Provider>,
    clients,
  );
// The seats and the requests of the passenger.
const theirs = (mine: readonly Booking[], requests: readonly RideRequest[] = []) =>
  testClients({
    bookings: { myBookings: async () => [...mine] },
    market: { myRequests: async () => [...requests] },
  });

// «Safar» instead of «Joy band qilish» when the trip cannot be booked (G52, docs/112, docs/65 B8 and C);
// these checks came from the old trip screen, now the screen of the team only (G75, docs/159).
describe('«Safar» that cannot be booked', () => {
  it('says the own trip is theirs', async () => {
    open({ ...trip, driver: { ...trip.driver, id: '00000000000000000000000000000001' } });
    expect(await screen.findByText('Bu sizning safaringiz.')).toBeTruthy();
    expect(screen.queryByText(BOOK)).toBeNull();
  });

  it('says the seat is asked already', async () => {
    open(trip, theirs([{ ...booking, trip: { ...booking.trip, id: trip.id } }]));
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

  // One at a time (owner decision 12.10.2026, docs/172): a seat on another trip opens instead.
  it('says a seat is held on another trip, «Joyimni ochish» opens it', async () => {
    const openLink = vi.fn();
    const held = { ...booking, id: 'held', trip: { ...booking.trip, id: 'other' } };
    open(trip, theirs([held]), openLink);
    expect(
      await screen.findByText('Sizda boshqa safarda joy bor. Yangi joy shu safar tugagach.'),
    ).toBeTruthy();
    expect(screen.queryByText(BOOK)).toBeNull();
    fireEvent.click(screen.getByText('Joyimni ochish'));
    expect(openLink).toHaveBeenCalledWith({ name: 'booking', id: 'held' });
  });

  it('says an open request closes with the seat, the button stays', async () => {
    open(trip, theirs([], [{ ...request, status: 'open' }]));
    expect(await screen.findByText('Joy soʻrasangiz, ochiq soʻrovingiz yopiladi.')).toBeTruthy();
    expect(screen.getByText(BOOK)).toBeTruthy();
  });

  it('a seat of a past or cancelled trip holds nothing', async () => {
    const over = { ...booking, trip: { ...booking.trip, id: 'other', status: 'cancelled' as const } };
    open(trip, theirs([over], [{ ...request, status: 'expired' }]));
    expect(await screen.findByText(BOOK)).toBeTruthy();
    expect(document.querySelector('.safar-alert')).toBeNull();
  });

  it('books the trip of another driver', async () => {
    open(trip);
    expect(await screen.findByText(BOOK)).toBeTruthy();
  });
});
