import { describe, expect, it } from 'vitest';
import { REGION_ORDER, regionOrder } from './region-order';

const PLACES = new Map(REGION_ORDER.map((id) => [id, { id }]));
const NONE = new Map<string, number>();

// One order of «Qayerga» for passengers and drivers (owner decision 12.11.2026, docs/118).
describe('the order of the regions of «Qayerga»', () => {
  it('from Toshkent shahri starts with Qashqadaryo and leaves the own region out', () => {
    const order = regionOrder(NONE, '1726', PLACES);
    expect(order.slice(0, 3)).toEqual(['1710', '1718', '1706']);
    expect(order).not.toContain('1726');
    expect(order).toHaveLength(REGION_ORDER.length - 1);
  });

  it('from Samarqand starts with Toshkent shahri, then Qashqadaryo, without Samarqand', () => {
    const order = regionOrder(NONE, '1718', PLACES);
    expect(order.slice(0, 2)).toEqual(['1726', '1710']);
    expect(order).not.toContain('1718');
  });

  it('puts the busy regions first, the busiest on top, a tie in the fixed order', () => {
    const activity = new Map([
      ['1735', 1],
      ['1703', 5],
      ['1730', 1],
      ['1708', 0],
    ]);
    expect(regionOrder(activity, '1726', PLACES).slice(0, 4)).toEqual(['1703', '1730', '1735', '1710']);
  });

  it('never shows the own region, however busy, nor a region the directory does not know', () => {
    const activity = new Map([
      ['1726', 9],
      ['1799', 3],
    ]);
    const order = regionOrder(activity, '1726', PLACES);
    expect(order[0]).toBe('1710');
    expect(order).not.toContain('1799');
  });
});
