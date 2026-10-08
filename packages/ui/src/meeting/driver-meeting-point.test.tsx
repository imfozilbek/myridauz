import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { DriverMeeting } from './driver-meeting';
import { akmal, madina, MEETING_NOW } from './meet-test-kit';

afterEach(cleanup);
beforeEach(() => vi.setSystemTime(MEETING_NOW));

const away = { onBack: vi.fn(), onChanged: vi.fn(), onChat: vi.fn(), onCall: vi.fn() };

describe('«Uchrashuv» opened from a point of «Safar xaritasi» (mockup g63/4 screens 12, 13)', () => {
  it('shows only that point, with its number in the order of the way', async () => {
    renderMarket(
      <PlacesGate>
        <DriverMeeting bookings={[madina, akmal]} only={[akmal.id]} {...away} />
      </PlacesGate>,
      testClients({}),
    );
    expect(await screen.findByText(/^2-nuqta/u)).toBeTruthy();
    expect(screen.queryByText(/^1-nuqta/u)).toBeNull();
    expect(screen.queryByText(/^Madina/u)).toBeNull();
  });
});
