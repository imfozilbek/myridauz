import { describe, expect, it } from 'vitest';
import { placeKind } from './place-kind';

describe('the kind of a named thing on the map (G23)', () => {
  it('reads mahallas, towns and streets', () => {
    expect(placeKind('places', 'neighbourhood')).toBe('mahalla');
    expect(placeKind('pois', 'residential')).toBe('mahalla');
    expect(placeKind('places', 'locality')).toBe('settlement');
    expect(placeKind('roads', 'minor_road')).toBe('street');
  });

  it('groups landmarks people meet at', () => {
    expect(placeKind('pois', 'marketplace')).toBe('market');
    expect(placeKind('pois', 'kindergarten')).toBe('school');
    expect(placeKind('pois', 'place_of_worship')).toBe('mosque');
    expect(placeKind('pois', 'hospital')).toBe('health');
    expect(placeKind('pois', 'bus_station')).toBe('transport');
    expect(placeKind('pois', 'cafe')).toBe('place');
  });

  it('leaves out water, rails, paths, shops and the rest nobody waits at', () => {
    expect(placeKind('water', 'river')).toBeNull();
    expect(placeKind('roads', 'rail')).toBeNull();
    expect(placeKind('roads', 'path')).toBeNull();
    expect(placeKind('earth', 'cliff')).toBeNull();
    expect(placeKind('places', 'country')).toBeNull();
    expect(placeKind('pois', 'clothes')).toBeNull();
    expect(placeKind('pois', 'peak')).toBeNull();
  });
});
