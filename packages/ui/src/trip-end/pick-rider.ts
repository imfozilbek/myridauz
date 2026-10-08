import type { Booking } from '@platform/contracts';
import { choose } from '../telegram/feedback';

// Telegram shows at most three answers in its window (docs/21).
const MAX_ANSWERS = 3;

// The passenger a row of «Safardan keyin» is about: the only one, or the one chosen in the native
// window of Telegram; null when closed or outside Telegram.
export async function pickRider(riders: readonly Booking[], question: string): Promise<Booking | null> {
  if (riders.length <= 1) return riders[0] ?? null;
  const answers = riders
    .slice(0, MAX_ANSWERS)
    .map(({ id, passenger }) => ({ id, text: passenger.firstName }));
  const chosen = await choose(question, answers);
  return riders.find(({ id }) => id === chosen) ?? null;
}
