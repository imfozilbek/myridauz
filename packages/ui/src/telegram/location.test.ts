import { describe, expect, it, vi } from 'vitest';
import { herePosition } from './location';

// Telegram answers one question about the place at a time (G66): a second one while the first waits
// is refused, and the refusal read as «nowhere» wiped «Qayerdan» of the main screen.
const telegram = vi.hoisted(() => {
  let answer: (place: { latitude: number; longitude: number }) => void = () => undefined;
  const requestLocation = Object.assign(
    vi.fn(() => new Promise<{ latitude: number; longitude: number }>((resolve) => (answer = resolve))),
    { isAvailable: () => true },
  );
  // What the person answered before: by default they allowed it.
  const access = { requested: true, granted: true };
  return {
    access,
    answer: (place: { latitude: number; longitude: number }) => answer(place),
    locationManager: {
      mount: Object.assign(async () => undefined, { isAvailable: () => false }),
      isMounted: () => true,
      isAccessRequested: () => access.requested,
      isAccessGranted: () => access.granted,
      requestLocation,
    },
  };
});
vi.mock('@telegram-apps/sdk-react', () => ({ locationManager: telegram.locationManager }));

describe('the place of the person (G25, G66)', () => {
  it('asks Telegram once for two screens asking at the same moment', async () => {
    const first = herePosition();
    const second = herePosition();
    await vi.waitFor(() => expect(telegram.locationManager.requestLocation).toHaveBeenCalledTimes(1));
    telegram.answer({ latitude: 41.3, longitude: 69.2 });
    expect(await first).toEqual({ lat: 41.3, lng: 69.2 });
    expect(await second).toEqual({ lat: 41.3, lng: 69.2 });
  });

  it('asks again once the answer came', async () => {
    const next = herePosition();
    await vi.waitFor(() => expect(telegram.locationManager.requestLocation).toHaveBeenCalledTimes(1));
    telegram.answer({ latitude: 40.4, longitude: 71.8 });
    expect(await next).toEqual({ lat: 40.4, lng: 71.8 });
  });

  // The first main screen asks the place once (owner, 17.10.2026); a «no» is never asked again.
  it('asks a person never asked, and never asks again after a «no»', async () => {
    telegram.access.requested = false;
    telegram.access.granted = false;
    const first = herePosition();
    await vi.waitFor(() => expect(telegram.locationManager.requestLocation).toHaveBeenCalledTimes(1));
    telegram.answer({ latitude: 41.3, longitude: 69.2 });
    expect(await first).toEqual({ lat: 41.3, lng: 69.2 });
    telegram.access.requested = true;
    telegram.locationManager.requestLocation.mockClear();
    expect(await herePosition()).toBeNull();
    expect(telegram.locationManager.requestLocation).not.toHaveBeenCalled();
  });
});
