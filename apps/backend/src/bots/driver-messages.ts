import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { meetingPointFromBot } from '../modules/trips';
import { sendMessage, type BotContext } from './bot-context';
import type { BotMessage } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

// The driver bot takes a location only as an answer to a trip message: then it is clear which trip.
export async function onDriverMessage(context: BotContext, message: BotMessage) {
  const { location, reply_to_message: replyTo, from } = message;
  if (!location || !from) return {};
  const saved = replyTo
    ? await meetingPointFromBot(
        context.env,
        from.id,
        replyTo.message_id,
        location.latitude,
        location.longitude,
      )
    : 'not_found';
  return sendMessage(
    message.chat.id,
    t(saved === 'saved' ? 'bot.trip.meetingSaved' : 'bot.trip.meetingHint'),
  );
}
