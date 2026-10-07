import type { RideRequest } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { locations } from './market-test-kit';
import { PlacesGate } from './places-gate';
import { RequestScreen } from './request-card';

const sdk = vi.hoisted(() => {
  const listeners: (() => void)[] = [];
  return {
    listeners,
    mainButton: {
      setParams: { ifAvailable: vi.fn(() => [true] as const) },
      onClick: {
        ifAvailable: vi.fn((listener: () => void) => {
          listeners.push(listener);
          return [true, () => undefined] as const;
        }),
      },
    },
  };
});
vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  mainButton: sdk.mainButton,
}));

afterEach(cleanup);

const request: RideRequest = {
  id: 'r1',
  passenger: { id: '00000000000000000000000000000009', firstName: 'Dilnoza', hasAvatar: false },
  from: '1726269',
  to: '1730401',
  date: '2026-10-02',
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open',
  pickupMode: 'both',
  wholeCar: false,
  withWoman: false,
};

describe('the request of a passenger for a driver (docs/86 V6)', () => {
  it('sends an offer from the native main button, not from a button inside the page', async () => {
    const onOffer = vi.fn();
    renderInShell(
      <PlacesGate>
        <RequestScreen request={request} onBack={() => undefined} onOffer={onOffer} />
      </PlacesGate>,
      true,
      true,
      locations,
    );
    await waitFor(() =>
      expect(sdk.mainButton.setParams.ifAvailable).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Taklif yuborish', isVisible: true }),
      ),
    );
    expect(screen.queryByText('Taklif yuborish')).toBeNull();
    sdk.listeners.at(-1)?.();
    expect(onOffer).toHaveBeenCalled();
  });
});
