import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from '../../bots/test-bot';
import { testEnv } from '../../test-api';
import { tellOwners } from '.';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const OWNER = 900;
// 2026-10-03 10:00 and 23:30 in Tashkent.
const DAY = Date.parse('2026-10-03T05:00:00Z');
const NIGHT = Date.parse('2026-10-03T18:30:00Z');

// «Diqqat» of the owner (G68, docs/122, mockup g68/4): one quiet card a day, a line per sign; only
// errors and a late case ring under it, and only in team hours.
describe('«Diqqat» of the owner', () => {
  it('keeps a quiet card, edits a line by its sign, rings for errors in the day only', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: DAY });
    await tellOwners(testEnv, { id: 'contact:p1', text: '💬 Bobur 3', ring: false });
    const card = telegram.sentTo(OWNER)[0];
    expect(card?.body).toMatchObject({ disable_notification: true });
    expect(String(card?.body.text)).toContain('Diqqat · bugun');
    await tellOwners(testEnv, { id: 'errors', text: '🔴 Xatolar', ring: true });
    const ring = telegram.sentTo(OWNER).find((sent) => sent.body.text === '🔴 Xatolar');
    expect(ring?.body.reply_parameters).toMatchObject({ message_id: card?.id });
    expect(ring?.body).not.toHaveProperty('disable_notification');
    await tellOwners(testEnv, { id: 'contact:p1', text: '💬 Bobur 6', ring: false });
    const last = String(telegram.sentTo(OWNER).at(-1)?.body.text);
    expect(last).toContain('💬 Bobur 6');
    expect(last).not.toContain('💬 Bobur 3');
    vi.setSystemTime(NIGHT);
    await tellOwners(testEnv, { id: 'errors', text: '🔴 Xatolar kechasi', ring: true });
    const night = telegram.sentTo(OWNER).find((sent) => sent.body.text === '🔴 Xatolar kechasi');
    expect(night?.body).toMatchObject({ disable_notification: true });
  });
});
