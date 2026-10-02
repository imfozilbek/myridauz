import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { booking, confirmed } from './booking-test-kit';
import { TripBookings } from './trip-bookings';

afterEach(cleanup);

const far = { ...booking, id: 'b2', extraKm: 24, passenger: { ...booking.passenger, firstName: 'Aziz' } };

describe('the requests of a trip for its driver (G24, docs/70)', () => {
  it('puts the requests that suit the trip first and the far ones apart', async () => {
    renderInShell(<TripBookings bookings={[booking, far, confirmed]} />, false, true);
    const headers = (await screen.findAllByText(/Bu safarga mos|Boshqa soʻrovlar|Yoʻlovchilar/u)).map(
      (header) => header.textContent,
    );
    expect(headers).toEqual(['Bu safarga mos', 'Boshqa soʻrovlar', 'Yoʻlovchilar']);
    expect(screen.getByText(/\+2 km/u)).toBeTruthy();
    expect(screen.getByText(/\+24 km/u)).toBeTruthy();
    // Who rides, at a glance: the faces of the confirmed passengers and their seats (docs/88 L14).
    expect(document.querySelector('.passengers-stack-box > div')?.children).toHaveLength(1);
  });

  it('says there are no passengers yet', async () => {
    renderInShell(<TripBookings bookings={[]} />, false, true);
    expect(await screen.findByText('Yoʻlovchilar')).toBeTruthy();
  });
});
