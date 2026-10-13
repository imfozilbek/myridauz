import { describe, expect, it } from 'vitest';
import locations from '../apps/backend/seed/locations.json' with { type: 'json' };
import { channelOf } from './channels';
import { loadBrand } from './index';

const brand = loadBrand();
const TOSHKENT_SHAHRI = '1726';
const SAMARQAND_SHAHRI = '1718401';
const QOQON = '1730405';
const SHEROBOD = '1722223';

// 67 channels of directions (docs/176): every district and city outside Toshkent shahri is in one.
describe('the channels of the brand', () => {
  it('cover every place outside Toshkent shahri, each by a known place', () => {
    const places = locations.filter((place) => place.parentId && place.parentId !== TOSHKENT_SHAHRI);
    const covered = new Set(brand.channels.flatMap((channel) => channel.places));
    expect(places.filter((place) => !covered.has(place.id))).toEqual([]);
    const known = new Set(places.map((place) => place.id));
    expect([...covered].filter((id) => !known.has(id))).toEqual([]);
  });

  it('have their own chat, title, name and invite link', () => {
    expect(brand.channels).toHaveLength(67);
    for (const key of ['chat', 'title', 'name', 'link'] as const)
      expect(new Set(brand.channels.map((channel) => channel[key])).size).toBe(67);
    expect(brand.channels.every((channel) => /^-100\d+$/u.test(channel.chat))).toBe(true);
    expect(brand.channels.every((channel) => channel.link.startsWith('https://t.me/+'))).toBe(true);
  });

  // The name is copied from Telegram (owner 13.10.2026); the title says the same places for the texts.
  it('are named after the brand by the places of their title, as in Telegram', () => {
    for (const channel of brand.channels)
      expect(channel.name).toBe([brand.name, ...channel.title.split(', ')].join(' | '));
  });

  it('only pass a hub they cover', () => {
    for (const channel of brand.channels)
      expect((channel.hubs ?? []).filter((hub) => !channel.places.includes(hub))).toEqual([]);
  });
});

describe('channelOf', () => {
  it('gives the channel that names a place, not one that only passes it', () => {
    expect(channelOf(brand, QOQON)?.title).toBe('Qamchiq, Furqat, Qoʻqon');
    expect(channelOf(brand, SAMARQAND_SHAHRI)?.title).toBe('Samarqand shahri, Samarqand tumani');
  });

  it('gives the first channel of a place every channel only passes', () => {
    expect(channelOf(brand, SHEROBOD)?.title).toBe('Sherobod, Muzrabot, Termiz');
  });

  it('takes the next place when a place has no channel', () => {
    expect(channelOf(brand, '1726262', QOQON)?.title).toBe('Qamchiq, Furqat, Qoʻqon');
    expect(channelOf(brand, '1726262')).toBeUndefined();
  });
});
