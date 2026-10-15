import { telegramUrl } from '../../../shared/telegram/api-url';
import { askTelegram, type Fetch } from '../../../shared/telegram/telegram-api';
import type { Face } from '../application/looks';
import type { Look } from '../domain/look';

// The calls of one check at most (docs/117): the bot of the channels reads and sets its name; a channel
// reads the chat and the picture, sets 2 texts, the photo and reads it.
const POSTER_COST = 2;
const CHANNEL_COST = 6;

// The bot of the channels: only its name, the team sees it as the admin of the channels (docs/176).
// The bots of people get their looks from the setup of G83 (configure-bots.ts).
export function posterFace(call: Fetch, token: string, look: Look): Face {
  return {
    key: 'bot:poster',
    look,
    cost: POSTER_COST,
    read: async () => {
      const seen = await askTelegram<{ readonly name?: string }>(call, token, 'getMyName');
      return { name: seen?.name ?? null, description: null, photo: null };
    },
    // Its look has only the name, so only the name is ever set.
    write: async (_part, name) => {
      await askTelegram(call, token, 'setMyName', { name });
    },
  };
}

type Chat = {
  readonly title?: string;
  readonly description?: string;
  readonly photo?: { readonly big_file_unique_id?: string };
};

// A channel, through the bot of the channels: it needs the right «Change channel info» (docs/180).
export function channelFace(call: Fetch, token: string, chat: string, look: Look): Face {
  const ask = <T>(method: string, params: object) => askTelegram<T>(call, token, method, params);
  const chatOf = () => ask<Chat>('getChat', { chat_id: chat });
  return {
    key: `channel:${chat}`,
    look,
    cost: CHANNEL_COST,
    read: async () => {
      const seen = await chatOf();
      const photo = seen?.photo?.big_file_unique_id ?? null;
      return { name: seen?.title ?? null, description: seen?.description ?? null, photo };
    },
    write: async (part, text) => {
      if (part === 'name') await ask('setChatTitle', { chat_id: chat, title: text });
      else await ask('setChatDescription', { chat_id: chat, description: text });
    },
    // The picture goes to Telegram as an uploaded file: nobody uploads it by hand.
    photo: async (picture) => {
      const form = new FormData();
      form.append('chat_id', chat);
      form.append('photo', new Blob([picture], { type: 'image/jpeg' }), 'avatar.jpg');
      const response = await call(telegramUrl(token, 'setChatPhoto'), { method: 'POST', body: form });
      if (!response.ok) throw new Error(`telegram.setChatPhoto_${response.status}`);
      return (await chatOf())?.photo?.big_file_unique_id ?? null;
    },
  };
}
