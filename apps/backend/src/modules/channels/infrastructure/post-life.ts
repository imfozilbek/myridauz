import { arrivalAt, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { bold } from '../../../shared/telegram/html';
import type { PostState } from '../domain/route-channels';
import { dayLabel, peopleOf, shortRoute, timeOf, whenLine } from './post-parts';

const { t } = createI18n(DEFAULT_LOCALE);

// What a channel post says about a trip, and its buttons; remove: the post goes away (docs/122).
export type Post = { readonly text: string; readonly markup: object; readonly remove?: boolean };
type Ended = Exclude<PostState, 'open' | 'lastSeat'>;
const NO_BUTTONS = { inline_keyboard: [] };

// «Bugun · 11:00»: the day and the time it leaves.
const atLine = (trip: Trip, now: number) =>
  bold(t('bot.channel.at', { day: dayLabel(trip.departAt, now), time: timeOf(trip.departAt) }));

// When the car came: «Yetib keldik» of the driver, or about when it was due.
const cameAt = (trip: Trip) => timeOf(trip.arrivedAt ?? arrivalAt(trip.departAt, trip.km));

function arrivedLines(trip: Trip, route: string): string[] {
  const people = peopleOf(trip);
  const time = cameAt(trip);
  if (people === 0) return [t('bot.channel.arrivedAlone', { route, time })];
  const values = { route, people: String(people), time };
  return [t('bot.channel.arrivedLine', values), t('bot.channel.split', values)];
}

// The life of a post (G68, mockup g68/5 «Post hayoti»): no seats, on the road, arrived, cancelled.
// The social proof stays: how many people went in one car; a find of the route under it.
export function lifePost(state: Ended, trip: Trip, places: Places, now: number, find: string): Post {
  const route = shortRoute(trip, places);
  const people = String(peopleOf(trip));
  const findButton = (key: 'bot.channel.similar' | 'bot.channel.next') => ({
    inline_keyboard: [[{ text: t(key), url: find }]],
  });
  if (state === 'full') {
    const text = [bold(t('bot.channel.full')), atLine(trip, now), t('bot.channel.going', { route, people })];
    return { text: text.join('\n'), markup: findButton('bot.channel.similar') };
  }
  if (state === 'started') {
    const who = peopleOf(trip) === 0 ? route : t('bot.channel.inCar', { route, people });
    return {
      text: [bold(t('bot.channel.started')), bold(whenLine(trip, now)), who].join('\n'),
      markup: NO_BUTTONS,
    };
  }
  if (state === 'arrived') {
    const text = [bold(t('bot.channel.arrived')), ...arrivedLines(trip, route)].join('\n');
    return { text, markup: findButton('bot.channel.next') };
  }
  // Telegram keeps a post older than 48 hours: then it says the trip is cancelled.
  const text = [bold(t('bot.channel.cancelled')), atLine(trip, now), route].join('\n');
  return { text, markup: NO_BUTTONS, remove: true };
}
