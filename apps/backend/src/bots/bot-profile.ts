import type { BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import type { BotRole } from './bot-roles';

const { t } = createI18n(DEFAULT_LOCALE);

// What Telegram shows before the first message: the name, the text of an empty chat
// (description) and the line of the profile (short description). G16, docs/46.
export function botProfile(brand: BrandConfig, role: BotRole) {
  const text = (part: 'name' | 'description' | 'short') =>
    t(`bot.profile.${role}.${part}` as TranslationKey, { brand: brand.name, slogan: brand.slogan });
  return { name: text('name'), description: text('description'), short_description: text('short') };
}
