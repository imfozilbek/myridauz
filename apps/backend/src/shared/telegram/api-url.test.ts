import { afterEach, describe, expect, it } from 'vitest';
import { telegramUrl, useTelegramApi } from './api-url';

afterEach(() => useTelegramApi(undefined));

describe('telegramUrl', () => {
  it('goes to Telegram by default', () => {
    expect(telegramUrl('1:abc', 'sendMessage')).toBe('https://api.telegram.org/bot1:abc/sendMessage');
  });

  it('goes to the stand when the Worker is told so (docs/75)', () => {
    useTelegramApi('http://localhost:8790');
    expect(telegramUrl('1:abc', 'sendMessage')).toBe('http://localhost:8790/bot1:abc/sendMessage');
    useTelegramApi(undefined);
    expect(telegramUrl('1:abc', 'getMe')).toBe('https://api.telegram.org/bot1:abc/getMe');
  });
});
