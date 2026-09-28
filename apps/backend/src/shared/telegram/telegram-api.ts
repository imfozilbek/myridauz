export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

// A Bot API call. Errors carry the Telegram method and code, never the token (docs/32).
export async function callTelegram(
  fetch: Fetch,
  token: string,
  method: string,
  params: object,
): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`telegram.${method}_${response.status}`);
}

type Photo = { readonly body: ReadableStream | ArrayBuffer; readonly type: string };

// Private photos go to Telegram as uploaded files: there is no public link to give (docs/05).
export async function sendAlbum(
  fetch: Fetch,
  token: string,
  chatId: number,
  photos: readonly Photo[],
): Promise<void> {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  const media = await Promise.all(
    photos.map(async (photo, index) => {
      const name = `photo${index}`;
      form.append(name, new Blob([await new Response(photo.body).arrayBuffer()], { type: photo.type }), name);
      return { type: 'photo', media: `attach://${name}` };
    }),
  );
  form.append('media', JSON.stringify(media));
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new Error(`telegram.sendMediaGroup_${response.status}`);
}

// sendMessage that returns the id of the message: support links a copy to the person (docs/02).
export async function sendText(
  fetch: Fetch,
  token: string,
  chatId: number,
  text: string,
  markup?: object,
): Promise<number | undefined> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...(markup ? { reply_markup: markup } : {}) }),
  });
  if (!response.ok) throw new Error(`telegram.sendMessage_${response.status}`);
  const body = (await response.json()) as { result?: { message_id?: number } };
  return body.result?.message_id;
}
