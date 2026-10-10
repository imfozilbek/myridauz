import { DAY_MS, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, registerUser, REQUEST_WAY } from './test-api';

vi.stubGlobal('fetch', fakeTelegram().fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 81;
const PASSENGER = 82;
const STRANGER = 83;
const PRICE = 90_000;
const asDriver = { app: 'driver' } as const;

type Request = { id: string; callsOff: boolean; views: number };
type Board = { known: boolean; others: { id: string }[]; days: { count: number }[] };

// Path 7 of the driver without mocks (G64, docs/118, lesson 162): the talk, the board, the salon trip.
describe('talks, board and salon trips API (G64)', () => {
  it('lets a driver talk about a request before an offer and the passenger turn the calls off', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    await registerUser(STRANGER);
    const date = tashkentDate(Date.now() + DAY_MS);
    const body = { from: '1726273', to: '1718401', date, seats: 2, price: PRICE, ...REQUEST_WAY };
    const request = await read<Request>(call('/passenger/requests', PASSENGER, json(body)));
    const talk = await read<{ chatKey: string }>(
      call(`/driver/requests/${request.id}/talk`, DRIVER, { ...asDriver, method: 'POST' }),
    );
    expect(talk.chatKey).toMatch(/^t/u);
    expect((await call(`/chats/${talk.chatKey}/ticket`, PASSENGER, { method: 'POST' })).status).toBe(200);
    expect((await call(`/chats/${talk.chatKey}/ticket`, STRANGER, { method: 'POST' })).status).toBe(403);
    const about = await read<{ request: { id: string } | null }>(
      call(`/chats/${talk.chatKey}/about`, DRIVER, asDriver),
    );
    expect(about.request?.id).toBe(request.id);
    const off = await read<Request>(
      call(`/passenger/requests/${request.id}/calls`, PASSENGER, json({ on: false })),
    );
    expect(off.callsOff).toBe(true);
    const stranger = await call(`/passenger/requests/${request.id}/calls`, STRANGER, json({ on: false }));
    expect(stranger.status).toBe(404);
  });

  it('shows the board on a route and opens a salon trip only the passenger sees', async () => {
    const date = tashkentDate(Date.now() + 2 * DAY_MS);
    const body = {
      from: '1726273',
      to: '1718401',
      date,
      seats: 2,
      price: PRICE,
      ...REQUEST_WAY,
      wholeCar: true,
    };
    const request = await read<Request>(call('/passenger/requests', PASSENGER, json(body)));
    const unknown = await read<Board>(call('/driver/requests/board', DRIVER, asDriver));
    expect(unknown.known).toBe(false);
    const board = await read<Board>(
      call(`/driver/requests/board?from=1726&to=1718&date=${date}`, DRIVER, asDriver),
    );
    expect(board.others.map((item) => item.id)).toContain(request.id);
    // The board wrote the look of the driver: «1 haydovchi koʻrdi» of the passenger (G76).
    const mine = await read<{ requests: Request[] }>(call('/passenger/requests', PASSENGER));
    expect(mine.requests.find((item) => item.id === request.id)?.views).toBe(1);
    const opened = await call(`/driver/requests/${request.id}/trip`, DRIVER, {
      ...asDriver,
      ...json({ departAt: Date.parse(`${date}T04:00:00Z`) }),
    });
    expect(opened.status).toBe(201);
    const { trip } = (await opened.json()) as { trip: { id: string; private: boolean } };
    expect(trip.private).toBe(true);
    expect((await call(`/trips/${trip.id}`, STRANGER)).status).toBe(404);
    const month = await read<{ trips: number; costs: number }>(call('/driver/trips/month', DRIVER, asDriver));
    expect(month).toEqual({ trips: 0, costs: 0 });
    const early = await call(`/driver/trips/${trip.id}/open`, DRIVER, { ...asDriver, method: 'POST' });
    expect(early.status).toBe(409);
  });
});
