import { describe, expect, it } from 'vitest';
import { trip } from '../market/market-test-kit';
import { minutesLeft, tripStage, tripStep } from './trip-stage';

const MINUTE = 60 * 1000;
const AT = trip.departAt;

describe('the stage of the own trip (mockup g63/3, docs/118 path 6)', () => {
  it('is published until the hour before the departure: no main button yet', () => {
    expect(tripStage(trip, AT - 61 * MINUTE)).toBe('published');
    expect(tripStep(trip, AT - 61 * MINUTE)).toBeNull();
  });

  it('asks «Yoʻlga chiqdim» from the hour before the departure', () => {
    expect(tripStage(trip, AT - 60 * MINUTE)).toBe('soon');
    expect(tripStage(trip, AT - 30 * MINUTE)).toBe('soon');
    expect(tripStep(trip, AT - 60 * MINUTE)).toBe('departed');
    expect(minutesLeft(trip, AT - 30 * MINUTE)).toBe(30);
    expect(minutesLeft(trip, AT - 29.5 * MINUTE)).toBe(30);
    expect(minutesLeft(trip, AT - 1)).toBe(1);
  });

  it('is on the way from the time of the trip, as on the server: no «0 daqiqa», no cancel', () => {
    expect(tripStage(trip, AT)).toBe('on_way');
    expect(tripStage(trip, AT + 10 * MINUTE)).toBe('on_way');
    // The time alone never taps «Yoʻlga chiqdim» for the driver.
    expect(tripStep(trip, AT + 10 * MINUTE)).toBe('departed');
  });

  it('is on the way once the driver left early, then asks «Yetib keldik» (G63 B1)', () => {
    const left = { ...trip, departedAt: AT - 20 * MINUTE };
    expect(tripStage(left, AT - 20 * MINUTE)).toBe('on_way');
    expect(tripStep(left, AT - 20 * MINUTE)).toBe('arrived');
    expect(tripStep({ ...trip, departedAt: null }, AT - 30 * MINUTE)).toBe('departed');
  });

  it('is over once the driver arrived: no button, nothing to cancel', () => {
    const arrived = { ...trip, departedAt: AT, arrivedAt: AT + 300 * MINUTE };
    expect(tripStage(arrived, AT + 301 * MINUTE)).toBe('over');
    expect(tripStep(arrived, AT + 301 * MINUTE)).toBeNull();
  });

  it('is over for a cancelled or a completed trip: no button, nothing to cancel', () => {
    expect(tripStage({ ...trip, status: 'cancelled' }, AT - 61 * MINUTE)).toBe('over');
    expect(tripStage({ ...trip, status: 'completed' }, AT + 600 * MINUTE)).toBe('over');
    expect(tripStep({ ...trip, status: 'cancelled' }, AT - 30 * MINUTE)).toBeNull();
  });

  it('a full trip goes through the same stages', () => {
    expect(tripStage({ ...trip, status: 'full' }, AT - 30 * MINUTE)).toBe('soon');
  });
});
