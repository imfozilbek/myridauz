import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { renderInShell } from '../test-shell';
import { booking, confirmed } from './booking-test-kit';
import { TripBookings } from './trip-bookings';

afterEach(cleanup);

const far = { ...booking, id: 'b2', extraKm: 24, passenger: { ...booking.passenger, firstName: 'Aziz' } };

describe('the bookings of a trip for the team (G24, docs/70, G78 sheet 4)', () => {
  it('puts the requests that suit the trip first and the far ones apart', async () => {
    renderInShell(
      <TripBookings bookings={[booking, far, confirmed]} onPerson={() => undefined} />,
      false,
      true,
    );
    const headers = (await screen.findAllByText(/Bu safarga mos|Boshqa soʻrovlar|Yoʻlovchilar/u)).map(
      (header) => header.textContent,
    );
    expect(headers).toEqual(['Bu safarga mos', 'Boshqa soʻrovlar', 'Yoʻlovchilar']);
    expect(screen.getByText(/\+2 km/u)).toBeTruthy();
    expect(screen.getByText(/\+24 km/u)).toBeTruthy();
  });

  it('opens the card of the passenger', async () => {
    const onPerson = vi.fn();
    renderInShell(<TripBookings bookings={[confirmed]} onPerson={onPerson} />, false, true);
    await tap(confirmed.passenger.firstName);
    expect(onPerson).toHaveBeenCalledWith(confirmed.passenger.id);
  });

  it('says there are no passengers yet', async () => {
    renderInShell(<TripBookings bookings={[]} onPerson={() => undefined} />, false, true);
    expect(await screen.findByText('Yoʻlovchilar')).toBeTruthy();
    expect(screen.getByText('Hali soʻrov yoʻq')).toBeTruthy();
  });
});
