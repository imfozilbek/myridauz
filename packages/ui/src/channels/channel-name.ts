import type { BrandConfig } from '@platform/brands';

type Named = { readonly chat: string; readonly title: string };

// The separator of the places in a name in Telegram: «Rida | Boʻka | Bekobod».
const SEPARATOR = ' | ';
// A long name goes on several lines (docs/121): a separator ends a line, it never opens one.
const KEPT_SEPARATOR = '\u00a0| ';

// A name in the apps (owner decisions 13.10.2026, docs/176): the name in Telegram without the brand
// in front, the app is the brand already.
export const shownName = (brand: Pick<BrandConfig, 'name'>, name: string) => {
  const prefix = `${brand.name}${SEPARATOR}`;
  return (name.startsWith(prefix) ? name.slice(prefix.length) : name).replaceAll(SEPARATOR, KEPT_SEPARATOR);
};

// A channel of the brand by its name copied from Telegram, a channel of the team by the title the
// team gave it in the admin.
export const channelName = (brand: Pick<BrandConfig, 'name' | 'channels'>, channel: Named) =>
  shownName(brand, brand.channels.find((own) => own.chat === channel.chat)?.name ?? channel.title);
