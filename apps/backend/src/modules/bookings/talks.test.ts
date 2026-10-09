import { describe, expect, it } from 'vitest';
import { acceptOffer } from './application/accept';
import { chatAbout } from './application/chat-about';
import { chatBooking, chatMember } from './application/chat-member';
import { passengerBookings } from './application/request';
import { sendOffer } from './application/offers';
import { openTalk } from './application/talks';
import { ALI, DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

// 2026-10-02 08:00 in Tashkent: the day of the request.
const offer = { departAt: NOW + 26 * HOUR, price: 95_000 };
const keyOf = async (result: Awaited<ReturnType<typeof openTalk>>) => {
  if (!result.ok) throw new Error(result.error);
  return result.value.chatKey;
};

// A driver and a passenger talk about a request before a booking (G64, docs/118 path 7, docs/07):
// one chat per request and driver, calls before the booking within the limit of the brand.
describe('a talk about a request (G64)', () => {
  it('opens one chat per request and driver, and the same chat holds the offer and the booking', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const requestId = addRequest();
    const key = await keyOf(await openTalk(deps, DRIVER, requestId));
    expect(key).toMatch(/^t[0-9a-f-]{36}$/u);
    expect(await keyOf(await openTalk(deps, DRIVER, requestId))).toBe(key);
    const sent = await sendOffer(deps, DRIVER, requestId, offer);
    expect(sent.ok && sent.value.chatKey).toBe(key);
    await acceptOffer(deps, DILNOZA, sent.ok ? sent.value.id : '');
    expect((await passengerBookings(deps, DILNOZA))[0]?.chatKey).toBe(key);
    expect((await chatBooking(deps, key, DILNOZA))?.booking.status).toBe('confirmed');
  });

  it('lets both sides write and call before a booking, the driver within the limit, and nobody else', async () => {
    const { deps, addRequest } = setup();
    const requestId = addRequest();
    const key = await keyOf(await openTalk(deps, DRIVER, requestId));
    expect(await chatMember(deps, key, DRIVER)).toEqual({
      userId: DRIVER,
      role: 'driver',
      otherId: DILNOZA,
      canCall: true,
      canWrite: true,
      callsOff: false,
      ringLimit: 3,
    });
    expect(await chatMember(deps, key, DILNOZA)).toMatchObject({
      role: 'passenger',
      canCall: true,
      ringLimit: null,
    });
    expect(await chatMember(deps, key, ALI)).toBeNull();
    expect(await chatBooking(deps, key, DILNOZA)).toBeNull();
  });

  it('tells the driver the passenger turned the calls off', async () => {
    const { deps, addRequest } = setup();
    const key = await keyOf(await openTalk(deps, DRIVER, addRequest({ callsOff: true })));
    expect(await chatMember(deps, key, DRIVER)).toMatchObject({ canCall: true, callsOff: true });
  });

  it('opens a chat with a new offer when the driver did not write first', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const requestId = addRequest();
    const sent = await sendOffer(deps, DRIVER, requestId, offer);
    expect(sent.ok && sent.value.chatKey).toBe(await keyOf(await openTalk(deps, DRIVER, requestId)));
  });

  it('refuses a talk to a person who is not a driver, on an own or a closed request', async () => {
    const { deps, addRequest } = setup();
    expect(await openTalk(deps, ALI, addRequest())).toEqual({ ok: false, error: 'trips.not_driver' });
    expect(await openTalk(deps, DRIVER, addRequest({ passengerId: DRIVER }))).toEqual({
      ok: false,
      error: 'bookings.own_trip',
    });
    expect(await openTalk(deps, DRIVER, addRequest({ open: false }))).toEqual({
      ok: false,
      error: 'bookings.not_found',
    });
  });

  it('stops the calls of a talk whose request closed without a booking, the chat stays', async () => {
    const { deps, addRequest, close } = setup();
    const requestId = addRequest();
    const key = await keyOf(await openTalk(deps, DRIVER, requestId));
    close(requestId);
    expect(await chatMember(deps, key, DILNOZA)).toMatchObject({ canCall: false, canWrite: true });
  });
});

describe('what a talk shows on top and in the call (G64)', () => {
  it('gives both sides the request and the latest offer of this driver, no booking before «Qabul qilish»', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const requestId = addRequest();
    const key = await keyOf(await openTalk(deps, DRIVER, requestId));
    expect(await chatAbout(deps, key, DRIVER)).toMatchObject({ role: 'driver', booking: null, offer: null });
    expect((await chatAbout(deps, key, DRIVER))?.request?.id).toBe(requestId);
    await sendOffer(deps, DRIVER, requestId, offer);
    const about = await chatAbout(deps, key, DILNOZA);
    expect(about).toMatchObject({
      role: 'passenger',
      booking: null,
      offer: { status: 'sent', price: 95_000 },
    });
    expect(await chatAbout(deps, key, ALI)).toBeNull();
  });

  it('names the driver with the car and the rating to the passenger before any offer', async () => {
    const { deps, addRequest } = setup();
    const requestId = addRequest();
    const key = await keyOf(await openTalk(deps, DRIVER, requestId));
    const about = await chatAbout(deps, key, DILNOZA);
    expect(about?.offer).toBeNull();
    expect(about?.driver).toMatchObject({ car: { model: 'Cobalt' }, rating: { average: null } });
    expect(about?.driver?.firstName).toBeTruthy();
  });
});
