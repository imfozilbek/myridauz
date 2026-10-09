import { telegramUrl } from './api-url';
export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

// A Bot API call. Errors carry the Telegram method and code, never the token (docs/32).
export async function callTelegram(
  fetch: Fetch,
  token: string,
  method: string,
  params: object,
): Promise<void> {
  const response = await fetch(telegramUrl(token, method), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`telegram.${method}_${response.status}`);
}

type Photo = { readonly body: ReadableStream | ArrayBuffer; readonly type: string };

// Private photos go to Telegram as uploaded files: there is no public link to give (docs/05).
// One private photo with a caption and buttons: the card of a new face for the team (G51).
export async function sendPhoto(
  fetch: Fetch,
  token: string,
  chatId: number,
  photo: Photo,
  card: { readonly caption: string; readonly markup: object },
): Promise<void> {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append(
    'photo',
    new Blob([await new Response(photo.body).arrayBuffer()], { type: photo.type }),
    'photo',
  );
  form.append('caption', card.caption);
  form.append('reply_markup', JSON.stringify(card.markup));
  const response = await fetch(telegramUrl(token, 'sendPhoto'), { method: 'POST', body: form });
  if (!response.ok) throw new Error(`telegram.sendPhoto_${response.status}`);
}

// A message in HTML (the card of a question, G68) and without sound at night (docs/122).
export type SendOptions = { readonly html?: boolean; readonly quiet?: boolean };
export const sendFlags = (options: SendOptions = {}) => ({
  ...(options.html ? { parse_mode: 'HTML' } : {}),
  ...(options.quiet ? { disable_notification: true } : {}),
});

// sendMessage that returns the id of the message: support links a copy to the person (docs/02).
export async function sendText(
  fetch: Fetch,
  token: string,
  chatId: number,
  text: string,
  markup?: object,
  options?: SendOptions,
): Promise<number | undefined> {
  const params = {
    chat_id: chatId,
    text,
    ...(markup ? { reply_markup: markup } : {}),
    ...sendFlags(options),
  };
  const response = await fetch(telegramUrl(token, 'sendMessage'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`telegram.sendMessage_${response.status}`);
  const body = (await response.json()) as { result?: { message_id?: number } };
  return body.result?.message_id;
}
