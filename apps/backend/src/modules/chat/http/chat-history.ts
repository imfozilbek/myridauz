import type { Bindings } from '../../../env';
import { SYSTEM_AUTHOR, type StoredMessage } from '../application/ports';

// The last messages of a chat for a moderator: only through a complaint, which logs the read
// (docs/07, docs/17). The texts are the masked ones: the originals are never kept.
// author: the Telegram ID, null for the system; the complaints module shows public ids (docs/65 A3).
export type HistoryLine = { readonly author: number | null; readonly text: string; readonly at: number };

export async function chatHistory(env: Bindings, key: string): Promise<HistoryLine[]> {
  const chats = env.CHATS;
  if (!chats) return [];
  const response = await chats
    .get(chats.idFromName(key))
    .fetch(new Request('https://chat/history', { headers: { 'x-chat-key': key } }));
  const messages = (await response.json()) as StoredMessage[];
  return messages.map((message) => ({
    author: message.author === SYSTEM_AUTHOR ? null : message.author,
    text: message.event ?? message.text,
    at: message.at,
  }));
}
