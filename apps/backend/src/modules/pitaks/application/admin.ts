import {
  PITAK_STATUSES,
  pitakDirectionSchema,
  pitakInputSchema,
  type AdminPitak,
  type PitakDirection,
  type PitakChange,
} from '@platform/contracts';
import { fitsDirection, type DirectionRecord, type PitakRecord } from '../domain/pitak';
import type { PitaksDeps } from './ports';

// The pitaks in the admin (docs/72): the team adds, moves, renames and closes pitaks and says
// which pitak is the main one of each live direction. Every change goes to the history.
type AdminError = 'pitaks.not_found' | 'pitaks.invalid_input';
type Result<T> = { ok: true; value: T } | { ok: false; error: AdminError };
const HISTORY_LIMIT = 100;

const adminView = (pitak: PitakRecord): AdminPitak => ({
  id: pitak.id,
  name: pitak.name,
  point: pitak.point,
  regionId: pitak.regionId,
  status: pitak.status,
  updatedAt: pitak.updatedAt,
});
const directionView = ({ from, to, pitakId }: DirectionRecord): PitakDirection => ({ from, to, pitakId });
const text = (value: object | undefined) => (value ? JSON.stringify(value) : null);

export async function allPitaks(deps: PitaksDeps) {
  const [pitaks, directions] = await Promise.all([deps.store.all(), deps.store.directions()]);
  // What waits for a check by people first, the closed ones last; by region and name inside
  // each, as the store gives them (G41, docs/90 F-A13).
  const rank = (pitak: PitakRecord) => PITAK_STATUSES.indexOf(pitak.status);
  const ordered = [...pitaks].sort((a, b) => rank(a) - rank(b));
  return { pitaks: ordered.map(adminView), directions: directions.map(directionView) };
}

// A new pitak (no id) or a change of one; the region always comes from the point.
export async function savePitak(
  deps: PitaksDeps,
  by: number,
  id: string | null,
  input: unknown,
): Promise<Result<AdminPitak>> {
  const parsed = pitakInputSchema.safeParse(input);
  const regionId = parsed.success ? deps.regionOf(parsed.data.point) : null;
  if (!parsed.success || regionId === null) return { ok: false, error: 'pitaks.invalid_input' };
  const before = id ? await deps.store.find(id) : undefined;
  if (id && !before) return { ok: false, error: 'pitaks.not_found' };
  const now = deps.now();
  const { name, point, status } = parsed.data;
  const pitak: PitakRecord = {
    id: before?.id ?? deps.newId(),
    name,
    point: { lat: point.lat, lng: point.lng },
    regionId,
    status,
    createdAt: before?.createdAt ?? now,
    updatedAt: now,
  };
  await deps.store.save(pitak);
  await deps.store.log({
    subject: `pitak:${pitak.id}`,
    before: text(before),
    after: text(pitak),
    by,
    at: now,
  });
  return { ok: true, value: adminView(pitak) };
}

// A live direction and its main pitak: a pitak of the region the direction starts from, or none.
export async function saveDirection(
  deps: PitaksDeps,
  by: number,
  input: unknown,
): Promise<Result<PitakDirection>> {
  const parsed = pitakDirectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'pitaks.invalid_input' };
  const { from, to, pitakId } = parsed.data;
  if (from === to || !deps.isRegion(from) || !deps.isRegion(to))
    return { ok: false, error: 'pitaks.invalid_input' };
  const pitak = pitakId ? await deps.store.find(pitakId) : undefined;
  if (pitakId && !pitak) return { ok: false, error: 'pitaks.not_found' };
  if (pitak && !fitsDirection(pitak, { from })) return { ok: false, error: 'pitaks.invalid_input' };
  const before = await deps.store.direction(from, to);
  const now = deps.now();
  const direction: DirectionRecord = { from, to, pitakId, updatedAt: now };
  await deps.store.saveDirection(direction);
  const subject = `direction:${from}>${to}`;
  await deps.store.log({ subject, before: text(before), after: text(direction), by, at: now });
  return { ok: true, value: directionView(direction) };
}

export async function removeDirection(deps: PitaksDeps, by: number, from: string, to: string) {
  const before = await deps.store.direction(from, to);
  if (!before || !(await deps.store.removeDirection(from, to))) return false;
  const at = deps.now();
  await deps.store.log({ subject: `direction:${from}>${to}`, before: text(before), after: null, by, at });
  return true;
}

export async function pitakHistory(deps: PitaksDeps): Promise<PitakChange[]> {
  return (await deps.store.history(HISTORY_LIMIT)).map(({ subject, before, after, at }) => ({
    subject,
    before,
    after,
    at,
  }));
}
