import type { Booking } from '@platform/contracts';
import { choose } from '../telegram/feedback';

// Telegram shows at most three answers in its window (docs/21).
const MAX_ANSWERS = 3;

// The passenger a row of «Safardan keyin» is about: the only one, or the one chosen in the native
// window of Telegram; 'list' when the window cannot hold them all or Telegram is not there: the
// list screen asks then (RiderPick). null when the window is closed.
export async function pickRider(
  riders: readonly Booking[],
  question: string,
): Promise<Booking | 'list' | null> {
  if (riders.length <= 1) return riders[0] ?? null;
  if (riders.length > MAX_ANSWERS) return 'list';
  const chosen = await choose(
    question,
    riders.map(({ id, passenger }) => ({ id, text: passenger.firstName })),
  );
  if (chosen === undefined) return 'list';
  return riders.find(({ id }) => id === chosen) ?? null;
}
