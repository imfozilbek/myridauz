import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { pickupFromBot } from '../modules/bookings';
import { sendMessage, type BotContext } from './bot-context';
import type { BotMessage } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

// The passenger bot takes a location only as an answer to a confirmation: then it is clear which
// booking. The driver sees it as the passenger's own pickup point (docs/14).
export async function onPassengerMessage(context: BotContext, message: BotMessage) {
  const { location, reply_to_message: replyTo, from } = message;
  if (!location || !from || !replyTo) return {};
  const saved = await pickupFromBot(context.env, from.id, replyTo.message_id, location.latitude, location.longitude);
  return saved ? sendMessage(message.chat.id, t('bot.booking.pickupSaved')) : {};
}
