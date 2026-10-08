import { describe, expect, it } from 'vitest';
import { trip } from '../market/market-test-kit';
import { minutesLeft, STEP_OF, tripStage } from './trip-stage';

const MINUTE = 60 * 1000;
const AT = trip.departAt;

describe('the stage of the own trip (mockup g63/3, docs/118 path 6)', () => {
  it('is published until the hour before the departure: no main button yet', () => {
    expect(tripStage(trip, AT - 61 * MINUTE)).toBe('published');
    expect(STEP_OF.published).toBeNull();
  });

  it('asks «Yoʻlga chiqdim» from the hour before the departure', () => {
    expect(tripStage(trip, AT - 60 * MINUTE)).toBe('soon');
    expect(tripStage(trip, AT - 30 * MINUTE)).toBe('soon');
    expect(STEP_OF.soon).toBe('departed');
    expect(minutesLeft(trip, AT - 30 * MINUTE)).toBe(30);
    expect(minutesLeft(trip, AT - 29.5 * MINUTE)).toBe(30);
  });

  it('is on the way from the departure time while the trip keeps no moment of leaving', () => {
    expect(tripStage(trip, AT)).toBe('on_way');
    expect(STEP_OF.on_way).toBe('arrived');
  });

  it('follows the moment the driver left once the trip keeps it (G63 B1)', () => {
    expect(tripStage(trip, AT + 10 * MINUTE, null)).toBe('soon');
    expect(minutesLeft(trip, AT + 10 * MINUTE)).toBe(0);
    expect(tripStage(trip, AT - 20 * MINUTE, AT - 20 * MINUTE)).toBe('on_way');
  });

  it('is over for a cancelled or a completed trip: no button, nothing to cancel', () => {
    expect(tripStage({ ...trip, status: 'cancelled' }, AT - 61 * MINUTE)).toBe('over');
    expect(tripStage({ ...trip, status: 'completed' }, AT + 600 * MINUTE)).toBe('over');
    expect(STEP_OF.over).toBeNull();
  });

  it('a full trip goes through the same stages', () => {
    expect(tripStage({ ...trip, status: 'full' }, AT - 30 * MINUTE)).toBe('soon');
  });
});
