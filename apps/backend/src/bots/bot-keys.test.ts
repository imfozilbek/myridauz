import { describe, expect, it } from 'vitest';
import type { Bindings } from '../env';
import { missingBotKeys, showMissingBotKeys } from './bot-keys';

const KEYS = {
  PASSENGER_BOT_TOKEN: 'p',
  DRIVER_BOT_TOKEN: 'd',
  ADMIN_BOT_TOKEN: 'a',
  SUPPORT_BOT_TOKEN: 's',
  MAIN_BOT_TOKEN: 'm',
  POSTER_BOT_TOKEN: 'c',
  CHANNEL_POSTS: 'on',
};
const envWith = (values: object = {}) => ({ ...KEYS, ...values }) as unknown as Bindings;

describe('the keys of the bots (lesson 331)', () => {
  it('names each bot without its key, the bot of the channels only while the posts are on', () => {
    expect(missingBotKeys(envWith())).toEqual([]);
    expect(missingBotKeys(envWith({ MAIN_BOT_TOKEN: undefined, SUPPORT_BOT_TOKEN: '' }))).toEqual([
      'main',
      'support',
    ]);
    expect(missingBotKeys(envWith({ POSTER_BOT_TOKEN: undefined }))).toEqual(['poster']);
    expect(missingBotKeys(envWith({ POSTER_BOT_TOKEN: undefined, CHANNEL_POSTS: 'off' }))).toEqual([]);
  });

  it('shows each missing key in «Statistika» as a server error of its bot', () => {
    const errors: string[] = [];
    const ANALYTICS = { writeDataPoint: ({ blobs }: { blobs: string[] }) => errors.push(blobs.join(' ')) };
    showMissingBotKeys(envWith({ ANALYTICS, POSTER_BOT_TOKEN: undefined, DRIVER_BOT_TOKEN: undefined }));
    expect(errors).toEqual(['server_error driver    no_key', 'server_error poster    no_key']);
    errors.length = 0;
    showMissingBotKeys(envWith({ ANALYTICS }));
    expect(errors).toEqual([]);
  });
});
