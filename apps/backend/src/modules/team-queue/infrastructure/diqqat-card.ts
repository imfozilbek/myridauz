import { appHost, type BrandConfig } from '@platform/brands';
import { OPEN_LINK, type AttentionSign } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { News } from '../../notifications';
import { bold, italic } from '../../../shared/telegram/html';

const { t } = createI18n(DEFAULT_LOCALE);

// One sign for the owner (docs/120, docs/122): errors went up, a case waited over 30 minutes, a
// contact attempt in a chat, a low rating, a driver low on money. The same id edits its line; the
// sign is the same line with its data for the admin app (G75).
export type Signal = {
  readonly id: string;
  readonly text: string;
  readonly ring: boolean;
  readonly sign: AttentionSign;
};

const DIQQAT_ROUTE = 'diqqat';
// «Odamlar»: the section of the team and the people in the admin app (G53).
const PEOPLE_SECTION = 'management';

// «Diqqat» of the owner (mockup g68/4): one quiet card a day, its lines the signs of the day; only
// errors and a late case ring under it.
export function diqqatNews(brand: BrandConfig, ownerId: number, signal: Signal, now: number): News {
  const app = `https://${appHost(brand, 'admin')}/`;
  return {
    bot: 'admin',
    chatId: ownerId,
    route: DIQQAT_ROUTE,
    head: [bold(t('bot.diqqat.title'))],
    foot: italic(t('bot.diqqat.hint')),
    line: { id: signal.id, text: signal.text, order: now },
    markup: {
      inline_keyboard: [
        [
          { text: t('bot.diqqat.stats'), web_app: { url: `${app}?stats=day` } },
          { text: t('bot.diqqat.people'), web_app: { url: `${app}?${OPEN_LINK}=${PEOPLE_SECTION}` } },
        ],
      ],
    },
    quiet: true,
  };
}
