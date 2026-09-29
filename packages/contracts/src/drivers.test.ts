import { describe, expect, it } from 'vitest';
import { carSchema, reasonsAt } from './drivers';
import { formatPlate } from './plate';
import { blockSchema, decisionSchema } from './moderation';

const car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  plate: '01 A 123 BC',
  seats: 4,
};

describe('car of a driver (docs/04, docs/35)', () => {
  it('accepts Uzbek plates of a person and of a company, kept without spaces', () => {
    expect(carSchema.parse(car).plate).toBe('01A123BC');
    expect(carSchema.parse({ ...car, plate: '10 123 abc' }).plate).toBe('10123ABC');
    expect(formatPlate('01A123BC')).toBe('01 A 123 BC');
    expect(formatPlate('10123ABC')).toBe('10 123 ABC');
    expect(formatPlate('X')).toBe('X');
    for (const plate of ['A 123 BC', '01 A 12 BC', '01A123B', 'ABC']) {
      expect(carSchema.safeParse({ ...car, plate }).success).toBe(false);
    }
  });

  it('keeps seats between 1 and 7 and a known color', () => {
    expect(carSchema.safeParse({ ...car, seats: 7 }).success).toBe(true);
    expect(carSchema.safeParse({ ...car, seats: 8 }).success).toBe(false);
    expect(carSchema.safeParse({ ...car, color: 'pink' }).success).toBe(false);
    expect(carSchema.safeParse({ ...car, make: '@car' }).success).toBe(false);
  });
});

describe('moderation input (docs/04, docs/17)', () => {
  it('needs one or more reasons for reject and changes, none for approve', () => {
    expect(decisionSchema.safeParse({ action: 'approve' }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: 'reject', reasons: [] }).success).toBe(false);
    const changes = { action: 'request_changes', reasons: ['car_mismatch', 'side_unclear'] };
    expect(decisionSchema.safeParse(changes).success).toBe(true);
    expect(decisionSchema.safeParse({ action: 'reject', reasons: ['photos_unclear'] }).success).toBe(false);
  });

  it('points each reason to the place the driver fixes', () => {
    const reasons = ['plate_not_readable', 'face_not_visible', 'front_unclear'] as const;
    expect(reasonsAt(reasons, 'front')).toEqual(['plate_not_readable', 'front_unclear']);
    expect(reasonsAt(reasons, 'side')).toEqual([]);
  });

  it('blocks for 1, 7, 30 days or for good', () => {
    expect(blockSchema.safeParse({ days: null }).success).toBe(true);
    expect(blockSchema.safeParse({ days: 30 }).success).toBe(true);
    expect(blockSchema.safeParse({ days: 2 }).success).toBe(false);
  });
});
