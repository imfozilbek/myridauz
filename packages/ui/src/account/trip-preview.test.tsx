import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { TripPreview } from './trip-preview';

afterEach(cleanup);

// G90 PAS-6: before the registration «Qayta urinish» of a trip that did not open tries it again; it
// never starts the registration in its place.
describe('the trip of a post before the registration', { timeout: 20_000 }, () => {
  it('tries again on «Qayta urinish»', async () => {
    const onDone = vi.fn();
    const trip = vi.fn(async () => Promise.reject(new ApiError(0, 'network.failed')));
    renderMarket(<TripPreview id="t1" onDone={onDone} />, testClients({ market: { trip } }));
    fireEvent.click(await screen.findByText('Qayta urinish'));
    await waitFor(() => expect(trip).toHaveBeenCalledTimes(2));
    expect(onDone).not.toHaveBeenCalled();
  });
});
