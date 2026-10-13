import type { BrandChannel, BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import type { BotName } from '../../../shared/telegram/bot-config';
import type { Look } from '../domain/look';

const { t } = createI18n(DEFAULT_LOCALE);

// The looks of the repository (docs/180): the texts from packages/i18n with the name of the
// environment, the pictures from the site of the environment (brands/<brand>/landing).

// The name, the text of an empty chat, the profile line and the picture of a bot (G16, G34).
export function botLook(brand: BrandConfig, bot: BotName, site: string): Look {
  const text = (part: 'name' | 'description' | 'short') =>
    t(`bot.profile.${bot}.${part}` as TranslationKey, { brand: brand.name, slogan: brand.slogan });
  return {
    name: text('name'),
    description: text('description'),
    short: text('short'),
    avatar: `${site}/bot/${bot}-avatar.jpg`,
  };
}

// The bot of the channels: only the team sees it, as the admin of the channels (docs/176).
export const posterLook = (brand: BrandConfig): Look => ({
  name: t('bot.profile.poster.name', { brand: brand.name }),
});

// The public main channel of the environment: a guide to every channel of the directions.
export const mainLook = (brand: BrandConfig, site: string): Look => ({
  name: t('bot.look.mainName', { brand: brand.name }),
  description: t('bot.look.mainDescription', { brand: brand.name, bot: brand.bots.passenger }),
  avatar: `${site}/channel/main-avatar.jpg`,
});

// A channel of a direction: the name it has in channels.json and the avatar of its region (docs/176).
export const directionLook = (brand: BrandConfig, channel: BrandChannel, site: string): Look => ({
  name: channel.name,
  description: t('bot.look.directionDescription', { title: channel.title, bot: brand.bots.passenger }),
  avatar: `${site}/channel/${channel.code}-avatar.jpg`,
});
