import { describe, expect, it } from 'vitest';
import { acceptOffer } from './application/accept';
import { chatBooking, chatBookingRecord, chatMember } from './application/chat-member';
import { sendOffer } from './application/offers';
import { offerChatKey } from './domain/talk';
import { ALI, DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

const offer = { departAt: NOW + 26 * HOUR, price: 95_000 };

// G89: the chat of an offer of before G64, without a talk (key «o…», docs/07): its two sides only; a call once
// the passenger took the offer; a key of nothing opens nothing.
describe('the chat of an offer', () => {
  it('lets the two sides write, calls only after the booking, and nobody else', async () => {
    const { deps, addRequest, bonus } = setup();
    await bonus();
    const sent = await sendOffer(deps, DRIVER, addRequest(), offer);
    const record = await deps.offers.find(sent.ok ? sent.value.id : '');
    if (!record) throw new Error('no offer');
    // An offer of before G64 has no talk: its chat is its own.
    const old = { ...record, id: 'old', talkId: null };
    await deps.offers.save(old);
    const key = offerChatKey(old);
    expect(await chatMember(deps, key, DILNOZA)).toMatchObject({
      role: 'passenger',
      otherId: DRIVER,
      canCall: false,
      canWrite: true,
    });
    expect(await chatMember(deps, key, DRIVER)).toMatchObject({ role: 'driver', otherId: DILNOZA });
    expect(await chatMember(deps, key, ALI)).toBeNull();
    expect(await chatBooking(deps, key, DILNOZA)).toBeNull();
    await acceptOffer(deps, DILNOZA, record.id);
    await deps.offers.save({ ...old, bookingId: (await deps.offers.find(record.id))?.bookingId ?? null });
    expect(await chatMember(deps, key, DILNOZA)).toMatchObject({ canCall: true, canWrite: true });
    expect((await chatBooking(deps, key, DRIVER))?.role).toBe('driver');
  });

  it('opens nothing for a key of no booking, offer or talk', async () => {
    const { deps } = setup();
    for (const key of ['bnone', 'onone', 'tnone']) {
      expect(await chatMember(deps, key, DRIVER)).toBeNull();
      expect(await chatBookingRecord(deps, key)).toBeUndefined();
    }
    expect(await chatBooking(deps, 'onone', DRIVER)).toBeNull();
  });
});
