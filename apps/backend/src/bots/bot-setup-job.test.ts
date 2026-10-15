import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Bindings } from '../env';
import { testD1 } from '../test-d1';
import { setupBotsWhenChanged } from './bot-setup-job';

afterEach(() => vi.restoreAllMocks());

const TOKENS = { PASSENGER_BOT_TOKEN: 'p', DRIVER_BOT_TOKEN: 'd', TELEGRAM_WEBHOOK_SECRET: 'hook' };

function telegram(status = 200) {
  const urls: string[] = [];
  const fetch = async (url: string) => {
    urls.push(url);
    return new Response(url.endsWith('.jpg') ? new Uint8Array([255]) : '{}', { status });
  };
  return { urls, fetch, hooks: () => urls.filter((url) => url.endsWith('/setWebhook')) };
}

// The owner adds the token of a new bot from a phone (G83): the next Cron tick sets it up, no
// command from a computer; nothing is sent again while the tokens and texts stay the same.
describe('the Cron sets the bots up by itself', () => {
  it('sets the bots up once, and again when a new bot gets its token', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const env = { ...TOKENS, DB: testD1() } as unknown as Bindings;
    const first = telegram();
    await setupBotsWhenChanged(env, first.fetch, 1);
    expect(first.hooks()).toEqual([
      'https://api.telegram.org/botp/setWebhook',
      'https://api.telegram.org/botd/setWebhook',
    ]);
    const again = telegram();
    await setupBotsWhenChanged(env, again.fetch, 2);
    expect(again.urls).toEqual([]);
    const withMain = { ...env, MAIN_BOT_TOKEN: 'm' } as unknown as Bindings;
    const next = telegram();
    await setupBotsWhenChanged(withMain, next.fetch, 3);
    expect(next.hooks()).toContain('https://api.telegram.org/botm/setWebhook');
  });

  it('tries again on the next tick when Telegram refused, and waits for the secret', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const env = { ...TOKENS, DB: testD1() } as unknown as Bindings;
    await expect(setupBotsWhenChanged(env, telegram(502).fetch, 1)).rejects.toThrow(
      'telegram.setWebhook_502',
    );
    const retry = telegram();
    await setupBotsWhenChanged(env, retry.fetch, 2);
    expect(retry.hooks()).toHaveLength(2);
    const noSecret = telegram();
    const unset = { ...TOKENS, TELEGRAM_WEBHOOK_SECRET: undefined, DB: testD1() } as unknown as Bindings;
    await setupBotsWhenChanged(unset, noSecret.fetch, 3);
    expect(noSecret.urls).toEqual([]);
  });
});
