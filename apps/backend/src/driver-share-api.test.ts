import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, testEnv } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1, id: 'prepared-1' } }));
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 95;
const STRANGER = 96;
const trip = {
  from: '1726273',
  to: '1718401',
  seats: 3,
  price: 90_000,
  womanOnBoard: false,
  pickupMode: 'door',
  comment: '',
};

// The driver stops sharing a trip with the family (docs/43, G18): only the own link, then it closes.
describe('the driver stops sharing a trip', () => {
  it('closes the link of the own trip; another driver cannot', async () => {
    await approvedDriver(DRIVER);
    await approvedDriver(STRANGER);
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, {
        app: 'driver',
        ...json({ ...trip, departAt: Date.now() + 5 * 3_600_000 }),
      }),
    );
    const path = `/driver/trips/${published.id}/share`;
    const created = await read<{ link: string }>(call(path, DRIVER, { method: 'POST', app: 'driver' }));
    const token = created.link.split('follow_')[1] ?? '';
    const shared = () => app.request(`/shared/${token}`, {}, testEnv);
    expect((await shared()).status).toBe(200);
    const stop = (id: number) => call(`${path}/stop`, id, { method: 'POST', app: 'driver' });
    const refused = await stop(STRANGER);
    expect([refused.status, await refused.json()]).toEqual([404, { error: 'shares.not_found' }]);
    expect((await shared()).status).toBe(200);
    expect((await stop(DRIVER)).status).toBe(204);
    expect((await shared()).status).toBe(404);
  });
});
