import type { ChatClient } from '@platform/api-client';
import type { ChatAbout, UnreadChat } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';

// Who is in a chat changes seldom: one question per chat while the app is open.
const known = new Map<string, Promise<ChatAbout>>();
const aboutOf = (chat: ChatClient, key: string) => {
  const asked = known.get(key) ?? chat.about(key);
  known.set(key, asked);
  return asked;
};

export type Unread = UnreadChat & { readonly about: ChatAbout };
const NONE: readonly Unread[] = [];

// The unread chats of this Mini App with who is in them (G68, G76): the sheet «Yangi xabar», the
// number on «Suhbatlar» and the dot on the chat of the block read the same list; a signal refreshes it.
export function useUnreadLoad() {
  const { chat } = useApiClients();
  return useLoad<readonly Unread[]>(async () => {
    const chats = await chat.unread();
    const abouts = await Promise.all(chats.map((one) => aboutOf(chat, one.key)));
    return chats.map((one, index) => ({ ...one, about: abouts[index] as ChatAbout }));
  }, 'chats.unread');
}

export const useUnreadChats = (): readonly Unread[] => useUnreadLoad().value ?? NONE;
