import {
  DECIDED_STATUSES,
  MY_DECISIONS_DAYS,
  DAY_MS,
  type ApplicationSummary,
  type Car,
  type MyDecision,
} from '@platform/contracts';
import { oneOf } from '../../../shared/storage/one-of';
import { fixCar, reopen, type Application } from '../domain/application';
import { withCatalogSeats } from './apply';
import { summary } from './moderate';
import type { DriversDeps, Result } from './ports';

// The team finds and fixes its own decisions about driver applications (G95, docs/224).
type FixError = 'drivers.not_found' | 'drivers.wrong_status';

// «Mening qarorlarim»: the decisions of one member for 7 days, the newest first. A refusal the owner
// sent back to the check is no decision of the member: it is not here.
export async function myDecisions(deps: DriversDeps, memberId: number): Promise<MyDecision[]> {
  const since = deps.now() - MY_DECISIONS_DAYS * DAY_MS;
  const entries = await deps.decisions.by(memberId, since);
  // One person and one application per driver, however many decisions were his (D1 reads, docs/117).
  const drivers = new Map(
    [...new Set(entries.map((entry) => entry.userId))].map((userId) => [
      userId,
      Promise.all([deps.people.find(userId), deps.applications.find(userId)]),
    ]),
  );
  const shown = await Promise.all(
    entries.map(async (entry): Promise<MyDecision | null> => {
      const status = oneOf(DECIDED_STATUSES, entry.status);
      const [person, application] = (await drivers.get(entry.userId)) ?? [];
      const plate = entry.car?.plate ?? application?.car?.plate;
      if (!status || !person || !plate) return null;
      return { userId: person.publicId, firstName: person.firstName, status, plate, at: entry.at };
    }),
  );
  return shown.filter((decision): decision is MyDecision => decision !== null);
}

// One write on the application as it was read: two members never change it twice (G89 M5).
async function write(
  deps: DriversDeps,
  application: Application | undefined,
  change: (read: Application) => Application | 'drivers.wrong_status',
): Promise<Result<Application, FixError>> {
  if (!application) return { ok: false, error: 'drivers.not_found' };
  const next = change(application);
  if (typeof next === 'string') return { ok: false, error: next };
  if (!(await deps.applications.decide(next, application)))
    return { ok: false, error: 'drivers.wrong_status' };
  return { ok: true, value: next };
}

// «Mashinani tuzatish»: the car of an approved driver as its photo shows it; the seats of a model
// from the list follow it. The live trips, the waiting offers and their posts take it; the driver hears.
export async function fixApprovedCar(
  deps: DriversDeps,
  memberId: number,
  userId: number,
  given: Car,
): Promise<Result<ApplicationSummary, FixError>> {
  const car = withCatalogSeats(given);
  const at = deps.now();
  const read = await deps.applications.find(userId);
  const written = await write(deps, read, (application) => fixCar(application, car, memberId, at));
  if (!written.ok) return written;
  // The approved car is the fixed one now: «Oldingi qarorlar» and «было → стало» know it (G75).
  await deps.decisions.add({ userId, status: 'approved', reasons: [], by: memberId, at, car });
  await deps.carFixed(userId, car);
  await deps.notify.carFixed(written.value);
  const view = await summary(deps, written.value);
  return view ? { ok: true, value: view } : { ok: false, error: 'drivers.not_found' };
}

// «Rad etishni bekor qilish» of the owner: the application waits in «Navbat» again; the driver hears
// it will be checked once more.
export async function reopenRejected(
  deps: DriversDeps,
  ownerId: number,
  userId: number,
): Promise<Result<null, FixError>> {
  const at = deps.now();
  const written = await write(deps, await deps.applications.find(userId), (read) => reopen(read, at));
  if (!written.ok) return written;
  await deps.decisions.add({ userId, status: 'pending', reasons: [], by: ownerId, at, car: null });
  await deps.notify.reopened(written.value);
  return { ok: true, value: null };
}
