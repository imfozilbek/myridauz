import { CAR_CATALOG, CAR_SEATS, MAX_SEATS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { presetSeats, seatsOf } from './car-choices';

describe('seats by the model of the car (docs/50)', () => {
  it('gives 4 to a usual car, more to a minivan and 4 to a typed name', () => {
    expect(seatsOf('Cobalt')).toBe(4);
    expect(seatsOf('Damas')).toBe(6);
    expect(seatsOf('Seagull')).toBe(3);
    expect(seatsOf('Matiz Best')).toBe(4);
    expect(seatsOf(undefined)).toBe(4);
  });

  it('knows seats only of models from the list, within the limit', () => {
    const models = Object.values(CAR_CATALOG).flat();
    for (const [model, seats] of Object.entries(CAR_SEATS)) {
      expect(models).toContain(model);
      expect(seats).toBeGreaterThan(0);
      expect(seats).toBeLessThanOrEqual(MAX_SEATS);
    }
  });

  it('brings the seats of a new model, but keeps the seats the driver changed', () => {
    expect(presetSeats({}, 'Damas')).toEqual({ seats: 6 });
    expect(presetSeats({ model: 'Cobalt', seats: 4 }, 'Damas')).toEqual({ seats: 6 });
    expect(presetSeats({ model: 'Damas', seats: 6 }, 'Cobalt')).toEqual({ seats: 4 });
    expect(presetSeats({ model: 'Cobalt', seats: 2 }, 'Damas')).toEqual({});
  });
});
