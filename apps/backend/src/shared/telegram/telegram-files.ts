import { telegramFileUrl, telegramUrl } from './api-url';
import { sendFlags, type Fetch, type SendOptions } from './telegram-api';

// The bytes of a file a bot received. A file id works only in its own bot, so a voice message
// goes from one bot to another as bytes (docs/50).
export async function downloadFile(fetch: Fetch, token: string, fileId: string): Promise<ArrayBuffer> {
  const response = await fetch(telegramUrl(token, 'getFile'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file_id: fileId }),
  });
  if (!response.ok) throw new Error(`telegram.getFile_${response.status}`);
  const body = (await response.json()) as { result?: { file_path?: string } };
  const path = body.result?.file_path;
  if (!path) throw new Error('telegram.getFile_no_path');
  const file = await fetch(telegramFileUrl(token, path));
  if (!file.ok) throw new Error(`telegram.file_${file.status}`);
  return file.arrayBuffer();
}

// A voice message or a photo between the bots (docs/50): the same upload, another method.
export type Media = { readonly kind: 'voice' | 'photo'; readonly data: ArrayBuffer };
const UPLOAD = {
  voice: { method: 'sendVoice', type: 'audio/ogg', name: 'voice.ogg' },
  photo: { method: 'sendPhoto', type: 'image/jpeg', name: 'photo.jpg' },
} as const;

// sendVoice or sendPhoto with an uploaded file; returns the id of the message, like sendText.
export async function sendMedia(
  fetch: Fetch,
  token: string,
  chatId: number,
  media: Media,
  caption: string,
  markup?: object,
  options?: SendOptions,
): Promise<number | undefined> {
  const { method, type, name } = UPLOAD[media.kind];
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption);
  if (markup) form.append('reply_markup', JSON.stringify(markup));
  for (const [key, value] of Object.entries(sendFlags(options))) form.append(key, String(value));
  form.append(media.kind, new Blob([media.data], { type }), name);
  const response = await fetch(telegramUrl(token, method), { method: 'POST', body: form });
  if (!response.ok) throw new Error(`telegram.${method}_${response.status}`);
  const body = (await response.json()) as { result?: { message_id?: number } };
  return body.result?.message_id;
}
