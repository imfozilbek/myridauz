import type { FeedbackClient } from '@platform/api-client';
import { afterTrip, arrivalAt, type Booking } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { akmal, madina } from '../meeting/meet-test-kit';
import { testClients } from '../test-shell';
import { PastTripFlow } from './past-trip-flow';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const trip = { ...madina.trip, status: 'completed' as const, seatsLeft: 0 };
const rode = { ...madina, trip, status: 'completed' as const, rated: true };
const gone = { ...akmal, trip, status: 'completed' as const, noShowAt: trip.departAt };
// The evening of the trip: the chat is open until tomorrow, six days are left to rate (mockup).
const EVENING = arrivalAt(trip.departAt, trip.km) + 7 * HOUR;

function open(bookings: readonly Booking[], target: FeedbackClient['target'], now = EVENING) {
  vi.setSystemTime(now);
  const onPublish = vi.fn();
  renderMarket(
    <PlacesGate>
      <PastTripFlow
        trip={trip}
        bookings={bookings}
        onBack={vi.fn()}
        onChanged={vi.fn()}
        onPublish={onPublish}
      />
    </PlacesGate>,
    testClients({
      feedback: { target, review: async () => undefined },
      wallet: { mine: async () => wallet },
    }),
  );
  return onPublish;
}
const fiveStars = async () => ({
  rateeId: madina.passenger.id,
  rateeName: 'Madina',
  rateeRole: 'passenger' as const,
  mine: { stars: 5, tags: [], text: '' },
});

describe('the past trip of the driver (docs/129, mockup g63/5 phone 5)', () => {
  it('shows when it ended, the passengers with their stars or the refund, the deadlines', async () => {
    open([rode, gone], fiveStars);
    expect(await screen.findByText('Safar tugadi')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilar (3)')).toBeTruthy();
    expect(await screen.findByText('Baho: ★★★★★ qoʻydingiz')).toBeTruthy();
    expect(screen.getByText(/^Kelmadi · qaytarish 9.500 kutilmoqda$/u)).toBeTruthy();
    expect(screen.getByText(/^Hamma joy band · 95.000$/u)).toBeTruthy();
    expect(screen.getByText('Safardan keyin')).toBeTruthy();
    expect(screen.getAllByText('6 kun qoldi')).toHaveLength(2);
    expect(screen.getByText(/^Yozish mumkin: ertaga /u)).toBeTruthy();
    expect(screen.getByText(/^28.500 yechildi · 9.500 qaytishi mumkin$/u)).toBeTruthy();
  });

  it('says the deadlines are over a week later', async () => {
    open([rode], fiveStars, afterTrip(trip.departAt, trip.km).complainUntil + HOUR);
    expect(await screen.findAllByText('muddat tugadi')).toHaveLength(3);
    expect(screen.getByText(/^19.000 yechildi$/u)).toBeTruthy();
  });

  it('opens the stars not given yet and the way back', async () => {
    const onPublish = open([{ ...rode, rated: false }], fiveStars);
    expect(await screen.findByText('Grand yaqinida')).toBeTruthy();
    await tap('Qaytishni eʼlon qilish');
    expect(onPublish.mock.calls[0]?.[0].route.from.id).toBe(trip.to);
    await tap('Yoʻlovchilarni baholash');
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
  });

  it('opens the chat of the only passenger and the wallet for the commission', async () => {
    open([rode], async () => {
      throw new Error('reviews.too_late');
    });
    await tap('Komissiya');
    expect(await screen.findByText('Bonus berildi')).toBeTruthy();
  });
});
