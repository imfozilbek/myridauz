import type { NotificationJob } from '../notifications';
import type { GroupRequest, RequestPostsDeps } from './application/request-posts';
import { PLACES } from './channels-fixtures';
import type { GroupLook } from './infrastructure/group-look';
import { closedRequestPost, groupRequestPost } from './infrastructure/group-request';
import { createMemoryRequestPosts } from './infrastructure/request-posts';

// The setup of the tests of the requests in a direction group (G94, docs/223).
// 1.10.2026 05:00 in Tashkent.
const NOW = Date.parse('2026-10-01T00:00:00Z');
export const GROUP = '-100700';
const TILES = { hand: '301', finish: '302', clock: '303', people: '304', money: '305' };
const LOOK: GroupLook = {
  chats: new Set([GROUP]),
  cards: { cyrillic: true, marks: { trip: '111', request: '222' }, tiles: TILES },
};
export const PLAIN: GroupLook = { ...LOOK, cards: { cyrillic: true, marks: LOOK.cards.marks } };
export const tile = (id: string, shown: string) => `<tg-emoji emoji-id="${id}">${shown}</tg-emoji>`;
export const BUXORO = { chat: '@ch_buxoro', link: 'https://t.me/ch_buxoro', places: ['1706'] };
const CHANNELS = [{ chat: GROUP, link: 'https://t.me/group', places: ['1718'] }, BUXORO];
export const REQUEST: GroupRequest = {
  id: 'req-1',
  from: '1726269',
  to: '1718401',
  date: '2026-10-02',
  seats: 2,
  price: 90000,
  wholeCar: false,
  open: true,
};
export const TURQUOISE = '<tg-emoji emoji-id="222">🟦</tg-emoji>';
export const TAKE = 'https://t.me/driver_bot?startapp=requests_1726269_1718401_2026-10-02__ch-100700';

export function setup(
  request: GroupRequest = REQUEST,
  enabled = true,
  bot: 'group' | 'poster' = 'poster',
  look = LOOK,
) {
  let now = request;
  const sent: NotificationJob[] = [];
  const deps: RequestPostsDeps = {
    enabled,
    groups: LOOK.chats,
    bot,
    channels: async () => CHANNELS,
    places: async () => PLACES,
    request: async (id) => (id === now.id ? now : undefined),
    posts: createMemoryRequestPosts(),
    render: groupRequestPost('driver_bot', look),
    closed: closedRequestPost(LOOK),
    send: async (jobs) => void sent.push(...jobs),
    now: () => NOW,
  };
  return { deps, sent, change: (next: Partial<GroupRequest>) => void (now = { ...now, ...next }) };
}
