import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t } = createI18n(DEFAULT_LOCALE);
type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

// Telegram keeps the card, and the Mini App opens its own "send to a chat" window (shareMessage,
// docs/21, docs/43). When Telegram says no, the Mini App falls back to a plain share link.
export async function prepareCard(
  fetch: Fetch,
  token: string | undefined,
  userId: number,
  text: string,
  link: string,
): Promise<string | null> {
  if (!token) return null;
  const result = {
    type: 'article',
    id: crypto.randomUUID(),
    title: t('bot.share.title'),
    input_message_content: { message_text: text },
    reply_markup: { inline_keyboard: [[{ text: t('bot.share.follow'), url: link }]] },
  };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/savePreparedInlineMessage`, {
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
