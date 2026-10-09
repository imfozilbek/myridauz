import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import { answerFromBot, ASK_PREFIX } from '../modules/bookings';
import { isBlocked } from '../modules/users';
import { answerQuery as answer, type BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

const ANSWERS = { yes: true, no: false } as const;
// Why a press did nothing, as a short notice over the chat.
const REFUSALS: Partial<Record<string, TranslationKey>> = {
  'wallet.not_enough': 'bot.ask.noMoney',
  'bookings.no_seats': 'bot.ask.noSeats',
  'bookings.wrong_status': 'bot.ask.changed',
};

export const isAskButton = (data: string | undefined) => data?.split(':')[0] === ASK_PREFIX;

// «ask:<booking>:yes» and «ask:<booking>:no» under a request card (G68, docs/122): the driver
// answers in the bot. Only the driver of the trip can: the use case checks it.
export async function onAskCallback(context: BotContext, query: BotCallback) {
  const [, bookingId, value] = (query.data ?? '').split(':');
  if (!bookingId || (value !== 'yes' && value !== 'no')) return answer(query);
  if (await isBlocked(context.env, query.from.id)) return answer(query);
  const result = await answerFromBot(context.env, query.from.id, bookingId, ANSWERS[value]);
  const refusal = result === 'ok' ? undefined : REFUSALS[result];
  return answer(query, refusal && t(refusal));
}
