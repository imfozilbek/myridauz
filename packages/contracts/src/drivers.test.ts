import { describe, expect, it } from 'vitest';
import { carSchema, formatPlate } from './drivers';
import { blockSchema, decisionSchema } from './moderation';

const car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  year: 2020,
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
  it('needs a reason for reject and changes, none for approve', () => {
    expect(decisionSchema.safeParse({ action: 'approve' }).success).toBe(true);
    expect(decisionSchema.safeParse({ action: 'reject' }).success).toBe(false);
    expect(decisionSchema.safeParse({ action: 'request_changes', reason: 'car_mismatch' }).success).toBe(
      true,
    );
  });

  it('blocks for 1, 7, 30 days or for good', () => {
    expect(blockSchema.safeParse({ days: null }).success).toBe(true);
    expect(blockSchema.safeParse({ days: 30 }).success).toBe(true);
    expect(blockSchema.safeParse({ days: 2 }).success).toBe(false);
  });
});
