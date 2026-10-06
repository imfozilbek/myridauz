import { channelOf, loadBrand } from '@platform/brands';
import { channelVia, tashkentDate } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import './bookings-test-api';
import { fakeTelegram } from './bots/test-bot';
import { signTelegramData } from './shared/auth/test-signing';
import { call, nowSeconds, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
const MEMBER = 705;
// The bot asks Telegram whether the person is in the channel already (docs/119).
vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
  const member = input.endsWith('/getChatMember') && String(init?.body).includes(`"user_id":${MEMBER}`);
  return member ? Response.json({ ok: true, result: { status: 'member' } }) : telegram.fetch(input, init);
});
afterAll(() => vi.unstubAllGlobals());

const on = { env: { CHANNEL_POSTS: 'on' } };
const samarqand = channelOf(loadBrand(), '1718401');
const search = (id: number, from: string, init: object = on) =>
  call(`/trips?from=${from}&to=1726273&date=${tashkentDate(Date.now())}`, id, init);
const invites = (id: number) =>
  telegram.sentTo(id).filter((sent) => String(sent.body.text).includes('hududi kanalida'));

async function registerFrom(id: number, via: string) {
  const contact = await signTelegramData(
    testEnv.PASSENGER_BOT_TOKEN,
    { contact: { user_id: id, phone_number: `99891${id}` } },
    nowSeconds(),
  );
  const body = JSON.stringify({ consent: true, firstName: 'Ali', gender: 'male', contact, came: { via } });
  return call('/me/registration', id, {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
    ...on,
  });
}

describe('the channel of the zone of a new passenger (docs/119 row 6)', () => {
  it('invites a person who came by a channel post at the registration, once', async () => {
    expect((await registerFrom(701, channelVia(samarqand?.username ?? ''))).status).toBe(201);
    const [invite] = invites(701);
    expect(invite?.token).toBe(testEnv.PASSENGER_BOT_TOKEN);
    expect(JSON.stringify(invite?.body.reply_markup)).toContain(`https://t.me/${samarqand?.username ?? ''}`);
    await search(701, '1718401');
    expect(invites(701)).toHaveLength(1);
  });

  it('otherwise waits for the first search that tells the home', async () => {
    await registerUser(702);
    await search(702, '1718');
    expect(invites(702)).toEqual([]);
    await search(702, '1718401');
    await search(702, '1718401');
    expect(invites(702)).toHaveLength(1);
  });

  it('sends nothing to Toshkent, to a member and while the channel posts are off', async () => {
    await registerUser(703);
    await search(703, '1726273');
    await search(703, '1718401');
    await registerUser(704);
    await search(704, '1718401', {});
    await registerUser(MEMBER);
    await search(MEMBER, '1718401');
    expect([...invites(703), ...invites(704), ...invites(MEMBER)]).toEqual([]);
    // The posts off spent nothing: the invite goes once they are on.
    await search(704, '1718401');
    expect(invites(704)).toHaveLength(1);
  });
});
