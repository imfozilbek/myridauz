import type { BrandConfig } from '@platform/brands';
import { telegramUrl } from '../shared/telegram/api-url';
import type { Fetch } from '../shared/telegram/telegram-api';
import type { BotName } from '../shared/telegram/bot-config';

const AVATAR_PART = 'avatar';

// The picture of a bot: brand-kit/landing/bot.mjs draws it, the landing serves it (G34).
export const avatarUrl = (brand: BrandConfig, bot: BotName) =>
  `https://${brand.domain}/bot/${bot}-avatar.jpg`;

// setMyProfilePhoto takes the picture as an uploaded file (InputProfilePhotoStatic): the Worker
// fetches it from the landing and sends its bytes, so nobody uploads it by hand in BotFather.
export async function setBotAvatar(fetch: Fetch, token: string, url: string): Promise<void> {
  const picture = await fetch(url);
  if (!picture.ok) throw new Error(`avatar_${picture.status}`);
  const form = new FormData();
  form.append('photo', JSON.stringify({ type: 'static', photo: `attach://${AVATAR_PART}` }));
  form.append(AVATAR_PART, new Blob([await picture.arrayBuffer()], { type: 'image/jpeg' }), 'avatar.jpg');
  const response = await fetch(telegramUrl(token, 'setMyProfilePhoto'), { method: 'POST', body: form });
  if (!response.ok) throw new Error(`telegram.setMyProfilePhoto_${response.status}`);
}
