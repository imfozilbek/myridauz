import type { Bindings } from '../../env';
import { unreadOf } from '../chat';
import { placesOf } from '../locations';
import { showCards } from '../notifications';
import { peopleOf } from '../users';
import { passengerNews } from './infrastructure/passenger-news';
import { brandOf } from '../../shared/brand/brand-of';

// The trip card of the passenger bot (G68, docs/122): the bookings, the reminders and the trips use it.
export const passengerNewsOf = (env: Bindings) =>
  passengerNews({
    brand: brandOf(env),
    places: () => placesOf(env),
    show: (cards, rings) => showCards(env, cards, rings),
    telegramId: (publicId) => peopleOf(env).idOf(publicId),
    unread: async (userId, chatKey) => (await unreadOf(env, userId)).get(chatKey) ?? 0,
    now: Date.now,
  });
