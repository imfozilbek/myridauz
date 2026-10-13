import type { Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { BOT_NAMES, botToken } from '../../shared/telegram/bot-config';
import type { Fetch } from '../../shared/telegram/telegram-api';
import type { Face, LooksDeps } from './application/looks';
import { createMemoryLooks, d1Looks } from './infrastructure/d1-looks';
import { botFace, channelFace } from './infrastructure/telegram-faces';
import { botLook, directionLook, mainLook, posterLook } from './infrastructure/wanted';

const localLooks = createMemoryLooks();

// Every bot and channel of the environment with its look (docs/180). The channels go through the
// bot of the channels: without its token they wait.
function facesOf(env: Bindings, call: Fetch): Face[] {
  const brand = brandOf(env);
  const site = env.SITE_URL ?? `https://${brand.domain}`;
  const bots = BOT_NAMES.flatMap((bot) => {
    const token = botToken(env, bot);
    return token ? [botFace(call, token, `bot:${bot}`, botLook(brand, bot, site))] : [];
  });
  const poster = env.POSTER_BOT_TOKEN;
  if (!poster) return bots;
  return [
    ...bots,
    botFace(call, poster, 'bot:poster', posterLook(brand)),
    channelFace(call, poster, `@${brand.mainChannel}`, mainLook(brand, site)),
    ...brand.channels.map((channel) =>
      channelFace(call, poster, channel.chat, directionLook(brand, channel, site)),
    ),
  ];
}

// The file of a picture; its hash tells a new file of the repository from the old one.
async function pictureOf(call: Fetch, url: string): Promise<ArrayBuffer> {
  const response = await call(url);
  if (!response.ok) throw new Error(`picture_${response.status}`);
  return response.arrayBuffer();
}

const hashOf = async (bytes: ArrayBuffer) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

export function looksDeps(env: Bindings, call: Fetch): LooksDeps {
  return {
    faces: facesOf(env, call),
    store: env.DB ? d1Looks(env.DB) : localLooks,
    picture: (url) => pictureOf(call, url),
    hash: hashOf,
    now: () => Date.now(),
  };
}
