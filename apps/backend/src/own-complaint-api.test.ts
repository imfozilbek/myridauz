import { ADMIN_NAVBAT_PATH, ADMIN_WORK_PATH, navbatSchema, workSchema } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { showQueue } from './modules/team-queue';
import { changeModerator } from './modules/team';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const OWNER = 900;
const DRIVER = 952;
const PASSENGER = 953;
const HOUR = 3_600_000;
const RING_NEW = '📋 Yangi ish keldi';
const navbat = async (id: number) =>
  navbatSchema.parse(await (await call(ADMIN_NAVBAT_PATH, id, { app: 'admin' })).json());

// G91 ADM-3 (G89): a moderator who is a side of a complaint leaves it to the owner, so it is not in
// the «Navbat» of that moderator: no case there whose every decision the server refuses.
describe('a complaint about a member of the team', () => {
  it('waits in the «Navbat» of the owner, not of the moderator it is about', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const way = { from: '1726273', to: '1718401', departAt: Date.now() + 5 * HOUR, seats: 2, price: 90_000 };
    const trip = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...way, womanOnBoard: false, pickupMode: 'door', comment: '' }),
      }),
    );
    const seat = await read<{ id: string }>(
      call(`/trips/${trip.id}/bookings`, PASSENGER, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${seat.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
    // After the ride: the complaint of 7 days (docs/129).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 20 * HOUR);
    await changeModerator(testEnv, OWNER, DRIVER, true);
    const filed = await read<{ id: string }>(
      call('/complaints', PASSENGER, json({ bookingId: seat.id, reasons: ['harassment'] })),
    );
    expect((await navbat(OWNER)).items.map((item) => item.id)).toContain(filed.id);
    expect((await navbat(DRIVER)).items.map((item) => item.id)).not.toContain(filed.id);
    // «kutmoqda» of the moderator counts the same cases as his «Navbat» (G91 review of ADM-9).
    const work = workSchema.parse(await (await call(ADMIN_WORK_PATH, DRIVER, { app: 'admin' })).json());
    expect(work.waiting).toBe((await navbat(DRIVER)).items.length);
    // The card of the bot counts the same as the app, for each member (G91 ADM-9).
    await showQueue(testEnv);
    const texts = (chat: number) =>
      telegram.calls
        .filter((item) => item.token === testEnv.ADMIN_BOT_TOKEN && item.body.chat_id === chat)
        .map((item) => String(item.body.text ?? ''));
    const card = (chat: number) =>
      texts(chat)
        .filter((text) => text.includes(' ariza · '))
        .at(-1) ?? '';
    expect(card(OWNER)).toContain('1 shikoyat');
    expect(card(DRIVER)).not.toContain('1 shikoyat');
    // The urgent ring of a harassment goes to the owner, not to the moderator it is about.
    const rang = (chat: number) => texts(chat).some((text) => text.startsWith('⚠️ Muhim shikoyat'));
    expect(rang(OWNER)).toBe(true);
    expect(rang(DRIVER)).toBe(false);
    // «A case came» rings a member whose own «Navbat» was empty, by his own count (G91 review).
    const before = texts(DRIVER).length;
    await showQueue(testEnv, { kind: 'new' });
    expect(
      texts(DRIVER)
        .slice(before)
        .some((text) => text.startsWith(RING_NEW)),
    ).toBe(false);
    expect(texts(OWNER).some((text) => text.startsWith(RING_NEW))).toBe(true);
  });
});
