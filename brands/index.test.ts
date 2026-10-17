import { describe, expect, it } from 'vitest';
import { brandForApp, channelOf, loadBrand, UnknownBrandError, UnknownEnvironmentError } from './index';

describe('loadBrand', () => {
  it('returns the main brand in production by default', () => {
    expect(loadBrand()).toMatchObject({
      domain: 'ridaone.uz',
      slogan: 'Manzil sari',
      monetization: 'commission',
      mainChannel: 'rida1uz',
    });
    expect(loadBrand()).toBe(loadBrand('rida', 'production'));
    expect(loadBrand().channels).toHaveLength(67);
    // The main bot of production: owner decision 15.10.2026 (docs/181).
    expect(loadBrand().bots.main).toBe('ridauz_bot');
  });

  // docs/179: the team works on the first account with its own name, address, bots and channels.
  it('gives the internal environment its own name, address, bots and channels, the rest the same', () => {
    const internal = loadBrand('rida', 'internal');
    const production = loadBrand('rida', 'production');
    expect(internal).toMatchObject({
      name: 'MyRida',
      domain: 'myrida.uz',
      indexed: false,
      mainChannel: 'myrida_uz',
      posts: true,
    });
    expect(production.posts).toBe(false);
    expect(internal.bots.passenger).toBe('myrida_bot');
    const bots = (brand: typeof internal) => Object.values(brand.bots);
    expect(bots(internal).filter((bot) => bots(production).includes(bot))).toEqual([]);
    const chats = new Set(production.channels.map((channel) => channel.chat));
    expect(internal.channels.filter((channel) => chats.has(channel.chat))).toEqual([]);
    const shared = { name: 0, domain: 0, indexed: 0, bots: 0, channels: 0, mainChannel: 0, posts: 0 };
    expect({ ...internal, ...shared }).toEqual({ ...production, ...shared });
  });

  // G84: the team sees a trip of any direction in its one channel «MyRida | Viloyatlar».
  it('gives every place of the directions the one channel of the internal environment', () => {
    const internal = loadBrand('rida', 'internal');
    const places = loadBrand('rida', 'production').channels.flatMap((channel) => channel.places);
    expect(internal.channels.map((channel) => channel.name)).toEqual(['MyRida | Viloyatlar']);
    expect(new Set(places.map((place) => channelOf(internal, place)?.name))).toEqual(
      new Set(['MyRida | Viloyatlar']),
    );
  });

  it('returns a brand by id', () => {
    expect(loadBrand('rida').name).toBe('Rida');
  });

  it('fails on an unknown brand or environment', () => {
    expect(() => loadBrand('unknown')).toThrow(UnknownBrandError);
    expect(() => loadBrand('rida', 'staging')).toThrow(UnknownEnvironmentError);
    expect(() => loadBrand('rida', 'toString')).toThrow(UnknownEnvironmentError);
  });
});

describe('brandForApp (docs/20)', () => {
  const brand = loadBrand();
  it('gives each Mini App its own main color and keeps the rest', () => {
    const passenger = brandForApp(brand, 'passenger').theme.colors;
    const driver = brandForApp(brand, 'driver').theme.colors;
    const admin = brandForApp(brand, 'admin').theme.colors;
    expect(passenger).toEqual(brand.theme.colors);
    expect(new Set([passenger.brandStrong, driver.brandStrong, admin.brandStrong]).size).toBe(3);
    expect(driver.text).toBe(passenger.text);
    expect(admin.danger).toBe(passenger.danger);
  });
});
