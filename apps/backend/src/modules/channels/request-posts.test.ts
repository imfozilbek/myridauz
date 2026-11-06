import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import {
  closeRequestPosts,
  postRequest,
  rememberRequestPost,
  type GroupRequest,
  type RequestPostsDeps,
} from './application/request-posts';
import { PLACES } from './channels-fixtures';
import type { GroupLook } from './infrastructure/group-look';
import { closedRequestPost, groupRequestPost } from './infrastructure/group-request';
import { createMemoryRequestPosts } from './infrastructure/request-posts';

// 1.10.2026 05:00 in Tashkent.
const NOW = Date.parse('2026-10-01T00:00:00Z');
const GROUP = '-100700';
const LOOK: GroupLook = {
  chats: new Set([GROUP]),
  cards: { cyrillic: true, marks: { trip: '111', request: '222' } },
};
const BUXORO = { chat: '@ch_buxoro', link: 'https://t.me/ch_buxoro', places: ['1706'] };
const CHANNELS = [{ chat: GROUP, link: 'https://t.me/group', places: ['1718'] }, BUXORO];
const REQUEST: GroupRequest = {
  id: 'req-1',
  from: '1726269',
  to: '1718401',
  date: '2026-10-02',
  seats: 2,
  price: 90000,
  wholeCar: false,
  open: true,
};
const TURQUOISE = '<tg-emoji emoji-id="222">🟦</tg-emoji>';
const TAKE = 'https://t.me/driver_bot?startapp=requests_1726269_1718401_2026-10-02__ch-100700';

function setup(request: GroupRequest = REQUEST, enabled = true) {
  let now = request;
  const sent: NotificationJob[] = [];
  const deps: RequestPostsDeps = {
    enabled,
    groups: LOOK.chats,
    channels: async () => CHANNELS,
    places: async () => PLACES,
    request: async (id) => (id === now.id ? now : undefined),
    posts: createMemoryRequestPosts(),
    render: groupRequestPost('driver_bot', LOOK),
    closed: closedRequestPost(LOOK),
    send: async (jobs) => void sent.push(...jobs),
    now: () => NOW,
  };
  return { deps, sent, change: (next: Partial<GroupRequest>) => void (now = { ...now, ...next }) };
}

// A passenger's request of the Mini App in a direction group (owner, 05.11.2026, docs/223).
describe('the requests of passengers in a direction group (G94, docs/223)', () => {
  it('goes to the group of its route only, without sound, as the group cards with the turquoise R', async () => {
    const { deps, sent } = setup();
    await postRequest(deps, REQUEST.id);
    expect(sent).toHaveLength(1);
    const [job] = sent;
    expect(job).toMatchObject({ bot: 'poster', chatId: GROUP, html: true, silent: true });
    expect(job?.after).toEqual({ type: 'requestPost', requestId: 'req-1', chat: GROUP });
    expect(job?.text.split('\n')).toEqual([
      `<b>🙋 МАШИНА КЕРАК · Чилонзордан</b> ${TURQUOISE}`,
      '🏁 Самарқанд шаҳрига кетаман',
      '🕒 Эртага, 2-октябр',
      '🧍 2 киши · 💰 90 000',
    ]);
    expect(job?.markup).toEqual({ inline_keyboard: [[{ text: '🙋 Йўловчини олиш', url: TAKE }]] });
  });

  it('4 people or the whole car: «BOʻSH MASHINA KERAK»', async () => {
    const { deps, sent } = setup({ ...REQUEST, wholeCar: true });
    await postRequest(deps, REQUEST.id);
    expect(sent[0]?.text).toContain('<b>🙋 БЎШ МАШИНА КЕРАК · Чилонзордан</b>');
  });

  it('nothing when the posts are off, the request is closed, or no group is on its route', async () => {
    const off = setup(REQUEST, false);
    await postRequest(off.deps, REQUEST.id);
    const closed = setup({ ...REQUEST, open: false });
    await postRequest(closed.deps, REQUEST.id);
    const elsewhere = setup({ ...REQUEST, to: '1706401' });
    elsewhere.deps = { ...elsewhere.deps, channels: async () => [BUXORO] };
    await postRequest(elsewhere.deps, REQUEST.id);
    expect([...off.sent, ...closed.sent, ...elsewhere.sent]).toEqual([]);
  });

  it('a closed request: its post says so and is deleted, once', async () => {
    const { deps, sent, change } = setup();
    await rememberRequestPost(deps, { requestId: REQUEST.id, chat: GROUP, messageId: 41 });
    change({ open: false });
    await closeRequestPosts(deps, REQUEST.id);
    expect(sent.map(({ edit, remove }) => [edit, remove])).toEqual([
      [41, undefined],
      [41, true],
    ]);
    expect(sent[0]?.text).toBe('<b>✅ Йўловчи сўрови ёпилди</b>');
    expect(sent[0]?.markup).toEqual({ inline_keyboard: [] });
    await closeRequestPosts(deps, REQUEST.id);
    expect(sent).toHaveLength(2);
  });

  it('a request that closed while its post waited in the queue closes the post at once', async () => {
    const { deps, sent, change } = setup();
    change({ open: false });
    await rememberRequestPost(deps, { requestId: REQUEST.id, chat: GROUP, messageId: 42 });
    expect(sent.map(({ edit, remove }) => [edit, remove])).toEqual([
      [42, undefined],
      [42, true],
    ]);
  });
});
