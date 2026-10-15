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

  // A new trip is one screen (G63, docs/118 path 6): the route on it, then published.
  it('follows the steps of a new trip in order and asks only for the events it reads', () => {
    const steps = funnelOf('new_trip', [row('trip_step', 'driver', 'route', 10)]).steps;
    expect(steps.map((step) => step.step)).toEqual(['route', 'published']);
    expect(FUNNEL_EVENTS).toContain('driver_approved');
    expect(FUNNEL_EVENTS).not.toContain('client_error');
  });
});

// The waitlist of G83 (docs/183): Start of the main bot, the app, the role, the server's record.
describe('the funnels of the waitlist', () => {
  const counters = [
    row('bot_command', 'main', 'start', 0, 100),
    row('waitlist_step', 'main', 'opened', 80),
    row('waitlist_step', 'main', 'passenger.role', 50),
    row('waitlist_step', 'main', 'driver.role', 10),
    row('waitlist_step', 'main', 'passenger.pains', 45),
    row('waitlist_step', 'main', 'passenger.route', 40),
    row('waitlist_step', 'main', 'passenger.when', 30),
    row('waitlist_step', 'main', 'passenger.listed', 0, 29),
    row('waitlist_step', 'main', 'driver.listed', 0, 8),
  ];

  it('goes from the bot to the list for both roles', () => {
    expect(funnelOf('waitlist', counters).steps.map((step) => [step.step, step.count])).toEqual([
      ['bot_opened', 100],
      ['opened', 80],
      ['role_chosen', 60],
      ['listed', 37],
    ]);
  });

  it('follows each role step by step', () => {
    expect(funnelOf('waitlist_passenger', counters).steps.map((step) => step.count)).toEqual([
      50, 45, 40, 30, 29,
    ]);
    expect(funnelOf('waitlist_driver', counters).steps.map((step) => step.count)).toEqual([10, 0, 0, 0, 8]);
    expect(FUNNEL_EVENTS).toEqual(expect.arrayContaining(['bot_command', 'waitlist_step']));
  });
});
