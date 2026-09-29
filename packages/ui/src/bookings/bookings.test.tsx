import { ApiError, type BookingsClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';
import { booking, confirmed, offer } from './booking-test-kit';

afterEach(cleanup);

const request = {
  id: 'r1',
  passenger: { id: 9, firstName: 'Dilnoza', hasAvatar: false },
  from: '1726269',
  to: '1730401',
  date: '2026-10-02',
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open' as const,
};

describe('a passenger in "Mening safarlarim" (docs/35)', () => {
  it('sees a confirmed seat with the plate and the meeting point, and cancels it', async () => {
    const cancelMine = vi.fn<BookingsClient['cancelMine']>(async () => booking);
    const { tracked } = renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [], cancelMine },
      }),
    );
    expect(await screen.findByText('Band qilingan joylar')).toBeTruthy();
    await tap('Jasur');
    expect(screen.getByText('Davlat raqami')).toBeTruthy();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await tap('Uchrashuv joyi');
    expect(open.mock.calls[0]?.[0]).toContain('41.3');
    // The passenger never sees the driver's commission.
    expect(screen.queryByText('Komissiya')).toBeNull();
    await tap('Joyni bekor qilish');
    expect(cancelMine).toHaveBeenCalledWith('b1');
    expect(tracked.some((event) => event.name === 'booking_step' && event.step === 'cancelled')).toBe(true);
  });

  it('accepts a driver offer on the own request', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({ ...offer, status: 'accepted' }));
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [request] },
        bookings: { myBookings: async () => [], myOffers: async () => [offer], answerOffer },
      }),
    );
    await tap('Dilnoza');
    expect(screen.getByText('Haydovchilardan takliflar')).toBeTruthy();
    await tap('Jasur');
    await tap('Qabul qilish');
    expect(await screen.findByText('Joyingiz tasdiqlandi')).toBeTruthy();
    expect(answerOffer).toHaveBeenCalledWith('o1', 'accept');
  });
});

describe('a driver answers a booking (docs/35, docs/12)', () => {
  const driverClients = (answer: BookingsClient['answer']) =>
    testClients({
      market: { myTrips: async () => [trip] },
      bookings: { driverBookings: async () => [booking], driverOffers: async () => [offer], answer },
    });

  it('confirms after "Ishonchingiz komilmi?" with the commission', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => confirmed);
    renderMarket(<MyTripsScreen onBack={() => undefined} />, driverClients(answer));
    expect(await screen.findByText('Yuborilgan takliflar')).toBeTruthy();
    await tap('Jasur');
    await tap('Dilnoza');
    // The driver never sees a passenger's contacts, only the name.
    expect(screen.queryByText(/\+998/)).toBeNull();
    await tap('Tasdiqlash');
    expect(screen.getByText('Ishonchingiz komilmi?')).toBeTruthy();
    expect(screen.getByText(/19\s000/)).toBeTruthy();
    await tap('Tasdiqlash');
    expect(await screen.findByText('Joy tasdiqlandi')).toBeTruthy();
    expect(answer).toHaveBeenCalledWith('b1', 'confirm');
  });

  it('without money explains how to top up', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => {
      throw new ApiError(409, 'wallet.not_enough');
    });
    renderMarket(<MyTripsScreen onBack={() => undefined} />, driverClients(answer));
    await tap('Jasur');
    await tap('Dilnoza');
    await tap('Tasdiqlash');
    await tap('Tasdiqlash');
    expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    await tap('Hisobni toʻldirish');
    expect(screen.getByText(/qoʻllab-quvvatlash/)).toBeTruthy();
  });

  it('declines a booking', async () => {
    const answer = vi.fn<BookingsClient['answer']>(async () => ({ ...booking, status: 'declined' }));
    renderMarket(<MyTripsScreen onBack={() => undefined} />, driverClients(answer));
    await tap('Jasur');
    await tap('Dilnoza');
    await tap('Rad etish');
    expect(answer).toHaveBeenCalledWith('b1', 'decline');
  });
});
