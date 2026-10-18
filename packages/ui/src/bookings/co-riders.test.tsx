import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { CoRiders } from './co-riders';

afterEach(cleanup);

// Passengers of one trip see each other (docs/05, G46): the name and the face, never a phone.
describe('«Hamrohlaringiz»', () => {
  it('shows the other passengers of the trip, nothing when the passenger rides alone', async () => {
    const riders = vi.fn(async () => [{ id: 'p2', firstName: 'Bobur', hasAvatar: false }]);
    renderMarket(<CoRiders bookingId="b1" />, testClients({ bookings: { riders } }));
    expect(await screen.findByText('Hamrohlaringiz')).toBeTruthy();
    expect(screen.getByText('Bobur')).toBeTruthy();
    expect(riders).toHaveBeenCalledWith('b1');
    cleanup();
    const alone = vi.fn(async () => []);
    renderMarket(<CoRiders bookingId="b2" />, testClients({ bookings: { riders: alone } }));
    await waitFor(() => expect(alone).toHaveBeenCalled());
    expect(screen.queryByText('Hamrohlaringiz')).toBeNull();
  });
});
