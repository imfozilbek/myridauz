import { afterAll, describe, expect, it, vi } from 'vitest';
import { SUPPORT_PER_MINUTE } from './support-bot';
import { botSender, fakeTelegram, textMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const PERSON = 77;
const OWNER = 7;

// A flood in the support bot does not flood the team: over the limit of a minute the messages are
// kept in the talk, not copied to the admin bot again (G42, docs/111).
describe('a flood in the support bot', () => {
  it('copies at most the limit of a minute to the team', async () => {
    for (let index = 0; index < SUPPORT_PER_MINUTE + 4; index += 1)
      await send('support', textMessage(PERSON, `Savol ${index}`));
    const copies = telegram
      .sentTo(OWNER)
      .concat(telegram.sentTo(8))
      .filter((sent) => String(sent.body.text).includes('Savol '));
    expect(copies).toHaveLength(SUPPORT_PER_MINUTE);
  });
});
