import { ApiError, type BookingsClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking } from './booking-test-kit';
import { DriverBooking } from './driver-booking';

afterEach(cleanup);

// A seat that changed under the driver (G52, docs/112): one answer for two taps, and after
// bookings.wrong_status the parent loads it again at once, the reason stays on the screen.
describe('a booking changed under the driver', () => {
  it('sends one answer for two taps and loads the seat again after bookings.wrong_status', async () => {
    let refuse: (reason: unknown) => void = () => undefined;
    const answer = vi.fn<BookingsClient['answer']>(() => new Promise((_, reject) => (refuse = reject)));
    const onStale = vi.fn();
    renderMarket(
      <PlacesGate>
        <DriverBooking booking={booking} onClose={() => undefined} onStale={onStale} />
      </PlacesGate>,
      testClients({ bookings: { answer } }),
    );
    const decline = await screen.findByText('Rad etish');
    fireEvent.click(decline);
    fireEvent.click(decline);
    expect(answer).toHaveBeenCalledOnce();
    refuse(new ApiError(409, 'bookings.wrong_status'));
    await waitFor(() => expect(onStale).toHaveBeenCalledOnce());
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
