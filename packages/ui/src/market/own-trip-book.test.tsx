import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { PlacesGate } from './places-gate';
import { renderMarket, trip } from './market-test-kit';
import { TripScreen } from './trip-screen';
import { booking } from '../bookings/booking-test-kit';

afterEach(cleanup);

// The person of renderMarket has the id …01; trip is driven by …07.
const open = (driverId: string) =>
  renderMarket(
    <PlacesGate>
      <TripScreen
        trip={{ ...trip, driver: { ...trip.driver, id: driverId } }}
        onBack={() => undefined}
        onBook={() => undefined}
      />
    </PlacesGate>,
    testClients({}),
  );

describe('a passenger opens the own trip (G52, docs/112 bookings.own_trip)', () => {
  it('has no «Joy band qilish» and says the trip is theirs', async () => {
    open('00000000000000000000000000000001');
    expect(await screen.findByText('Bu sizning safaringiz.')).toBeTruthy();
    expect(screen.queryByText('Joy band qilish')).toBeNull();
  });

  it('still books the trip of another driver', async () => {
    open(trip.driver.id);
    expect(await screen.findByText('Joy band qilish')).toBeTruthy();
  });
});

describe('a passenger who already asked a seat on the trip (G52, docs/112 bookings.wrong_status)', () => {
  it('sees the seat is asked instead of «Joy band qilish»', async () => {
    renderMarket(
      <PlacesGate>
        <TripScreen trip={trip} onBack={() => undefined} onBook={() => undefined} />
      </PlacesGate>,
      testClients({
        bookings: { myBookings: async () => [{ ...booking, trip: { ...booking.trip, id: trip.id } }] },
      }),
    );
    expect(await screen.findByText('Bu safarda joyingiz bor.')).toBeTruthy();
    expect(screen.queryByText('Joy band qilish')).toBeNull();
  });
});
