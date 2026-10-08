import { meetingStartsAt, MINUTE_MS, type Booking, type Trip } from '@platform/contracts';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { madina, MEETING_NOW } from './meet-test-kit';
import { OwnTripSeam } from './own-trip-seam';

// The chat and the publishing are screens of their own: here only what the seam hands them.
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ title, ring }: { readonly title: string; readonly ring?: boolean }) => (
    <p>{`chat ${title}${ring ? ' ring' : ''}`}</p>
  ),
}));
vi.mock('../market/new-trip-flow', () => ({
  NewTripFlow: ({ again }: { readonly again: { readonly date?: string } }) => (
    <p>{`publish ${again.date ?? ''}`}</p>
  ),
}));

afterEach(() => {
  cleanup();
  // The test shell fakes only the date again before the next test.
  vi.useRealTimers();
});

const STEP_MS = 30 * 1000;
function open(trip: Trip, bookings: readonly Booking[], now: number) {
  vi.setSystemTime(now);
  renderMarket(
    <PlacesGate>
      <OwnTripSeam trip={trip} bookings={bookings} onBack={vi.fn()} onChanged={vi.fn()}>
        {(parts) => (
          <>
            {parts.top}
            {bookings.map((booking) => (
              <span key={booking.id}>{parts.line(booking, 'usual')}</span>
            ))}
          </>
        )}
      </OwnTripSeam>
    </PlacesGate>,
    testClients({ wallet: { mine: async () => wallet }, market: { searchRequests: async () => [] } }),
  );
}

describe('the meeting and the end on the own trip (G63 C3)', () => {
  it('shows «Uchrashuv» once the meeting opens, while the page stays open', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'], shouldAdvanceTime: true });
    const opens = meetingStartsAt(madina.trip.departAt);
    open(madina.trip, [madina], opens - MINUTE_MS + STEP_MS / 2);
    expect(await screen.findByText('usual')).toBeTruthy();
    expect(screen.queryByText('Uchrashuv')).toBeNull();
    // The effects of the page run first: its clock is set before the time moves on.
    await act(async () => undefined);
    await act(async () => {
      vi.advanceTimersByTime(3 * STEP_MS);
    });
    expect(await screen.findByText('Uchrashuv')).toBeTruthy();
    expect(screen.getByText('Kelmadi · safar tugaguncha belgilash mumkin')).toBeTruthy();
  });

  it('«Qoʻngʻiroq» of the meeting rings, «Yozish» opens the chat quietly', async () => {
    open(madina.trip, [madina], MEETING_NOW);
    await tap('Uchrashuv');
    await tap('Qoʻngʻiroq');
    expect(await screen.findByText('chat Madina ring')).toBeTruthy();
    cleanup();
    open(madina.trip, [madina], MEETING_NOW);
    await tap('Uchrashuv');
    await tap('Yozish');
    expect(await screen.findByText('chat Madina')).toBeTruthy();
  });

  it('a completed trip is the past trip, and its way back opens the publishing', async () => {
    const trip = { ...madina.trip, status: 'completed' as const };
    const done = { ...madina, trip, status: 'completed' as const };
    open(trip, [done], trip.departAt + 8 * 60 * MINUTE_MS);
    expect(await screen.findByText('Safar tugadi')).toBeTruthy();
    expect(screen.queryByText('usual')).toBeNull();
    await tap('Qaytishni eʼlon qilish');
    expect(await screen.findByText(/^publish 2026-10-0\d$/u)).toBeTruthy();
  });
});
