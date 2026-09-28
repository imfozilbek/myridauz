import type { BrandConfig } from '@platform/brands';
import type { Bindings } from '../env';
import type { Fetch } from '../shared/telegram/telegram-api';

// What a bot handler needs: the brand, the bindings and a way to call Telegram.
export type BotContext = { readonly env: Bindings; readonly brand: BrandConfig; readonly fetch: Fetch };

export const sendMessage = (chatId: number, text: string, markup?: object) => ({
  method: 'sendMessage',
  chat_id: chatId,
  text,
  ...(markup ? { reply_markup: markup } : {}),
});
