import { describe, expect, it } from 'vitest';
import { commonModes } from './pickup';

describe('when a trip suits a passenger: only the start matters (docs/70)', () => {
  it('follows the table of docs/70', () => {
    expect(commonModes('pitak', 'pitak')).toEqual(['pitak']);
    expect(commonModes('pitak', 'door')).toEqual([]);
    expect(commonModes('pitak', 'both')).toEqual(['pitak']);
    expect(commonModes('door', 'pitak')).toEqual([]);
    expect(commonModes('door', 'door')).toEqual(['door']);
    expect(commonModes('door', 'both')).toEqual(['door']);
    expect(commonModes('both', 'pitak')).toEqual(['pitak']);
    expect(commonModes('both', 'door')).toEqual(['door']);
    expect(commonModes('both', 'both')).toEqual(['pitak', 'door']);
  });
});
