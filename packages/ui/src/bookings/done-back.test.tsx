import type { BookingsClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking, confirmed } from './booking-test-kit';
import { DriverBooking } from './driver-booking';
import { OfferAccepted } from './offer-list';

afterEach(cleanup);

describe('a «done» screen has «Назад» (docs/94 F9)', () => {
  it('the seat confirmed by the driver goes back to the trip', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => confirmed);
    const onClose = vi.fn();
    renderMarket(
      <PlacesGate>
        <DriverBooking booking={booking} onClose={onClose} onMap={() => undefined} />
      </PlacesGate>,
      testClients({ bookings: { answer } }),
    );
    await tap('Tasdiqlash');
    await tap('Tasdiqlash');
    await screen.findByText('Joy tasdiqlandi');
    await tap('Orqaga');
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('the offer taken by the passenger goes back to the list', async () => {
    const onDone = vi.fn();
    renderMarket(<OfferAccepted bookingId={null} onDone={onDone} />, testClients({}));
    await tap('Orqaga');
    expect(onDone).toHaveBeenCalledOnce();
  });
});
