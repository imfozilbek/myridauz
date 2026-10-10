import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { booking, offer } from '../bookings/booking-test-kit';
import { trip } from '../market/market-test-kit';
import { chatRows } from './chat-rows';

const now = trip.departAt - DAY_MS;
const seat = { ...booking, status: 'confirmed' as const };
const about = { role: 'passenger' as const, booking: null, request: null, offer: null, driver: null };

describe('the chats of «Suhbatlar» (G76, mockup g76/5)', () => {
  it('shows the live seats and the offers waiting, the driver for a passenger', () => {
    const rows = chatRows({
      bookings: [seat],
      offers: [{ ...offer, chatKey: 'o1' }],
      unread: [],
      driver: false,
      now,
    });
    expect(rows.map((row) => row.key)).toEqual([seat.chatKey, 'o1']);
    expect(rows[0]?.person.firstName).toBe('Jasur');
  });

  it('keeps a trip a week after it, then no more (docs/129)', () => {
    const past = (days: number) => ({
      ...seat,
      status: 'completed' as const,
      trip: { ...trip, departAt: now - days * DAY_MS },
    });
    expect(chatRows({ bookings: [past(6)], offers: [], unread: [], driver: false, now })).toHaveLength(1);
    expect(chatRows({ bookings: [past(8)], offers: [], unread: [], driver: false, now })).toHaveLength(0);
  });

  it('puts the unread first, the newest on top, then the nearest trips, then the past ones', () => {
    const later = { ...seat, id: 'b2', chatKey: 'b2', trip: { ...trip, departAt: trip.departAt + DAY_MS } };
    const past = {
      ...seat,
      id: 'b3',
      chatKey: 'b3',
      status: 'completed' as const,
      trip: { ...trip, departAt: now - DAY_MS },
    };
    const unread = [{ key: 'b2', count: 1, text: 'Salom', at: now, about: { ...about, booking: later } }];
    const rows = chatRows({ bookings: [past, seat, later], offers: [], unread, driver: false, now });
    expect(rows.map((row) => row.key)).toEqual(['b2', seat.chatKey, 'b3']);
    expect(rows[0]?.unread?.text).toBe('Salom');
  });

  it('shows the passenger to a driver', () => {
    const rows = chatRows({ bookings: [seat], offers: [], unread: [], driver: true, now });
    expect(rows[0]?.person.firstName).toBe('Dilnoza');
  });
});
