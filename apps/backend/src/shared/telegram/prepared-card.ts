import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { telegramUrl } from './api-url';

const { t } = createI18n(DEFAULT_LOCALE);
type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

// The title of the card and the words of its button: a shared trip by default (docs/43). The card
// «Yaqinlarimga» has a second button under the first: «Men ham yoʻlga chiqaman» (G69, docs/123).
type Button = { readonly text: string; readonly url: string };
type Words = { readonly title: string; readonly button: string; readonly second?: Button };

// Telegram keeps the card, and the Mini App opens its own "send to a chat" window (shareMessage,
// docs/21, docs/43). When Telegram says no, the Mini App falls back to a plain share link.
export async function prepareCard(
  fetch: Fetch,
  token: string | undefined,
  userId: number,
  text: string,
  link: string,
  words: Words = { title: t('bot.share.title'), button: t('bot.share.follow') },
): Promise<string | null> {
  if (!token) return null;
  const result = {
    type: 'article',
    id: crypto.randomUUID(),
    title: words.title,
    input_message_content: { message_text: text },
    reply_markup: {
      inline_keyboard: [[{ text: words.button, url: link }], ...(words.second ? [[words.second]] : [])],
    },
  };
  try {
    const response = await fetch(telegramUrl(token, 'savePreparedInlineMessage'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        result,
        allow_user_chats: true,
        allow_group_chats: true,
      }),
    });
    const body = (await response.json()) as { result?: { id?: string } };
    return response.ok ? (body.result?.id ?? null) : null;
  } catch {
    return null;
  }
}
