import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, OWNER, read } from './bookings-test-api';
import { call, pid } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => vi.unstubAllGlobals());

describe('an application for the team (docs/65 C)', () => {
  it('shows every decision and warns about the same plate at another person', async () => {
    await approvedDriver(311);
    await approvedDriver(312);
    const detail = await read<{ history: { status: string }[]; samePlate: number; gender: string }>(
      call(`/admin/applications/${await pid(312)}`, OWNER, { app: 'admin' }),
    );
    expect(detail.history.map((entry) => entry.status)).toEqual(['approved']);
    expect(detail.samePlate).toBeGreaterThan(0);
    // «Haydovchi: Jasur, erkak» on the case of the team (G75, mockup g67/2 screen 3).
    expect(detail.gender).toBe('male');
  });
});
