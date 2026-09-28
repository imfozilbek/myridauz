import { describe, expect, it } from 'vitest';
import { readTelegramContact, readTelegramUser } from './telegram-fields';
import { initDataFor, signTelegramData, TEST_NOW } from './test-signing';
import { verifySignedParams } from './verify-signed-params';

const TOKEN = '100:passenger-token';
const OTHER_TOKEN = '200:driver-token';
const options = { botToken: TOKEN, now: TEST_NOW, maxAgeSeconds: 60 };

describe('verifySignedParams', () => {
  it('accepts initData signed by the bot and reads the user', async () => {
    const result = await verifySignedParams(await initDataFor(TOKEN, 42), options);
    expect(result.ok).toBe(true);
    expect(result.ok && readTelegramUser(result.fields)).toEqual({
      id: 42,
      firstName: 'Ali',
      allowsWriteToPm: true,
    });
  });

  it('rejects initData of another bot', async () => {
    const result = await verifySignedParams(await initDataFor(OTHER_TOKEN, 42), options);
    expect(result).toEqual({ ok: false, error: 'auth.invalid' });
  });

  it('rejects expired initData', async () => {
    const old = await initDataFor(TOKEN, 42, TEST_NOW / 1000 - 61);
    expect(await verifySignedParams(old, options)).toEqual({ ok: false, error: 'auth.expired' });
  });

  it('rejects forged and empty data', async () => {
    const forged = (await initDataFor(TOKEN, 42)).replace('%3A42', '%3A43');
    expect(await verifySignedParams(forged, options)).toEqual({ ok: false, error: 'auth.invalid' });
    expect(await verifySignedParams('', options)).toEqual({ ok: false, error: 'auth.invalid' });
    expect(await verifySignedParams('hash=abc', options)).toEqual({ ok: false, error: 'auth.invalid' });
  });

  it('reads a signed contact and ignores broken JSON', async () => {
    const contact = await signTelegramData(TOKEN, { contact: { user_id: 42, phone_number: '998901234567' } });
    const result = await verifySignedParams(contact, options);
    expect(result.ok && readTelegramContact(result.fields)).toEqual({ userId: 42, phone: '998901234567' });
    expect(readTelegramUser(new Map([['user', '{broken']]))).toBeUndefined();
    expect(readTelegramContact(new Map())).toBeUndefined();
  });
});
