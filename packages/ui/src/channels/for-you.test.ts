import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { buildDirectory } from '../places/directory';
import { forYou, mostOf, routeChannel } from './for-you';

const brand = loadBrand();
const [first, second, third, fourth] = brand.channels;
const place = (zone: typeof first) => zone?.places[0] ?? '';
const TASHKENT = '1726273';
const directory = buildDirectory([]);
const channel = routeChannel(brand, directory);

describe('«Siz uchun» of «Kanallar» (G65, docs/119)', () => {
  it('takes the channel of the end that is not Tashkent, either way', () => {
    expect(channel({ from: TASHKENT, to: place(first) })).toBe(first?.chat);
    expect(channel({ from: place(second), to: TASHKENT })).toBe(second?.chat);
    expect(channel({ from: TASHKENT, to: TASHKENT })).toBeNull();
  });

  it('a habit is two trips at least to the same channel', () => {
    const one = { from: TASHKENT, to: place(first) };
    const other = { from: TASHKENT, to: place(second) };
    expect(mostOf([one, other], channel)).toBeNull();
    expect(mostOf([one, other, one], channel)).toBe(first?.chat);
  });

  it('three at most, each once, only channels that are there', () => {
    const made = new Set([first, second, third, fourth].map((zone) => zone?.chat ?? ''));
    made.delete(second?.chat ?? '');
    const picked = forYou(
      [
        [first?.chat ?? null, 'often'],
        [first?.chat ?? null, 'request'],
        [second?.chat ?? null, 'request'],
        [null, 'search'],
        [third?.chat ?? null, 'search'],
        [fourth?.chat ?? null, 'search'],
      ],
      made,
    );
    expect(picked).toEqual([
      { chat: first?.chat, reason: 'often' },
      { chat: third?.chat, reason: 'search' },
      { chat: fourth?.chat, reason: 'search' },
    ]);
  });
});
