import type { FeedbackClient, MarketClient } from '@platform/api-client';
import { ApiError } from '@platform/api-client';
import { HOUR_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request, wallet } from '../bookings/booking-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { akmal, madina } from '../meeting/meet-test-kit';
import { testClients } from '../test-shell';
import { TripEndFlow } from './trip-end-flow';

afterEach(cleanup);
const ARRIVED = madina.trip.departAt + 6 * HOUR_MS;
beforeEach(() => vi.setSystemTime(ARRIVED));

const sardor = { ...akmal, id: 's1', passenger: { ...akmal.passenger, firstName: 'Sardor' } };
const gone = { ...akmal, noShowAt: madina.trip.departAt };
const rated = { ...sardor, id: 's2', rated: true, passenger: { ...akmal.passenger, firstName: 'Bobur' } };

function open(
  review: FeedbackClient['review'],
  searchRequests: MarketClient['searchRequests'],
  onPublish = vi.fn(),
  onClose = vi.fn(),
) {
  renderMarket(
    <PlacesGate>
      <TripEndFlow
        trip={madina.trip}
        bookings={[madina, sardor, gone, rated]}
        onPublish={onPublish}
        onClose={onClose}
      />
    </PlacesGate>,
    testClients({ feedback: { review }, market: { searchRequests }, wallet: { mine: async () => wallet } }),
  );
  return onPublish;
}

describe('«Safar tugadi» and «Qaytish» of the driver (docs/124 В, mockup g63/4 screens 15, 16)', () => {
  it('shows the trip in numbers and the wallet', async () => {
    open(vi.fn(), async () => []);
    expect(await screen.findByText('Safar tugadi')).toBeTruthy();
    // Madina 2, Sardor 1 and Bobur 1 rode; Akmal did not come but his seat was charged.
    expect(screen.getByText(/^4 yoʻlovchi · 380.000 soʻm yoʻl xarajati$/u)).toBeTruthy();
    expect(screen.getByText(/^Hamyon: 47.500 yechildi$/u)).toBeTruthy();
    expect(await screen.findByText(/^Qoldi ≈.50 joyga yetadi$/u)).toBeTruthy();
  });

  it('rates the passengers not rated yet, five stars unless lowered, then offers the way back', async () => {
    const review = vi.fn<FeedbackClient['review']>(async () => undefined);
    const onPublish = open(review, async () => [request, request]);
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
    expect(screen.queryByText('Akmal')).toBeNull();
    expect(screen.queryByText('Bobur')).toBeNull();
    await tap('Madina');
    screen.getByLabelText('Sardor 3').click();
    await tap('Yuborish');
    expect(review.mock.calls).toEqual([[{ bookingId: 'm1', stars: 5 }], [{ bookingId: 's1', stars: 3 }]]);
    expect(await screen.findByText('Qaytishga yoʻlovchi olasizmi?')).toBeTruthy();
    expect(screen.getByText(/^Ertaga, /u)).toBeTruthy();
    expect(screen.getByText('Fargʻona viloyati → Toshkent shahri: 2 ta soʻrov bor')).toBeTruthy();
    expect(screen.getByText('Hammasi tayyor: faqat vaqtni tasdiqlang.')).toBeTruthy();
    await tap('Qaytishni eʼlon qilish');
    const back = onPublish.mock.calls[0]?.[0];
    expect(back.route.from.id).toBe(madina.trip.to);
    expect(back.route.to.id).toBe(madina.trip.from);
    expect(back.again).toMatchObject({ seats: madina.trip.seats, price: madina.trip.price, comment: '' });
    expect(back.again.date).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
  });

  it('keeps the screen with the reason when the stars do not go', async () => {
    open(
      async () => {
        throw new ApiError(400, 'reviews.not_over');
      },
      async () => [],
    );
    await tap('Yuborish');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Safar tugadi')).toBeTruthy();
  });

  it('«Назад» leaves at once, without the stars and without «Qaytish»', async () => {
    const onClose = vi.fn();
    const review = vi.fn<FeedbackClient['review']>();
    open(review, async () => [], vi.fn(), onClose);
    expect(await screen.findByText('Safar tugadi')).toBeTruthy();
    await tap('Orqaga');
    expect(onClose).toHaveBeenCalledOnce();
    expect(review).not.toHaveBeenCalled();
    expect(screen.queryByText('Qaytishga yoʻlovchi olasizmi?')).toBeNull();
  });

  it('hides the line of the requests when nobody asks the way back', async () => {
    open(
      async () => undefined,
      async () => [],
    );
    await tap('Yuborish');
    expect(await screen.findByText('Qaytishga yoʻlovchi olasizmi?')).toBeTruthy();
    expect(screen.queryByText(/soʻrov bor/u)).toBeNull();
  });
});
