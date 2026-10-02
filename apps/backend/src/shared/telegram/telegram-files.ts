import { telegramFileUrl, telegramUrl } from './api-url';
import type { Fetch } from './telegram-api';

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

// sendVoice with an uploaded voice; returns the id of the message, like sendText.
export async function sendVoice(
  fetch: Fetch,
  token: string,
  chatId: number,
  voice: ArrayBuffer,
  caption: string,
  markup?: object,
): Promise<number | undefined> {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption);
  if (markup) form.append('reply_markup', JSON.stringify(markup));
  form.append('voice', new Blob([voice], { type: 'audio/ogg' }), 'voice.ogg');
  const response = await fetch(telegramUrl(token, 'sendVoice'), { method: 'POST', body: form });
  if (!response.ok) throw new Error(`telegram.sendVoice_${response.status}`);
  const body = (await response.json()) as { result?: { message_id?: number } };
  return body.result?.message_id;
}
