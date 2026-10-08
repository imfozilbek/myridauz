import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { createBookingsClient } from './bookings-client';
import { createFeedbackClient } from './feedback-client';
import type { Fetch } from './fetch';

const options = { baseUrl: 'https://api.test', initData: 'a=1' } as const;
const calls = (fetch: ReturnType<typeof vi.fn<Fetch>>) =>
  fetch.mock.calls.map(([url, init]) => [url, init?.method]);

// The meeting of the driver and the refund of a no-show (docs/126, docs/35, G63).
describe('the meeting and the refund clients', () => {
  it('marks the driver at the point and reads the refusal of a second mark', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json({ error: 'bookings.already_met' }, { status: 409 }));
    const client = createBookingsClient({ ...options, app: 'driver', fetch });
    await expect(client.meet('b1', 'no_show')).rejects.toEqual(new ApiError(409, 'bookings.already_met'));
    expect(calls(fetch)).toEqual([['https://api.test/driver/bookings/b1/no_show', 'POST']]);
  });

  it('lets the owner confirm or reject the refund', async () => {
    const fetch = vi.fn<Fetch>(async () => new Response(null, { status: 204 }));
    const client = createFeedbackClient({ ...options, app: 'admin', fetch });
    await client.answerRefund('c1', 'confirm');
    await client.answerRefund('c1', 'reject');
    expect(calls(fetch)).toEqual([
      ['https://api.test/admin/complaints/c1/refund/confirm', 'POST'],
      ['https://api.test/admin/complaints/c1/refund/reject', 'POST'],
    ]);
  });
});
