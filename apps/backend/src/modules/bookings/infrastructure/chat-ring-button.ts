import type { BrandConfig } from '@platform/brands';
import { CHAT_LINK, SHEET_LINK, type Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { appButton } from '../../../shared/telegram/open-button';

const { t } = createI18n(DEFAULT_LOCALE);

// A message or a call in the chat of a seat, under its trip card (G68, docs/122 rule 5).
export type ChatRing = 'message' | 'call' | 'missed';
const BUTTONS = { message: 'bot.chat.open', call: 'bot.call.answer', missed: 'bot.chat.open' } as const;
export const isChatRing = (ring: string | undefined): ring is ChatRing =>
  ring !== undefined && ring in BUTTONS;

// The ring of a chat opens the Mini App of its bot: a message with its sheet and ready answers
// (G68, docs/122), a call right in the chat; the other rings have no button.
export function chatRingButton(
  brand: BrandConfig,
  role: 'passenger' | 'driver',
  booking: Booking,
  ring: string | undefined,
): { markup?: object } {
  if (!isChatRing(ring)) return {};
  const link = { name: ring === 'message' ? SHEET_LINK : CHAT_LINK, id: booking.chatKey };
  const open = appButton(brand, role, t(BUTTONS[ring]), link);
  return { markup: { inline_keyboard: [[open]] } };
}
