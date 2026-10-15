import type { Waiting, WaitlistAnswers, WaitlistEntry, WaitlistMe, WaitlistRole } from '@platform/contracts';
import { orderedPains, waitingOf } from '../domain/waiting';
import type { OpeningStore, RecordStore, SwitchStore, VisitStore, WaitlistRecord } from './ports';

// A record with who waits on its direction and whether the direction is open (docs/181).
export type DirectionView = {
  readonly record: WaitlistRecord;
  readonly waiting: Waiting | null;
  readonly opened: boolean;
};
// One live card of the main bot: also the friend code of the person for «Doʻstimni chaqiraman».
export type CardView = DirectionView & { readonly code: string };

export type PersonDeps = {
  readonly records: RecordStore;
  readonly visits: VisitStore;
  readonly openings: OpeningStore;
  readonly switches: SwitchStore;
  // The channels of the brand the person is in (docs/176): «✓ Aʼzosiz», «N ta kanaldasiz».
  readonly channels: (userId: number) => Promise<string[]>;
  // The live cards of the main bot, edited without sound (G68, docs/122).
  readonly cards: (views: readonly CardView[]) => Promise<void>;
  // The server event of a new record: the step «Roʻyxatda» of the funnels (docs/183).
  readonly listed: (role: WaitlistRole) => void;
  readonly now: () => number;
};

type ViewDeps = Pick<PersonDeps, 'records' | 'openings' | 'visits'>;

async function viewOf(
  deps: Pick<PersonDeps, 'records' | 'openings'>,
  record: WaitlistRecord,
): Promise<DirectionView> {
  const first = orderedPains(record.role, record.pains)[0] ?? record.pains[0];
  const [counts, opening] = await Promise.all([
    first ? deps.records.counts(record.region, first) : null,
    deps.openings.of(record.region),
  ]);
  return { record, waiting: counts ? waitingOf(counts) : null, opened: opening !== null };
}

// The cards of some records with the friend code of each person.
export const cardViews = (deps: ViewDeps, records: readonly WaitlistRecord[]): Promise<CardView[]> =>
  Promise.all(
    records.map(async (record) => ({
      ...(await viewOf(deps, record)),
      code: (await deps.visits.of(record.userId)).code,
    })),
  );

// The cards of a person are shown now: the Monday update skips them (docs/181).
export async function showCards(deps: PersonDeps, records: readonly WaitlistRecord[]): Promise<void> {
  if (records.length === 0) return;
  await deps.cards(await cardViews(deps, records));
  const now = deps.now();
  for (const { userId, role } of records) await deps.records.shown(userId, role, now);
}

const entryOf = ({ record, waiting, opened }: DirectionView): WaitlistEntry => ({
  role: record.role,
  pains: record.pains,
  home: record.home,
  region: record.region,
  cadence: record.cadence,
  waiting,
  opened,
});

export async function readMe(deps: PersonDeps, userId: number): Promise<WaitlistMe> {
  const [records, state, channels] = await Promise.all([
    deps.records.of(userId),
    deps.switches.read(),
    deps.channels(userId),
  ]);
  const views = await Promise.all(records.map((record) => viewOf(deps, record)));
  return { open: state.open, entries: views.map(entryOf), channels };
}

// The app opened: its first touch is kept once (docs/116), then the person's records.
export async function openApp(deps: PersonDeps, userId: number, via: string | null, platform: string | null) {
  await deps.visits.opened(userId, via, platform, deps.now());
  return readMe(deps, userId);
}

// The answers are saved at «Qachon» (docs/183): leaving at the channels does not lose the person.
// While the list is closed no new record is made; an old one may still change (docs/181).
export async function saveAnswers(
  deps: PersonDeps,
  userId: number,
  answers: WaitlistAnswers,
): Promise<WaitlistMe | null> {
  const now = deps.now();
  const old = (await deps.records.of(userId)).find((record) => record.role === answers.role);
  if (!old && !(await deps.switches.read()).open) return null;
  const visit = await deps.visits.opened(userId, null, null, now);
  const record = {
    ...answers,
    pains: orderedPains(answers.role, answers.pains),
    userId,
    via: old?.via ?? visit.via,
    createdAt: old?.createdAt ?? now,
  };
  if (await deps.records.save(record, now)) deps.listed(answers.role);
  await showCards(deps, await deps.records.of(userId));
  return readMe(deps, userId);
}
