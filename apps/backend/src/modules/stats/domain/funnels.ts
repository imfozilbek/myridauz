import { FUNNEL_STEPS, FUNNELS, type Funnel, type FunnelId, type FunnelStepId } from '@platform/contracts';
import { countOf, type Counter, type StepMatch } from './counters';

const PERCENT = 100;

// Which events make each step of docs/29. A session is one opening of a Mini App.
const PASSENGER: Readonly<Record<(typeof FUNNEL_STEPS.passenger)[number], StepMatch>> = {
  opened: { name: 'screen_open', app: 'passenger', by: 'sessions' },
  searched: { name: 'trip_search', app: 'passenger', by: 'sessions' },
  trip_opened: { name: 'trip_open', app: 'passenger', by: 'sessions' },
  requested: { name: 'booking_step', code: 'requested', by: 'sessions' },
  chat: { name: 'chat_first_message', app: 'passenger', by: 'sessions' },
  confirmed: { name: 'booking_step', code: 'confirmed', by: 'events' },
  boarded: { name: 'boarded', by: 'events' },
};
const DRIVER: Readonly<Record<(typeof FUNNEL_STEPS.driver)[number], StepMatch>> = {
  opened: { name: 'screen_open', app: 'driver', by: 'sessions' },
  started: { name: 'driver_application_step', code: 'car', by: 'sessions' },
  submitted: { name: 'driver_application_step', code: 'submitted', by: 'sessions' },
  approved: { name: 'driver_approved', by: 'events' },
  trip_created: { name: 'trip_step', code: 'published', by: 'events' },
  confirmed: { name: 'booking_step', code: 'confirmed', by: 'events' },
};
const newTripStep = (step: string): StepMatch => ({ name: 'trip_step', code: step, by: 'sessions' });
const wayStep = (step: string): StepMatch => ({ name: 'way_step', code: step, by: 'sessions' });

const matchOf = (id: FunnelId, step: FunnelStepId): StepMatch =>
  id === 'passenger'
    ? PASSENGER[step as keyof typeof PASSENGER]
    : id === 'driver'
      ? DRIVER[step as keyof typeof DRIVER]
      : id === 'way'
        ? wayStep(step)
        : newTripStep(step);

// Who did not come from the previous step, in percent. More on a later step is no drop.
const dropOf = (previous: number, current: number) =>
  previous === 0 ? 0 : Math.max(0, Math.round(((previous - current) / previous) * PERCENT));

export function funnelOf(id: FunnelId, counters: readonly Counter[]): Funnel {
  const steps: readonly FunnelStepId[] = FUNNEL_STEPS[id];
  const counts = steps.map((step) => countOf(counters, matchOf(id, step)));
  return {
    id,
    steps: steps.map((step, index) => ({
      step,
      count: counts[index] ?? 0,
      drop: index === 0 ? null : dropOf(counts[index - 1] ?? 0, counts[index] ?? 0),
    })),
  };
}

// The event names the funnels read: the query asks only for them.
export const FUNNEL_EVENTS = [
  ...new Set(FUNNELS.flatMap((id) => FUNNEL_STEPS[id].map((step: FunnelStepId) => matchOf(id, step).name))),
];
