import type { BrandConfig } from '@platform/brands';
import type { Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { appButton } from '../../../shared/telegram/open-button';

const { t } = createI18n(DEFAULT_LOCALE);

// A message or a call in the chat of a seat, under its trip card (G68, docs/122 rule 5).
export type ChatRing = 'message' | 'call' | 'missed';
const BUTTONS = { message: 'bot.chat.open', call: 'bot.call.answer', missed: 'bot.chat.open' } as const;
export const isChatRing = (ring: string | undefined): ring is ChatRing => ring !== undefined && ring in BUTTONS;

// The ring of a chat opens that chat in the Mini App of its bot; the other rings have no button.
export function chatRingButton(
  brand: BrandConfig,
  role: 'passenger' | 'driver',
  booking: Booking,
  ring: string | undefined,
): { markup?: object } {
  if (!isChatRing(ring)) return {};
  const open = appButton(brand, role, t(BUTTONS[ring]), { name: 'chat', id: booking.chatKey });
  return { markup: { inline_keyboard: [[open]] } };
}
