import { loadBrand } from '@platform/brands';
import type { BookingsClient } from '@platform/api-client';
import { meetingStartsAt, MINUTE_MS, type Booking, type Trip } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { openOwnTrip, renderMarket, tap } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { akmal, madina, MEETING_NOW } from '../meeting/meet-test-kit';
import { testClients } from '../test-shell';

// The chat and the publishing are screens of their own: here only what the page hands them.
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ title, ring, onBack }: { title: string; ring?: boolean; onBack: () => void }) => (
    <button type="button" onClick={onBack}>{`chat ${title}${ring ? ' ring' : ''}`}</button>
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
function open(trip: Trip, bookings: readonly Booking[], now: number, meet = vi.fn()) {
  vi.setSystemTime(now);
  renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [trip], searchRequests: async () => [] },
      bookings: { driverBookings: async () => [...bookings], driverOffers: async () => [], meet },
      wallet: { mine: async () => wallet },
    }),
  );
}
async function openTrip() {
  await openOwnTrip();
}

describe('the meeting on «Mening safarim» (G63 C3, docs/126, docs/129)', { timeout: 20_000 }, () => {
  it('a point of «Yoʻl xaritasi» opens «Uchrashuv» once the meeting opens (mockup g63/4 screens 12, 13)', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'], shouldAdvanceTime: true });
    open(
      madina.trip,
      [madina],
      meetingStartsAt(madina.trip.departAt, loadBrand().schedule.meetMinutes) - MINUTE_MS + STEP_MS / 2,
    );
    await openTrip();
    expect(await screen.findByText('Madina')).toBeTruthy();
    // The effects of the page run first: its clock is set before the time moves on.
    await act(async () => undefined);
    await act(async () => {
      vi.advanceTimersByTime(3 * STEP_MS);
    });
    // No row of its own on the page, as on the mockup (screen 11).
    expect(screen.queryByText('Uchrashuv')).toBeNull();
    // Before «Men keldim» the row still says where the passenger is taken (mockup g63/4 screen 11).
    expect(screen.queryByText(/^Kelmadi/u)).toBeNull();
    await tap('Yoʻl xaritasi');
    await tap('Madina · 2 joy');
    expect(await screen.findByText('Men keldim')).toBeTruthy();
  });

  it('«Kelmadi» in the row asks first and marks without opening the booking', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const meet = vi.fn<BookingsClient['meet']>(async () => ({ ...akmal, noShowAt: MEETING_NOW }));
    open(madina.trip, [{ ...akmal, driverCameAt: MEETING_NOW }], MEETING_NOW, meet);
    await openTrip();
    const until = await screen.findByText('Kelmadi · safar tugaguncha belgilash mumkin');
    // The line stands beside the button of the row: never a button inside a button.
    expect(until.closest('.rider-open')).toBeNull();
    expect(document.querySelector('button button')).toBeNull();
    fireEvent.click(until);
    await vi.waitFor(() => expect(meet).toHaveBeenCalledWith('a1', 'no_show'));
    expect(screen.queryByText('Joyni bekor qilish')).toBeNull();
  });

  it('«Qoʻngʻiroq» of the meeting rings, back comes to the meeting, «Yozish» opens the chat', async () => {
    open(madina.trip, [madina], MEETING_NOW);
    await openTrip();
    await tap('Yoʻl xaritasi');
    await tap('Madina · 2 joy');
    await tap('Qoʻngʻiroq');
    await tap('chat Madina ring');
    await tap('Yozish');
    expect(await screen.findByText('chat Madina')).toBeTruthy();
  });

  it('after «Kelmadi» the plate of the refund stands where the plate of the stage was', async () => {
    open(madina.trip, [madina, { ...akmal, noShowAt: MEETING_NOW }], MEETING_NOW);
    await openTrip();
    expect(await screen.findByText('Akmal kelmadi')).toBeTruthy();
    expect(document.querySelector('.own-trip > .no-show-banner')).toBeTruthy();
    expect(document.querySelector('.own-banner')).toBeNull();
  });

  it('a completed trip is the past trip, and its way back opens the one screen', async () => {
    const trip = { ...madina.trip, status: 'completed' as const };
    const done = { ...madina, trip, status: 'completed' as const };
    open(trip, [done], trip.departAt + 8 * 60 * MINUTE_MS);
    await openTrip();
    expect(await screen.findByText('Safar tugadi')).toBeTruthy();
    expect(document.querySelector('.own-banner')?.getAttribute('data-stage')).toBe('done');
    await tap('Qaytishni eʼlon qilish');
    expect(await screen.findByText(/^publish 2026-10-0\d$/u)).toBeTruthy();
  });
});
