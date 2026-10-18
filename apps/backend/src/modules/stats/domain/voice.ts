import {
  COMPLAINT_REASONS,
  LEAVE_KINDS,
  LEAVE_REASONS,
  OPEN_KINDS,
  REVIEW_TAGS,
  SOURCE_BOT,
  SOURCE_DIRECT,
  type ComplaintReason,
  type ComplaintReasonCount,
  type LeaveCount,
  type OpenCount,
  type OpenKind,
  type RatingsSummary,
  type ReviewTag,
} from '@platform/contracts';
import { countOf, type Counter } from './counters';

// What people feel, in numbers (G87, docs/191). The stars of the period as the database sums them,
// the tags people gave and the reasons of each complaint.
export type StarsRow = { readonly count: number; readonly total: number; readonly low: number };
export type TagRow = { readonly tag: string; readonly count: number };
export type VoiceRows = {
  readonly stars: StarsRow;
  readonly tags: readonly TagRow[];
  readonly complaints: readonly (readonly ComplaintReason[])[];
};

export const LEAVE_EVENT = 'leave_reason';
export const FIRST_SCREEN = 'screen_open';
// The team opens its own app all day: not the people Rida is for.
const TEAM_APP = 'admin';
const TENTHS = 10;
const byCount = <T extends { readonly count: number }>(a: T, b: T) => b.count - a.count;
const isTag = (tag: string): tag is ReviewTag => (REVIEW_TAGS as readonly string[]).includes(tag);

// The mean with one decimal («4,6»), 0 without ratings; the tags most given first.
export function ratingsSummaryOf({ stars, tags }: VoiceRows): RatingsSummary {
  const average = stars.count === 0 ? 0 : Math.round((stars.total / stars.count) * TENTHS) / TENTHS;
  const known = tags.flatMap(({ tag, count }) => (isTag(tag) ? [{ tag, count }] : []));
  return { count: stars.count, average, low: stars.low, tags: known.sort(byCount) };
}

// Each reason a complaint names counts once; the most named first, the gravest first when equal.
export const complaintReasonCountsOf = ({ complaints }: VoiceRows): ComplaintReasonCount[] =>
  COMPLAINT_REASONS.map((reason) => ({
    reason,
    count: complaints.filter((reasons) => reasons.includes(reason)).length,
  }))
    .filter((row) => row.count > 0)
    .sort(byCount);

// The reasons people gave after a cancel or a deleted account, by kind, the most given first.
export const leavingOf = (counters: readonly Counter[]): LeaveCount[] =>
  LEAVE_KINDS.flatMap((kind) =>
    LEAVE_REASONS[kind]
      .map((reason) => ({
        kind,
        reason,
        count: countOf(counters, { name: LEAVE_EVENT, code: `${kind}.${reason}`, by: 'events' }),
      }))
      .filter((row) => row.count > 0)
      .sort(byCount),
  );

// The first screen of a session names how the app was opened: a message of a bot, the menu, a link.
const openKindOf = (source: string): OpenKind =>
  source === SOURCE_BOT ? 'bot' : source === SOURCE_DIRECT ? 'direct' : 'link';

export const opensOf = (counters: readonly Counter[]): OpenCount[] => {
  const first = counters.filter(
    (row) => row.name === FIRST_SCREEN && row.code !== '' && row.app !== TEAM_APP,
  );
  return OPEN_KINDS.map((kind) => ({
    kind,
    count: first.filter((row) => openKindOf(row.code) === kind).reduce((sum, row) => sum + row.sessions, 0),
  })).filter((row) => row.count > 0);
};
