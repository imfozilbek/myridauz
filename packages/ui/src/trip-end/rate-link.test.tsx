import type { ReviewTarget } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { akmal, madina } from '../meeting/meet-test-kit';
import { testClients } from '../test-shell';
import { RateLinkScreen } from './rate-link-screen';

afterEach(cleanup);

const trip = { ...madina.trip, status: 'completed' as const };
const rode = { ...madina, trip, status: 'completed' as const };
const other = { ...akmal, trip, status: 'completed' as const };
const elsewhere = { ...akmal, id: 'x9', trip: { ...trip, id: 'other' } };

function open(mine: ReviewTarget['mine']) {
  const review = vi.fn(async () => undefined);
  const onSent = vi.fn();
  const target = async () => ({
    rateeId: madina.passenger.id,
    rateeName: 'Madina',
    rateeRole: 'passenger' as const,
    mine,
  });
  renderMarket(
    <PlacesGate>
      <RateLinkScreen bookingId={madina.id} onBack={vi.fn()} onSent={onSent} />
    </PlacesGate>,
    testClients({
      bookings: { driverBookings: async () => [other, rode, elsewhere] },
      feedback: { target, review },
    }),
  );
  return { review, onSent };
}
const riders = () => [...document.querySelectorAll('.trip-end-rider')];
const pressed = (label: string) => screen.getByLabelText(label).getAttribute('aria-pressed');

// The driver rates by the link of the bot (G78 sheet 6): the stars of the whole trip.
describe('the stars of a trip by the link of the bot', () => {
  it('puts the person of the link on top with the stars of the bot; the others wait', async () => {
    const { review, onSent } = open({ stars: 4, tags: [], text: '' });
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
    expect(screen.getByText(/^\d+-[a-z]+ · .+ → .+$/u)).toBeTruthy();
    expect(riders().map((rider) => rider.firstChild?.textContent)).toEqual(['Madina', 'Akmal']);
    expect(riders()[0]?.classList.contains('trip-end-rider-marked')).toBe(true);
    expect(pressed('Madina 4')).toBe('true');
    expect(riders()[1]?.querySelector('.trip-end-stars-wait')).not.toBeNull();
    // The stars of the bot unchanged and nobody else chosen: nothing to send again.
    await tap('Yuborish');
    await waitFor(() => expect(onSent).toHaveBeenCalled());
    expect(review).not.toHaveBeenCalled();
  });

  it('sends the stars that were chosen', async () => {
    const { review, onSent } = open({ stars: 4, tags: [], text: '' });
    await screen.findByText('Yoʻlovchilarni baholang');
    fireEvent.click(screen.getByLabelText('Madina 5'));
    fireEvent.click(screen.getByLabelText('Akmal 3'));
    expect(riders()[1]?.querySelector('.trip-end-stars-wait')).toBeNull();
    await tap('Yuborish');
    await waitFor(() => expect(onSent).toHaveBeenCalled());
    expect(review.mock.calls).toEqual([
      [{ bookingId: madina.id, stars: 5 }],
      [{ bookingId: akmal.id, stars: 3 }],
    ]);
  });

  it('gives five stars to the person of the link the bot did not get', async () => {
    const { review } = open(null);
    await screen.findByText('Yoʻlovchilarni baholang');
    expect(pressed('Madina 5')).toBe('true');
    await tap('Yuborish');
    await waitFor(() => expect(review).toHaveBeenCalledWith({ bookingId: madina.id, stars: 5 }));
    expect(review).toHaveBeenCalledTimes(1);
  });
});
