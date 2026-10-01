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

// Where the person stands, only when they already allowed it (G25): the main screen never asks.
export async function knownPosition(): Promise<Point | null> {
  try {
    if (locationManager.mount.isAvailable() && !locationManager.isMounted())
      await locationManager.mount({ timeout: CHECK_TIMEOUT_MS });
    return locationManager.isAccessGranted() ? await requestPosition() : null;
  } catch {
    return null;
  }
}
