import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { channelsOf } from './domain/route-channels';

// The real 67 channels of the brand (docs/176) and the places of the trips below.
const CHANNELS = loadBrand().channels;
const PLACES = new Map([
  ['1733', { parentId: null }],
  ['1733401', { parentId: '1733' }],
  ['1733236', { parentId: '1733' }],
  ['1727', { parentId: null }],
  ['1727401', { parentId: '1727' }],
  ['1727253', { parentId: '1727' }],
]);
const URGANCH_CITY = '-1004492557056';
const URGANCH_HUB = '-1004313383099';
const NURAFSHON = '-1003970856640';

describe('the post of a trip in the real channels of the brand (docs/176)', () => {
  // Owner decision 12.10.2026: a trip between two directions goes to both channels.
  it('posts a trip between two directions to the channels of both ends', () => {
    expect(channelsOf('1733401', '1727401', PLACES, CHANNELS)).toEqual([
      NURAFSHON,
      URGANCH_CITY,
      URGANCH_HUB,
    ]);
  });

  it('posts a trip inside one direction to its channel once', () => {
    expect(channelsOf('1727401', '1727253', PLACES, CHANNELS)).toEqual([NURAFSHON]);
    expect(channelsOf('1733236', '1733401', PLACES, CHANNELS)).toEqual([URGANCH_CITY, URGANCH_HUB]);
  });
});
