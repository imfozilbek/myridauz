import type { Point } from '@platform/contracts';
import { locationManager } from '@telegram-apps/sdk-react';

// "Mening joylashuvim" (G22): where the person stands now, only with their consent.
// Telegram asks by its own native prompt (Bot API 8.0); an older client or a browser asks
// through the browser. No answer or "no": null, and the person moves the map by hand.

const GEOLOCATION_TIMEOUT_MS = 10_000;
// Telegram answers the check at once; the person may think a while before allowing.
const CHECK_TIMEOUT_MS = 5_000;
const ANSWER_TIMEOUT_MS = 60_000;

function fromBrowser(): Promise<Point | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS },
    ),
  );
}

export async function requestPosition(): Promise<Point | null> {
  try {
    if (locationManager.mount.isAvailable() && !locationManager.isMounted())
      await locationManager.mount({ timeout: CHECK_TIMEOUT_MS });
    if (!locationManager.requestLocation.isAvailable()) return await fromBrowser();
    const place = (await locationManager.requestLocation({ timeout: ANSWER_TIMEOUT_MS })) as {
      latitude: number;
      longitude: number;
    } | null;
    return place ? { lat: place.latitude, lng: place.longitude } : null;
  } catch {
    return null;
  }
}

// The main screen asks once (owner, 17.10.2026; before, G25: only when allowed earlier): Telegram
// shows its own question the first time; a «no» stays with Telegram, and nothing is asked again.
async function askHere(): Promise<Point | null> {
  try {
    if (locationManager.mount.isAvailable() && !locationManager.isMounted())
      await locationManager.mount({ timeout: CHECK_TIMEOUT_MS });
    const refused =
      locationManager.isMounted() &&
      locationManager.isAccessRequested() &&
      !locationManager.isAccessGranted();
    return refused ? null : await requestPosition();
  } catch {
    return null;
  }
}

// One question at a time: Telegram refuses a second one while the first waits, and that refusal
// read as «nowhere» would wipe the place of a screen asking at the same moment (G66).
let asking: Promise<Point | null> | null = null;

// Where the person stands: asked once, then known while it stays allowed.
export function herePosition(): Promise<Point | null> {
  asking ??= askHere().finally(() => {
    asking = null;
  });
  return asking;
}
