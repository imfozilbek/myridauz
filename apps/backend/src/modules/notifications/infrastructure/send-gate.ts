import type { Bindings } from '../../../env';
import type { NotificationJob } from '../application/job';
import { admit, type Place, type Sent } from '../application/pace';

// What each bot sent in the last second, kept by the Worker between requests and queue batches (one
// env a Worker): the gate of every message, taken at the moment it goes to Telegram (G86 T8). A gate
// taken earlier let messages that waited for the database meet in one moment: 429 on the stand.
const sentOf = new WeakMap<Bindings, Sent>();
const sentSeconds = (env: Bindings): Sent => {
  const kept = sentOf.get(env) ?? new Map();
  sentOf.set(env, kept);
  return kept;
};

// A message waits a moment here, not in the queue: the queue may be busy with many messages at once,
// and an answer never stands behind them (G86 T8 on the stand: 28 seconds). The gate counts on the
// clock that only goes forward (performance.now): a date held still (tests) never holds a message.
const GATE_WAIT_MS = 2000;
const STEP_MS = 100;
const sleep = (ms: number) => new Promise((resume) => setTimeout(resume, ms));

// A place for a message in the second of its bot, once it may go; null if there was no room for two
// seconds, then it waits in the queue. The place is marked when Telegram answered (sentAt).
export async function room(env: Bindings, body: NotificationJob): Promise<Place | null> {
  for (let waited = 0; waited < GATE_WAIT_MS; waited += STEP_MS) {
    const place = admit(sentSeconds(env), body, performance.now());
    if (place) return place;
    await sleep(STEP_MS);
  }
  return admit(sentSeconds(env), body, performance.now());
}
export function sentAt(place: Place | undefined): void {
  if (place) place.at = performance.now();
}
