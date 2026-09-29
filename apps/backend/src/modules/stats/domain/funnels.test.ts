import { describe, expect, it } from 'vitest';
import type { Counter } from './counters';
import { FUNNEL_EVENTS, funnelOf } from './funnels';

const row = (name: string, app: string, code: string, sessions: number, events = sessions): Counter => ({
  name,
  app,
  code,
  sessions,
  events,
});

describe('funnelOf (docs/29)', () => {
  it('counts people on each step and the share that left from the step before', () => {
    const counters = [
      row('screen_open', 'passenger', '', 200, 900),
      row('screen_open', 'driver', '', 50),
      row('trip_search', 'passenger', '', 120),
      row('trip_open', 'passenger', '', 60),
      row('booking_step', 'passenger', 'requested', 30),
      row('booking_step', 'passenger', 'seats', 40),
      row('chat_first_message', 'passenger', '', 15),
      row('booking_step', 'driver', 'confirmed', 3, 12),
      row('boarded', 'passenger', '', 9, 9),
    ];
    const funnel = funnelOf('passenger', counters);
    expect(funnel.steps.map((step) => [step.step, step.count, step.drop])).toEqual([
      ['opened', 200, null],
      ['searched', 120, 40],
      ['trip_opened', 60, 50],
      ['requested', 30, 50],
      ['chat', 15, 50],
      // Confirmed by the driver in another session: counted by events.
      ['confirmed', 12, 20],
      ['boarded', 9, 25],
    ]);
  });

  it('shows no negative drop and no drop after an empty step', () => {
    const counters = [
      row('screen_open', 'driver', '', 0),
      row('driver_application_step', 'driver', 'car', 5),
    ];
    const [opened, started, submitted] = funnelOf('driver', counters).steps;
    expect([opened?.drop, started?.drop, submitted?.drop]).toEqual([null, 0, 100]);
  });

  it('follows the steps of a new trip in order and asks only for the events it reads', () => {
    const steps = funnelOf('new_trip', [row('trip_step', 'driver', 'route', 10)]).steps;
    expect(steps.map((step) => step.step)).toEqual([
      'route',
      'date',
      'time',
      'seats',
      'price',
      'woman',
      'comment',
      'published',
    ]);
    expect(FUNNEL_EVENTS).toContain('driver_approved');
    expect(FUNNEL_EVENTS).not.toContain('client_error');
  });
});
