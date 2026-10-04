import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import { localUsers } from './modules/users';
import { call, registerUser, testEnv, doorBooking } from './test-api';
import { app } from './app';

// Every Telegram call, with the bot it came from: the token is in the address.
const sent: { token: string; chatId: unknown; text: unknown }[] = [];
vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  sent.push({ token: input.split('/bot')[1]?.split('/')[0] ?? '', chatId: body.chat_id, text: body.text });
  return Response.json({ ok: true, result: { message_id: 700 + sent.length } });
});
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 81;
const PASSENGER = 82;
const STRANGER = 83;
const BLOCKED = 84;

async function bookedChat(driver = DRIVER, passenger = PASSENGER) {
  await approvedDriver(driver);
  for (const id of [passenger, STRANGER, BLOCKED]) await registerUser(id);
  const trip = {
    from: '1726273',
    to: '1718401',
    departAt: Date.now() + 5 * 3_600_000,
    seats: 3,
    price: 90_000,
  };
  const published = await read<{ id: string }>(
    call('/driver/trips', driver, {
      app: 'driver',
      ...json({ ...trip, womanOnBoard: false, pickupMode: 'both', comment: '' }),
    }),
  );
  return read<{ id: string; chatKey: string }>(
    call(`/trips/${published.id}/bookings`, passenger, json(doorBooking(1))),
  );
}

describe('chat access (docs/07)', () => {
  it('lets only the passenger and the driver of the booking into its chat', async () => {
    sent.length = 0;
    const booking = await bookedChat();
    expect(booking.chatKey).toBe(`b${booking.id}`);
    // The new request reaches the driver from the driver bot, not from another bot.
    expect(sent.find((message) => message.chatId === DRIVER)?.token).toBe(testEnv.DRIVER_BOT_TOKEN);
    const ticket = (id: number, miniApp = 'passenger') =>
      call(`/chats/${booking.chatKey}/ticket`, id, { method: 'POST', app: miniApp });
    const own = await read<{ url: string }>(ticket(PASSENGER));
    expect(own.url).toMatch(new RegExp(`^ws://.+/chats/${booking.chatKey}/socket\\?ticket=`));
    expect((await ticket(DRIVER, 'driver')).status).toBe(200);
    expect((await ticket(STRANGER)).status).toBe(403);
    expect((await call('/chats/not-a-key/ticket', PASSENGER, { method: 'POST' })).status).toBe(403);
    const user = await localUsers.find(BLOCKED);
    if (user) await localUsers.save({ ...user, block: { until: null } });
    expect((await ticket(BLOCKED)).status).toBe(403);
    // Without the ticket, or with it but not as a socket, there is no chat.
    const socket = new URL(own.url).pathname;
    expect((await app.request(`${socket}?ticket=forged`, {}, testEnv)).status).toBe(403);
    expect((await app.request(`${socket}${new URL(own.url).search}`, {}, testEnv)).status).toBe(400);
    expect(
      (
        await app.request(
          `${socket}${new URL(own.url).search}`,
          { headers: { upgrade: 'websocket' } },
          testEnv,
        )
      ).status,
    ).toBe(503);
  });

  it('tells the passenger about the confirmation from the passenger bot', async () => {
    sent.length = 0;
    const { bookings } = await read<{ bookings: { id: string }[] }>(call('/passenger/bookings', PASSENGER));
    await call(`/driver/bookings/${bookings[0]?.id ?? ''}/confirm`, DRIVER, {
      method: 'POST',
      app: 'driver',
    });
    const toPassenger = sent.filter((message) => message.chatId === PASSENGER);
    expect(toPassenger.map((message) => message.token)).toEqual([testEnv.PASSENGER_BOT_TOKEN]);
  });

  it('opens a voice call only after the confirmation, only to the two people (G13)', async () => {
    const { bookings } = await read<{ bookings: { id: string; chatKey: string }[] }>(
      call('/passenger/bookings', PASSENGER),
    );
    const booking = bookings[0];
    const ice = (id: number, miniApp = 'passenger') =>
      call(`/calls/${booking?.chatKey ?? ''}/ice`, id, { app: miniApp, ...json({}) });
    // Confirmed above: a member may call; Realtime is not set up in tests, so 503 and not 403.
    expect((await ice(PASSENGER)).status).toBe(503);
    expect((await ice(DRIVER, 'driver')).status).toBe(503);
    expect((await ice(STRANGER)).status).toBe(403);
  });
});

describe('the booking of a chat on the call screen (G54, docs/115)', () => {
  it('shows each side the booking as it sees it, and nothing to anyone else', async () => {
    const [driver, passenger] = [85, 86];
    const booking = await bookedChat(driver, passenger);
    const about = (id: number, miniApp = 'passenger', key = booking.chatKey) =>
      read<{
        booking: { id: string; seats: number; trip: { driver: { firstName: string } } } | null;
        role: string | null;
      }>(call(`/chats/${key}/about`, id, { app: miniApp }));
    const seen = await about(passenger);
    expect(seen.booking).toMatchObject({ id: booking.id, seats: 1 });
    expect(seen.booking?.trip.driver.firstName).toEqual(expect.any(String));
    expect(seen.role).toBe('passenger');
    expect(await about(driver, 'driver')).toMatchObject({ booking: { id: booking.id }, role: 'driver' });
    expect((await about(STRANGER)).booking).toBeNull();
    expect((await about(passenger, 'passenger', 'not-a-key')).booking).toBeNull();
    // Never without the signature of Telegram.
    expect((await app.request(`/chats/${booking.chatKey}/about`, {}, testEnv)).status).toBe(401);
  });
});
