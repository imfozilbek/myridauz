import { appHost, type BrandConfig } from '@platform/brands';
import { STARS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import { driverTripCard, passengerTripCard } from '../../../shared/telegram/card-keys';
import type { RatingsDeps } from '../application/ports';

const { t } = createI18n(DEFAULT_LOCALE);

// "rate:<booking>:<stars>": the bot answers the press (bots/rating-callbacks.ts).
export const RATE_PREFIX = 'rate';
export const REVIEW_PARAM = 'review';
export const COMPLAIN_PARAM = 'complain';

type Send = (jobs: readonly NotificationJob[]) => Promise<void>;

// "Safar qanday oʻtdi?" from the rater's own bot, with 1 … 5 and the review in the Mini App (docs/24),
// as an answer to the trip card of that bot (G68, docs/122).
export const botAsker =
  (brand: BrandConfig, send: Send): RatingsDeps['ask'] =>
  async (ask, rateeName, { rater, tripId }, reminder) => {
    const stars = STARS.map((value) => ({
      text: `${value} ⭐`,
      callback_data: `${RATE_PREFIX}:${ask.bookingId}:${value}`,
    }));
    const url = `https://${appHost(brand, rater)}/?${REVIEW_PARAM}=${ask.bookingId}`;
    const text = t(reminder ? 'bot.rating.remind' : 'bot.rating.ask', { name: rateeName });
    const markup = { inline_keyboard: [stars, [{ text: t('bot.rating.review'), web_app: { url } }]] };
    const card = rater === 'passenger' ? passengerTripCard(ask.bookingId) : driverTripCard(tripId);
    await send([{ bot: rater, chatId: ask.raterId, text, markup, replyCard: card }]);
  };
