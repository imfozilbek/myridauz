import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeMap } from '../map/fake-map';
import { MapEngineContext } from '../map/map-engine';
import { native, pressBack } from '../test-native';
import { renderInShell } from '../test-shell';
import { confirmed } from './booking-test-kit';
import { DriverTripMap } from './driver-trip-map';

vi.mock('../telegram/location', () => ({ requestPosition: vi.fn(async () => null) }));
vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('the sheet of navigators over «Safar xaritasi» (docs/94 C6, F11)', () => {
  it('«Назад» closes the sheet first; the main button is not over it; the map leaves one finger to the page', async () => {
    const onBack = vi.fn();
    const map = fakeMap();
    renderInShell(
      <MapEngineContext.Provider value={async () => map.engine}>
        <DriverTripMap bookings={[confirmed]} onBack={onBack} />
      </MapEngineContext.Provider>,
      true,
    );
    await vi.waitFor(() => expect(map.engine).toHaveBeenCalled());
    expect(map.engine.mock.calls[0]?.[4]).toBe(true);
    expect(native.mainShown).toBe(true);
    act(() => native.main?.());
    expect(await screen.findByRole('dialog')).toBeTruthy();
    // The button hides once nobody takes it after the step gave it away (G41, docs/108 E).
    await waitFor(() => expect(native.mainShown).toBe(false));
    act(pressBack);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onBack).not.toHaveBeenCalled();
    expect(native.mainShown).toBe(true);
    act(pressBack);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
