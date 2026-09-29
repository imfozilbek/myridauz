import type { Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { postState } from '../domain/route-channels';

const { t, formatMoney, formatDate, formatWeekday, formatTime } = createI18n(DEFAULT_LOCALE);

type Place = { readonly name: string; readonly parentId: string | null };
type Places = ReadonlyMap<string, Place>;

// "Chilonzor, Toshkent shahri": the district and its region; a region alone by its name.
function label(id: string, places: Places): string {
  const place = places.get(id);
  if (!place) return id;
  const region = place.parentId ? places.get(place.parentId) : undefined;
  return region ? `${place.name}, ${region.name}` : place.name;
}

const HEADER = { open: null, full: 'bot.channel.full', cancelled: 'bot.channel.cancelled' } as const;

// The channel post of a trip (docs/15): no contacts, only a link button to the passenger Mini App.
// "Band qilish" is a url button: web_app buttons do not work in channels.
export const channelPost =
  (passengerBot: string) =>
  (trip: Trip, places: Places): { text: string; markup?: object } => {
    const state = postState(trip);
    const departAt = new Date(trip.departAt);
    const lines = [
      t('bot.channel.post', {
        from: label(trip.from, places),
        to: label(trip.to, places),
        date: `${formatDate(departAt)}, ${formatWeekday(departAt)}`,
        time: formatTime(departAt),
        seats: String(Math.max(trip.seatsLeft, 0)),
        price: formatMoney(trip.price),
      }),
      ...(trip.woman ? [t('bot.channel.woman')] : []),
    ];
    const header = HEADER[state];
    const text = [...(header ? [t(header), ''] : []), ...lines].join('\n');
    if (state !== 'open') return { text };
    const url = `https://t.me/${passengerBot}?startapp=trip_${trip.id}`;
    return { text, markup: { inline_keyboard: [[{ text: t('bot.channel.book'), url }]] } };
  };
