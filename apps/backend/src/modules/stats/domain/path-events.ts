import type { PathRole, PathStepId } from '@platform/contracts';
import type { PathRow } from './paths';

// G99 (docs/234): the first moment of one step of one person, as the events keep it.
export type PathEvent = {
  readonly who: string;
  readonly entry: string;
  readonly tg: string;
  readonly platform: string;
  readonly name: string;
  readonly app: string;
  readonly code: string;
  readonly at: number;
};
// A step only the server sees, from the tables: the person, their first touch and its Telegram.
export type ServerStep = {
  readonly who: string;
  readonly entry: string | null;
  readonly client: string | null;
  readonly step: 'approved' | 'first_booking' | 'trip_done' | 'confirmed' | 'rode';
  readonly at: number;
};

// The events of the paths of docs/234 (T2).
export const PATH_EVENTS = [
  'screen_open',
  'way_step',
  'trip_search',
  'trip_open',
  'booking_step',
  'driver_application_step',
  'trip_step',
] as const;

type Step = readonly [PathRole, PathStepId];
function stepsOf({ name, app, code }: PathEvent): readonly Step[] {
  if (name === 'screen_open') return app === 'passenger' || app === 'driver' ? [[app, 'opened']] : [];
  if (name === 'way_step' && (code === 'from' || code === 'to')) return [['passenger', code]];
  if (name === 'trip_search')
    return code === 'found'
      ? [
          ['passenger', 'searched'],
          ['passenger', 'found'],
        ]
      : [['passenger', 'searched']];
  if (name === 'trip_open' && app === 'passenger') return [['passenger', 'trip_opened']];
  if (name === 'booking_step' && code === 'requested') return [['passenger', 'requested']];
  if (name === 'driver_application_step' && code === 'submitted') return [['driver', 'submitted']];
  if (name === 'trip_step' && code === 'published') return [['driver', 'trip_created']];
  return [];
}
const none = (value: string) => (value === '' ? null : value);

export const eventRows = (events: readonly PathEvent[]): PathRow[] =>
  events.flatMap((event) =>
    stepsOf(event).map(([role, step]) => ({
      who: event.who,
      entry: none(event.entry),
      tg: none(event.tg),
      platform: none(event.platform),
      role,
      step,
      at: event.at,
    })),
  );

// «android 8.0 chrome 120» of the first touch: the platform and the version of Telegram.
const DRIVER_STEPS = new Set(['approved', 'first_booking', 'trip_done']);
export const serverRows = (steps: readonly ServerStep[]): PathRow[] =>
  steps.map((row) => {
    const [platform, tg] = (row.client ?? '').split(' ');
    return {
      who: row.who,
      entry: row.entry,
      tg: tg ?? null,
      platform: platform || null,
      role: DRIVER_STEPS.has(row.step) ? 'driver' : 'passenger',
      step: row.step,
      at: row.at,
    };
  });
