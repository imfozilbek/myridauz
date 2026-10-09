import { expect, test } from '../crash-guard';
import { createModerationClient, createSubscriptionsClient } from '@platform/api-client';
import { CHILONZOR } from './market-kit';
import { SAMARQAND, tomorrow, wordsOf } from './g27-kit';
import { AZIZA, OWNER, SANJAR } from './people';
import { signedAs } from './stand-kit';
import { botMessages, runCron, standRows, standSql } from './stand-tools';
import { buttons, say } from './bot-kit';

// The bots (docs/80 S01 … S03) and the end of a subscription (docs/81 V12, docs/77 P71): Telegram
// sends an update with the secret of the stand, the bot answers in the reply itself.
test.describe.configure({ mode: 'serial' });

test('S01, S03. /start greets with the picture and «Ochish», /hujjatlar gives the three documents', async () => {
  const start = await say('passenger', AZIZA, '/start');
  expect(start.caption).toContain(wordsOf('bot.passenger.welcome'));
  expect(buttons(start)).toEqual(
    expect.arrayContaining([wordsOf('bot.open'), wordsOf('bot.passenger.becomeDriver')]),
  );
  expect(buttons(await say('passenger', AZIZA, '/hujjatlar'))).toHaveLength(3);
});

test('S02. /start of a blocked person says the block, nothing else', async () => {
  const [row] = standRows(`SELECT public_id FROM users WHERE id = ${SANJAR.id}`);
  await createModerationClient(await signedAs('admin', OWNER)).block(String(row?.['public_id']), 7);
  const start = await say('passenger', SANJAR, '/start');
  expect(start.text).toContain(wordsOf('bot.blocked'));
  expect(buttons(start)).toHaveLength(0);
});

test('V12, P71. a subscription of a day ends with the day; one of any day offers to renew', async () => {
  const subscriptions = createSubscriptionsClient(await signedAs('passenger', AZIZA));
  const route = { from: CHILONZOR, to: SAMARQAND, woman: false };
  const day = await subscriptions.subscribe({ ...route, date: tomorrow() });
  const any = await subscriptions.subscribe({ ...route, to: '1714401', date: null });
  standSql(
    `UPDATE route_subscriptions SET expires_at = ${Date.now() - 60_000} WHERE id IN ('${day.id}', '${any.id}')`,
  );
  await runCron();
  await expect.poll(async () => (await subscriptions.mine()).some((s) => s.id === day.id)).toBe(false);
  const renew = wordsOf('bot.news.ended');
  await expect
    .poll(async () => (await botMessages()).some((m) => m.chatId === AZIZA.id && m.text.includes(renew)))
    .toBe(true);
});
