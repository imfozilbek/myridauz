import { loadBrand } from '@platform/brands';
import { afterTrip } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { akmal, madina } from '../meeting/meet-test-kit';
import { renderInShell } from '../test-shell';
import { PastTripTags } from './past-trip-tags';

afterEach(cleanup);

const trip = { ...madina.trip, status: 'completed' as const };
const rode = { ...madina, trip, status: 'completed' as const };
const gone = { ...akmal, trip, status: 'completed' as const, noShowAt: 1 };
const { rateUntil } = afterTrip(loadBrand(), trip.departAt, trip.km);
const DAY = 24 * 60 * 60 * 1000;

describe('the tags of a past trip in «Oʻtgan» (docs/129, mockup g63/5 phone 4)', () => {
  it('asks the stars with the days left and says the refund waits', () => {
    renderInShell(<PastTripTags trip={trip} bookings={[rode, gone]} now={rateUntil - 6.5 * DAY} />);
    expect(screen.getByText('Baho bering · 6 kun')).toBeTruthy();
    expect(screen.getByText('Qaytarish kutilmoqda')).toBeTruthy();
  });

  it('says all are rated and the refund came back', () => {
    const back = { ...gone, refund: { state: 'confirmed' as const, amount: 9500 } };
    renderInShell(<PastTripTags trip={trip} bookings={[{ ...rode, rated: true }, back]} now={rateUntil} />);
    expect(screen.getByText('Hammasi baholandi')).toBeTruthy();
    expect(screen.getByText('Komissiya qaytarildi')).toBeTruthy();
  });

  it('asks the stars once the driver arrived, before the server closes the trip', () => {
    const arrived = { ...madina.trip, departedAt: madina.trip.departAt, arrivedAt: rateUntil - 7 * DAY };
    renderInShell(<PastTripTags trip={arrived} bookings={[madina]} now={rateUntil - 6.5 * DAY} />);
    expect(screen.getByText('Baho bering · 6 kun')).toBeTruthy();
  });

  it('shows nothing on a live trip or when nothing is left', () => {
    const { container } = renderInShell(
      <>
        <PastTripTags trip={madina.trip} bookings={[madina]} now={rateUntil} />
        <PastTripTags trip={trip} bookings={[rode]} now={rateUntil + 1} />
      </>,
    );
    expect(container.querySelector('.past-tags')).toBeNull();
  });
});
