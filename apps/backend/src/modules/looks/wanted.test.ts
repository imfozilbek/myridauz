import { loadBrand, type BrandConfig } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import type { Bindings } from '../../env';
import { looksDeps } from './looks-deps';

const brand = loadBrand();
const ON = { POSTER_BOT_TOKEN: '5:c', CHANNEL_LOOKS: 'on' };
const facesOf = (environment: string, env: object = ON) =>
  looksDeps({ ...env, ENVIRONMENT: environment } as Bindings, fetch).faces;

// Telegram cuts nothing: a text too long is refused (Bot API limits).
const BOT_NAME = 64;
const CHANNEL = { name: 128, description: 255 };

// docs/180: every channel of each environment and their bot with the look from the repository.
describe('the looks of an environment', () => {
  it('has the bot of the channels, the main channel and every channel of the directions', () => {
    const keys = facesOf('production').map((face) => face.key);
    expect(keys.slice(0, 3)).toEqual([
      'bot:poster',
      `channel:@${brand.mainChannel}`,
      `channel:${brand.channels[0]?.chat}`,
    ]);
    expect(keys).toHaveLength(2 + brand.channels.length);
  });

  it('names every face with the name of its environment, the bot of its environment in the texts', () => {
    for (const environment of ['internal', 'production']) {
      const own: BrandConfig = loadBrand(brand.id, environment);
      const faces = facesOf(environment);
      expect(faces[0]?.look).toEqual({ name: `${own.name} | poster` });
      expect(faces[1]?.look.name).toBe(`${own.name} | Oʻzbekiston`);
      expect(faces[1]?.look.description).toContain(`@${own.bots.passenger}`);
      expect(faces[1]?.look.avatar).toBe(`https://${own.domain}/channel/main-avatar.jpg`);
    }
  });

  it('keeps every text within the limits of Telegram', () => {
    for (const environment of ['internal', 'production'])
      for (const { key, look } of facesOf(environment)) {
        const limits = key.startsWith('bot:') ? { name: BOT_NAME, description: 0 } : CHANNEL;
        expect(look.name.length, key).toBeLessThanOrEqual(limits.name);
        expect(look.description?.length ?? 0, key).toBeLessThanOrEqual(limits.description);
      }
  });

  it('touches nothing until the owner says yes to the texts or without the bot of the channels', () => {
    expect(facesOf('production', { POSTER_BOT_TOKEN: '5:c' })).toEqual([]);
    expect(facesOf('production', { CHANNEL_LOOKS: 'on' })).toEqual([]);
  });

  it('takes the pictures of the stand from its stub', () => {
    const stand = facesOf('production', { ...ON, SITE_URL: 'http://localhost:1/__site' });
    expect(stand[1]?.look.avatar).toBe('http://localhost:1/__site/channel/main-avatar.jpg');
  });
});
