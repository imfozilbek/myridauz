import type { Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import type { Fetch } from '../../shared/telegram/telegram-api';
import type { Face, LooksDeps } from './application/looks';
import { createMemoryLooks, d1Looks } from './infrastructure/d1-looks';
import { channelFace, posterFace } from './infrastructure/telegram-faces';
import { directionLook, mainLook, posterLook } from './infrastructure/wanted';

const localLooks = createMemoryLooks();

// The channels of the environment and their bot with their looks (docs/180), once the owner has said
// yes to their texts (CHANNEL_LOOKS, G84). Without the bot of the channels they wait.
function facesOf(env: Bindings, call: Fetch): Face[] {
  const poster = env.POSTER_BOT_TOKEN;
  if (env.CHANNEL_LOOKS !== 'on' || !poster) return [];
  const brand = brandOf(env);
  const site = env.SITE_URL ?? `https://${brand.domain}`;
  return [
    posterFace(call, poster, posterLook(brand)),
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
