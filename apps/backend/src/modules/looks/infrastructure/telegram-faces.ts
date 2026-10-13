import { telegramUrl } from '../../../shared/telegram/api-url';
import { askTelegram, type Fetch } from '../../../shared/telegram/telegram-api';
import type { Face } from '../application/looks';
import type { Look, TextPart } from '../domain/look';

// The calls of one check at most (docs/117): a bot reads 4 parts and the picture, sets 3 texts, the
// photo and reads it; a channel reads the chat and the picture, sets 2 texts, the photo and reads it.
const BOT_COST = 10;
const CHANNEL_COST = 6;
const PICTURE = 'picture';

// A picture goes to Telegram as an uploaded file: nobody uploads it by hand in BotFather (G34).
async function upload(
  call: Fetch,
  token: string,
  method: string,
  fields: object,
  file: string,
  picture: ArrayBuffer,
) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  form.append(file, new Blob([picture], { type: 'image/jpeg' }), 'avatar.jpg');
  const response = await call(telegramUrl(token, method), { method: 'POST', body: form });
  if (!response.ok) throw new Error(`telegram.${method}_${response.status}`);
}

const BOT_TEXTS: Readonly<Record<TextPart, readonly [method: string, field: string]>> = {
  name: ['setMyName', 'name'],
  description: ['setMyDescription', 'description'],
  short: ['setMyShortDescription', 'short_description'],
};
type BotText = { readonly name?: string; readonly description?: string; readonly short_description?: string };
type Photos = { readonly photos?: readonly (readonly { readonly file_unique_id?: string }[])[] };

// A bot of the environment. The token never leaves these calls; its first part is the bot id.
export function botFace(call: Fetch, token: string, key: string, look: Look): Face {
  const ask = <T>(method: string, params?: object) => askTelegram<T>(call, token, method, params);
  const photoOf = async () =>
    (
      await ask<Photos>('getUserProfilePhotos', { user_id: Number(token.split(':')[0]), limit: 1 })
    )?.photos?.[0]?.at(-1)?.file_unique_id ?? null;
  return {
    key,
    look,
    cost: BOT_COST,
    adopt: false,
    read: async () => {
      const [name, description, short, photo] = await Promise.all([
        ask<BotText>('getMyName'),
        ask<BotText>('getMyDescription'),
        ask<BotText>('getMyShortDescription'),
        photoOf(),
      ]);
      return {
        name: name?.name ?? null,
        description: description?.description ?? null,
        short: short?.short_description ?? null,
        photo,
      };
    },
    write: async (part, text) => {
      const [method, field] = BOT_TEXTS[part];
      await ask(method, { [field]: text });
    },
    photo: async (picture) => {
      const photo = JSON.stringify({ type: 'static', photo: `attach://${PICTURE}` });
      await upload(call, token, 'setMyProfilePhoto', { photo }, PICTURE, picture);
      return photoOf();
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
    adopt: true,
    read: async () => {
      const seen = await chatOf();
      const photo = seen?.photo?.big_file_unique_id ?? null;
      return { name: seen?.title ?? null, description: seen?.description ?? null, short: null, photo };
    },
    write: async (part, text) => {
      if (part === 'name') await ask('setChatTitle', { chat_id: chat, title: text });
      else await ask('setChatDescription', { chat_id: chat, description: text });
    },
    photo: async (picture) => {
      await upload(call, token, 'setChatPhoto', { chat_id: chat }, 'photo', picture);
      return (await chatOf())?.photo?.big_file_unique_id ?? null;
    },
  };
}
