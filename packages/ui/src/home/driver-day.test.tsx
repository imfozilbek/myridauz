import type { ChatClient } from '@platform/api-client';
import { MINUTE_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS } from './home-test-actions';
import { approved, renderHome } from './home-test-kit';

beforeEach(markApprovalSeen);
afterEach(cleanup);

// An hour after the time without «Yoʻlga chiqdim» (G76, mockup g76/3 state 15).
const LATE_MS = 61 * MINUTE_MS;

describe('the day of a trip of a driver (G76, mockup g76/3 states 12 and 15)', { timeout: 20_000 }, () => {
  it('«Kechikyapman» tells every confirmed passenger in the chat, the trip stays', async () => {
    const late = { ...trip, departAt: Date.now() - LATE_MS, firstDepartAt: Date.now() - LATE_MS };
    const seat = (id: string, status: typeof confirmed.status) => ({
      ...confirmed,
      id,
      chatKey: `chat-${id}`,
      status,
      trip: late,
    });
    const answer = vi.fn<ChatClient['answer']>(async () => undefined);
    renderHome(
      () => <DriverHome />,
      DRIVER_ACTIONS,
      {
        trips: async () => [late],
        requests: async () => [seat('s1', 'confirmed'), seat('s2', 'confirmed'), seat('s3', 'requested')],
        chat: { answer },
      },
      approved,
    );
    expect(await screen.findByText('Yoʻlga chiqdingizmi?')).toBeTruthy();
    await tap('Kechikyapman');
    await vi.waitFor(() => expect(answer).toHaveBeenCalledTimes(2));
    expect(answer.mock.calls).toEqual([
      ['chat-s1', 'Kechikyapman'],
      ['chat-s2', 'Kechikyapman'],
    ]);
    expect(screen.getByRole('button', { name: 'Yoʻlga chiqdim' })).toBeTruthy();
  });

  it('a passenger waits at the pitak: where exactly, as the team wrote it', async () => {
    const soon = { ...trip, departAt: Date.now() + 5 * MINUTE_MS };
    const pitak = {
      id: 'p1',
      name: 'Chilonzor pitagi',
      point: { lat: 41.28, lng: 69.2 },
      hint: 'Metro yonida',
    };
    const waits = {
      ...confirmed,
      trip: soon,
      mode: 'pitak' as const,
      pitak,
      pickup: null,
      cameAt: Date.now(),
    };
    renderHome(
      () => <DriverHome />,
      DRIVER_ACTIONS,
      { trips: async () => [soon], requests: async () => [waits] },
      approved,
    );
    expect(await screen.findByText('Dilnoza joyida')).toBeTruthy();
    expect(screen.getByText('Metro yonida')).toBeTruthy();
  });
});
