import type {
  AD_PLACES,
  AD_TARGETS,
  AdResult,
  Cadence,
  Opening,
  Pain,
  WaitlistAnswers,
  WaitlistRole,
} from '@platform/contracts';
import type { PainCounts, ReachRow, RoleRow } from '../domain/gold';
import type { DirectionCounts } from '../domain/waiting';

// One record of the list: the answers of a person for one role (docs/181).
export type WaitlistRecord = WaitlistAnswers & {
  readonly userId: number;
  readonly via: string | null;
  readonly createdAt: number;
  readonly notifiedAt: number | null;
};

export type RecordStore = {
  of(userId: number): Promise<WaitlistRecord[]>;
  // Inserts or changes the answers; the mark and the first moment stay. True: a new record.
  save(record: Omit<WaitlistRecord, 'notifiedAt'>, now: number): Promise<boolean>;
  counts(region: string, pain: Pain): Promise<DirectionCounts>;
  // The people of opened directions the bot has not told yet, a few at a time (docs/181).
  untold(weekAgo: number, limit: number): Promise<WaitlistRecord[]>;
  // Marks a record told only if nobody marked it since it was read: true for the one run that rings.
  told(record: WaitlistRecord, at: number): Promise<boolean>;
  // The cards not shown since a moment: the Monday update (docs/181).
  stale(since: number, limit: number): Promise<WaitlistRecord[]>;
  shown(userId: number, role: WaitlistRole, at: number): Promise<void>;
  // The records, the first touch and the joins by an ad of a deleted person (docs/58).
  forget(userId: number): Promise<void>;
};

// The first touch of a person (docs/116): the first mark and platform stay; the own friend code.
export type Visit = { readonly code: string; readonly via: string | null };
export type VisitStore = {
  of(userId: number): Promise<Visit>;
  started(userId: number, via: string | null, now: number): Promise<void>;
  opened(userId: number, via: string | null, platform: string | null, now: number): Promise<Visit>;
  invited(userId: number, now: number): Promise<Visit>;
};

export type OpeningStore = {
  of(region: string): Promise<Opening | null>;
  all(): Promise<ReadonlyMap<string, Opening>>;
  open(region: string, by: number, sent: number, now: number): Promise<void>;
};

// The switch of the list (docs/181): on until the owner turns it off.
type SwitchState = { readonly open: boolean; readonly at: number | null };
export type SwitchStore = {
  read(): Promise<SwitchState>;
  set(open: boolean, by: number, now: number): Promise<void>;
};

export type { PainCounts, ReachRow, RoleRow };
export type SideRow = { readonly role: WaitlistRole; readonly cadence: Cadence; readonly count: number };
type AfterRow = {
  readonly listed: number;
  readonly joined: number;
  readonly invited: number;
  readonly byFriends: number;
};
export type TeamReads = {
  regions(): Promise<RoleRow[]>;
  pains(role: WaitlistRole, region: string | null): Promise<PainCounts>;
  sides(region: string): Promise<SideRow[]>;
  since(region: string): Promise<number | null>;
  drivers(region: string): Promise<number[]>;
  toTell(region: string, before: number): Promise<number>;
  sources(since: number): Promise<ReachRow[]>;
  devices(since: number): Promise<ReachRow[]>;
  after(since: number): Promise<AfterRow>;
  hours(since: number): Promise<{ from: number; count: number }[]>;
  cadences(): Promise<{ cadence: Cadence; count: number }[]>;
  bothRoles(): Promise<number>;
};

// One ad link (docs/184): where it leads, the terms, the own invite link of a channel.
export type AdRow = {
  readonly code: string;
  readonly target: (typeof AD_TARGETS)[number];
  readonly channel: string | null;
  readonly invite: string | null;
  readonly place: (typeof AD_PLACES)[number];
  readonly name: string;
  readonly price: number | null;
  readonly days: number | null;
  readonly top: number;
  readonly pin: number;
  readonly at: number;
};
export type AdStore = {
  add(ad: AdRow, by: number): Promise<void>;
  all(): Promise<AdRow[]>;
  find(code: string): Promise<AdRow | null>;
  count(): Promise<number>;
  result(ad: AdRow): Promise<AdResult>;
  // A join by an invite link (chat_member): the ad of the link, the join, the leave.
  inviteOf(link: string): Promise<string | null>;
  joined(code: string, userId: number, chat: string, at: number): Promise<void>;
  left(userId: number, chat: string, at: number): Promise<void>;
};
