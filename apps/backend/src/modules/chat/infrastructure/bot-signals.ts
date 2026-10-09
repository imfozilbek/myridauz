import { appHost, loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../../env';
import { sendEvent } from '../../feed';
import { notify, notifyTeam } from '../../notifications';
import { peopleOf } from '../../users';
import type { Addressee, ChatSignals, Role } from '../application/ports';

const { t } = createI18n(DEFAULT_LOCALE);
// The Mini App opens this chat at once (docs/07).
const CHAT_PARAM = 'chat';

// The passenger hears from the passenger bot, the driver from the driver bot (docs/07).
type To = { readonly userId: number; readonly role: Role };
// A message of the bot of this person with one button that opens the chat.
const toChat = async (env: Bindings, to: To, key: string, text: string, button: string) => {
  const url = `https://${appHost(loadBrand(env.BRAND), to.role)}/?${CHAT_PARAM}=${key}`;
  const markup = { inline_keyboard: [[{ text: button, web_app: { url } }]] };
  await notify(env, [{ bot: to.role, chatId: to.userId, text, markup }]);
};

// A message or a call about a seat answers its trip card (G68, docs/122 rule 5); the bookings module
// knows the card, module-events.ts wires it. False: no seat (a talk about a request), the bot tells
// as before.
export type ChatNews = {
  readonly to: Addressee;
  readonly key: string;
  readonly kind: 'message' | 'call' | 'missed' | 'read';
};
type SeatRing = (env: Bindings, news: ChatNews) => Promise<boolean>;
let ringUnderSeat: SeatRing = async () => false;
export const wireChatRings = (next: SeatRing) => void (ringUnderSeat = next);

const ringOr = async (env: Bindings, news: ChatNews, text: string, button: string) => {
  if (!(await ringUnderSeat(env, news))) await toChat(env, news.to, news.key, text, button);
};

export const botSignals = (env: Bindings): ChatSignals => ({
  newMessage: (to, key) =>
    ringOr(env, { to, key, kind: 'message' }, t('bot.chat.newMessage'), t('bot.chat.open')),
  // The open or folded Mini App opens the chat and rings by itself (docs/115).
  openCall: (to, key) => sendEvent(env, { userId: to.userId, app: to.role }, { type: 'call', chat: key }),
  // A call cannot ring a closed Mini App: the bot calls the person in (docs/08).
  incomingCall: (to, key) =>
    ringOr(env, { to, key, kind: 'call' }, t('bot.call.incoming'), t('bot.call.answer')),
  missedCall: (to, key) => ringOr(env, { to, key, kind: 'missed' }, t('bot.call.missed'), t('bot.chat.open')),
  read: async (to, key) => void (await ringUnderSeat(env, { to, key, kind: 'read' })),
  contactAttempts: async (userId, key, count) => {
    const person = await peopleOf(env).find(userId);
    // The team sees the public id, never the Telegram ID (docs/65 A3).
    const values = { name: person?.firstName ?? '', id: person?.publicId ?? '', count: String(count), key };
    await notifyTeam(env, t('bot.chat.contactAttempts', values));
  },
});
