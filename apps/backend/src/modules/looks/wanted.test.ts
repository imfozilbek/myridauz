import { loadBrand, type BrandConfig } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import type { Bindings } from '../../env';
import { looksDeps } from './looks-deps';

const brand = loadBrand();
const TOKENS = {
  PASSENGER_BOT_TOKEN: '1:p',
  DRIVER_BOT_TOKEN: '2:d',
  ADMIN_BOT_TOKEN: '3:a',
  SUPPORT_BOT_TOKEN: '4:s',
  POSTER_BOT_TOKEN: '5:c',
};
const facesOf = (environment: string, env: object = TOKENS) =>
  looksDeps({ ...env, ENVIRONMENT: environment } as Bindings, fetch).faces;

// Telegram cuts nothing: a text too long is refused (Bot API limits).
const BOT = { name: 64, description: 512, short: 120 };
const CHANNEL = { name: 128, description: 255 };

// docs/180: every bot and channel of each environment with its look from the repository.
describe('the looks of an environment', () => {
  it('has the 5 bots, the main channel and every channel of the directions', () => {
    const keys = facesOf('production').map((face) => face.key);
    expect(keys.slice(0, 7)).toEqual([
      'bot:passenger',
      'bot:driver',
      'bot:admin',
      'bot:support',
      'bot:poster',
      `channel:@${brand.mainChannel}`,
      `channel:${brand.channels[0]?.chat}`,
    ]);
    expect(keys).toHaveLength(6 + brand.channels.length);
  });

  it('names every face with the name of its environment, the bot of its environment in the texts', () => {
    for (const environment of ['internal', 'production']) {
      const own: BrandConfig = loadBrand(brand.id, environment);
      const faces = facesOf(environment);
      expect(faces[0]?.look.name).toBe(`${own.name} | yoʻlovchi`);
      expect(faces[4]?.look).toEqual({ name: `${own.name} | poster` });
      expect(faces[5]?.look.name).toBe(`${own.name} | Oʻzbekiston`);
      expect(faces[5]?.look.description).toContain(`@${own.bots.passenger}`);
      expect(faces[5]?.look.avatar).toBe(`https://${own.domain}/channel/main-avatar.jpg`);
    }
  });

  it('keeps every text within the limits of Telegram', () => {
    for (const environment of ['internal', 'production'])
      for (const { key, look } of facesOf(environment)) {
        const limits = key.startsWith('bot:') ? BOT : { ...CHANNEL, short: 0 };
        expect(look.name.length, key).toBeLessThanOrEqual(limits.name);
        expect(look.description?.length ?? 0, key).toBeLessThanOrEqual(limits.description);
        expect(look.short?.length ?? 0, key).toBeLessThanOrEqual(limits.short);
      }
  });

  it('takes the pictures of the stand from its stub, and waits for the channels without their bot', () => {
    const stand = facesOf('production', {
      PASSENGER_BOT_TOKEN: '1:p',
      SITE_URL: 'http://localhost:1/__site',
    });
    expect(stand.map(({ key, look }) => [key, look.avatar])).toEqual([
      ['bot:passenger', 'http://localhost:1/__site/bot/passenger-avatar.jpg'],
    ]);
  });
});
