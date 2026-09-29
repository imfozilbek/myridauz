import { describe, expect, it } from 'vitest';
import { balanceOf } from '../wallet/domain/ledger';
import { acceptOffer, declineOffer } from './application/accept';
import { driverOffers, passengerOffers, sendOffer } from './application/offers';
import { passengerBookings } from './application/request';
import { ALI, DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

// 2026-10-02 08:00 in Tashkent: the day of the request.
const ON_THE_DAY = NOW + 26 * HOUR;
const offer = { departAt: ON_THE_DAY, price: 95_000 };

describe('a driver offers on a request (docs/35)', () => {
  it('sends only with money, on the request day, within the price bounds, once', async () => {
    const { deps, addRequest, bonus } = setup();
    const requestId = addRequest();
    expect(await sendOffer(deps, DRIVER, requestId, offer)).toEqual({
      ok: false,
      error: 'wallet.not_enough',
    });
    await bonus();
    expect(await sendOffer(deps, ALI, requestId, offer)).toEqual({ ok: false, error: 'trips.not_driver' });
    expect(await sendOffer(deps, DRIVER, requestId, { ...offer, departAt: NOW + 50 * HOUR })).toEqual({
      ok: false,
      error: 'bookings.invalid_input',
    });
    expect(await sendOffer(deps, DRIVER, requestId, { ...offer, price: 1000 })).toEqual({
      ok: false,
      error: 'trips.price_out_of_bounds',
    });
    expect((await sendOffer(deps, DRIVER, requestId, offer)).ok).toBe(true);
    expect(await sendOffer(deps, DRIVER, requestId, offer)).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
    expect(await driverOffers(deps, DRIVER)).toHaveLength(1);
  });

  it('on "yes" makes a trip, a confirmed booking and takes the commission', async () => {
    const { deps, addRequest, bonus, wallet, notes } = setup();
    await bonus();
    const requestId = addRequest();
    const sent = await sendOffer(deps, DRIVER, requestId, offer);
    const [shown] = await passengerOffers(deps, DILNOZA);
    expect(shown).toMatchObject({ status: 'sent', seats: 2, price: 95_000, commission: 19_000 });
    const accepted = await acceptOffer(deps, DILNOZA, sent.ok ? sent.value.id : '');
    expect(accepted).toMatchObject({ ok: true, value: { status: 'accepted' } });
    const [booking] = await passengerBookings(deps, DILNOZA);
    // The car has 4 seats: 2 are booked, the other 2 are open to other passengers.
    expect(booking).toMatchObject({
      status: 'confirmed',
      seats: 2,
      plate: '01A123BC',
      trip: { seatsLeft: 2 },
    });
    expect(balanceOf(await wallet(), 'bonus')).toBe(481_000);
    expect(notes).toEqual(
      expect.arrayContaining(['offer to 10', 'offer accepted', 'passenger: confirmed 01A123BC']),
    );
    expect(await acceptOffer(deps, DILNOZA, sent.ok ? sent.value.id : '')).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
  });

  it('lets the passenger say "no", and only the passenger of the request', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const sent = await sendOffer(deps, DRIVER, addRequest(), offer);
    const id = sent.ok ? sent.value.id : '';
    expect(await declineOffer(deps, ALI, id)).toEqual({ ok: false, error: 'bookings.not_found' });
    expect(await declineOffer(deps, DILNOZA, id)).toMatchObject({ ok: true, value: { status: 'declined' } });
  });
});
