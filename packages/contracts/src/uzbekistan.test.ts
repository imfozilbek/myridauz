import { describe, expect, it } from 'vitest';
import { insideUzbekistan } from './uzbekistan';

describe('a pickup point is in Uzbekistan (docs/14, G22)', () => {
  it.each([
    ['Toshkent', 41.2995, 69.2401],
    ['Nukus', 42.4531, 59.6103],
    ['Termiz', 37.2242, 67.2783],
    ['Andijon', 40.7821, 72.3442],
    ['Samarqand', 39.6542, 66.9597],
    // Right at the border of Kazakhstan, north of Tashkent: the margin keeps it.
    ['Keles', 41.4031, 69.2031],
  ])('takes %s', (_name, lat, lng) => {
    expect(insideUzbekistan({ lat, lng })).toBe(true);
  });

  it.each([
    ['Olmaota', 43.2389, 76.8897],
    ['Bishkek', 42.8746, 74.5698],
    ['Dushanbe', 38.5598, 68.787],
    ['Ashxobod', 37.9601, 58.3261],
    ['Moskva', 55.7558, 37.6173],
    ['Null Island', 0, 0],
  ])('refuses %s', (_name, lat, lng) => {
    expect(insideUzbekistan({ lat, lng })).toBe(false);
  });
});
