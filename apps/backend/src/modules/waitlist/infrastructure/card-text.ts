import type { BrandConfig } from '@platform/brands';
import { routeFindLink, TASHKENT_CITY, withVia, type WaitlistRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import { bold, escapeHtml, italic, quote } from '../../../shared/telegram/html';
import type { Places } from '../../../shared/places/end-names';
import { appButton } from '../../../shared/telegram/open-button';
import type { CardView } from '../application/person';
import { friendLink, inviteText, routeNames } from './invite-text';

const { t, formatTime } = createI18n(DEFAULT_LOCALE);
// The mark of the links from the main bot to the trips (docs/116).
const VIA_WAITLIST = 'waitlist';
// «Oʻzgartirish» and «Yoʻnalish kanali» open the questionnaire on its sheet or its channels.
export const EDIT_LINK = { name: 'open', id: 'edit' } as const;
export const CHANNELS_LINK = { name: 'open', id: 'channels' } as const;

export const waitlistCardKey = (role: WaitlistRole) => `waitlist:${role}`;
export type Trips = { readonly today: number; readonly tomorrow: number };

const key = (value: string) => value as TranslationKey;
const routeOf = (region: string, places: Places) => {
  const { from, to } = routeNames(region, places);
  return { from: escapeHtml(from), to: escapeHtml(to) };
};
const tripsLink = (brand: BrandConfig, role: WaitlistRole, home: string, region: string) =>
  role === 'driver'
    ? `https://t.me/${brand.bots.driver}?startapp=${withVia('', VIA_WAITLIST)}`
    : routeFindLink(
        brand.bots.passenger,
        home === TASHKENT_CITY ? home : region,
        home === TASHKENT_CITY ? region : TASHKENT_CITY,
        VIA_WAITLIST,
      );

// Who waits, from 10 passengers only (docs/181): the passenger sees the drivers too.
function waitingLine({ record, waiting, opened }: CardView): string[] {
  if (waiting === null) return [];
  const count = String(waiting.passengers);
  if (record.role === 'driver') return [t('bot.main.waitingDriver', { count })];
  return [
    t(opened ? 'bot.main.waitingOpened' : 'bot.main.waiting', { count, drivers: String(waiting.drivers) }),
  ];
}

function lines(view: CardView, places: Places, trips: Trips | null): string[] {
  const { record, waiting, opened } = view;
  const route = t('bot.main.route', routeOf(record.region, places));
  const pains = record.pains.map((pain) => t(key(`bot.main.pain.${record.role}.${pain}`)));
  const chose = t('bot.main.chose', { pains: pains.join(', ') });
  if (opened && record.role === 'driver') {
    const head = t('bot.main.waitingDriverOpened', { count: String(waiting?.passengers ?? 0) });
    return [t('bot.main.opened'), bold(head), quote([route, chose])];
  }
  if (opened) {
    const head = t('bot.main.trips', {
      today: String(trips?.today ?? 0),
      tomorrow: String(trips?.tomorrow ?? 0),
    });
    return [t('bot.main.opened'), bold(head), quote([route, ...waitingLine(view)])];
  }
  const soon = bold(t('bot.main.soon', { when: t(key(`waitlist.cadence.${record.cadence}`)) }));
  const status = t(record.role === 'driver' ? 'bot.main.listedDriver' : 'bot.main.listed');
  return [status, soon, quote([route, ...waitingLine(view)]), chose];
}

// The live card of a record in the main bot (G68, docs/122, docs/181): pinned, without sound; green
// «✅ Yoʻnalish ochildi» once the team opened the direction.
export function waitlistCard(
  brand: BrandConfig,
  view: CardView,
  places: Places,
  now: number,
  trips: Trips | null,
): Card {
  const { record, opened } = view;
  const channels = appButton(brand, 'main', t('bot.main.directionChannel'), CHANNELS_LINK);
  const trip = {
    text: t(record.role === 'driver' ? 'bot.main.publish' : 'bot.main.find'),
    url: tripsLink(brand, record.role, record.home, record.region),
  };
  const share = `https://t.me/share/url?url=${encodeURIComponent(friendLink(brand, view.code))}&text=${encodeURIComponent(inviteText(brand, record, places))}`;
  const waiting = [
    ...(record.role === 'driver'
      ? [[{ text: t('bot.main.becomeDriver'), url: tripsLink(brand, 'driver', record.home, record.region) }]]
      : []),
    [{ text: t('bot.main.invite'), url: share }],
    [
      appButton(brand, 'main', t('bot.main.change'), EDIT_LINK),
      { text: t('bot.main.channel'), url: `https://t.me/${brand.mainChannel}` },
    ],
  ];
  const updated = t('bot.card.updated', { time: formatTime(new Date(now)) });
  return {
    bot: 'main',
    chatId: record.userId,
    key: waitlistCardKey(record.role),
    text: lines(view, places, trips).join('\n'),
    footer: italic(opened ? updated : `${updated} · ${t('bot.main.weekly')}`),
    markup: { inline_keyboard: opened ? [[trip, channels]] : waiting },
    pin: true,
  };
}

// One ring with sound under the green card (docs/181): the route, then what is new for this person.
export function openedRing(view: CardView, places: Places): Ring {
  const { record, waiting } = view;
  const { from, to } = routeOf(record.region, places);
  const line = t(key(`bot.main.now.${record.role}.${record.pains[0] ?? 'chats'}`));
  const news =
    record.role === 'driver'
      ? t('bot.main.ring.driver', { count: String(waiting?.passengers ?? 0), line })
      : t('bot.main.ring.passenger', { line });
  return {
    bot: 'main',
    chatId: record.userId,
    text: `${quote([`${from} ↔ ${to}`])}\n${news}`,
    card: waitlistCardKey(record.role),
    quiet: false,
  };
}
