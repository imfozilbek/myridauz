import { appHost, type BrandConfig } from '@platform/brands';
import { formatPlate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { callTelegram, sendAlbum, type Fetch } from '../../../shared/telegram/telegram-api';
import type { Application } from '../domain/application';
import type { ModerationNotifier, PeoplePort } from '../application/ports';
import type { ImageStore } from '../../../shared/storage/image-store';
import { cardMenu, cardText, reasonList } from './moderation-card';

const { t } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly fetch: Fetch;
  readonly brand: BrandConfig;
  readonly adminToken: string | undefined;
  readonly driverToken: string | undefined;
  readonly teamIds: () => Promise<number[]>;
  readonly photos: ImageStore;
  readonly people: PeoplePort;
};

const RESULT_TEXT = {
  approved: 'bot.driver.approved',
  rejected: 'bot.driver.rejected',
  changes_requested: 'bot.driver.changesRequested',
} as const;

// A person may have never opened a bot: one failed message must not stop the others.
const quietly = (work: Promise<unknown>) => work.catch((error: unknown) => console.warn(String(error)));

export function telegramNotifier(wiring: Wiring): ModerationNotifier {
  const { fetch, brand, adminToken, driverToken } = wiring;
  return {
    submitted: async (application: Application, person) => {
      if (!adminToken) return;
      const keys = [
        person.avatarKey,
        application.photos.front,
        application.photos.side,
        application.photos.interior,
      ];
      const loaded = await Promise.all(
        keys.map((key, index) =>
          key === null ? undefined : index === 0 ? wiring.people.avatar(key) : wiring.photos.get(key),
        ),
      );
      const photos = loaded.filter((photo) => photo !== undefined);
      const card = {
        text: cardText(application, person.firstName),
        reply_markup: cardMenu(application.userId),
      };
      for (const chatId of await wiring.teamIds()) {
        // An album needs at least two photos; an application always has four (face and car).
        const album = photos.length >= 2 ? sendAlbum(fetch, adminToken, chatId, photos) : Promise.resolve();
        await quietly(
          album.then(() => callTelegram(fetch, adminToken, 'sendMessage', { chat_id: chatId, ...card })),
        );
      }
    },
    decided: async (application, fixedPlate) => {
      if (!driverToken || application.status === 'draft' || application.status === 'pending') return;
      // One reason per line: the driver finds each one marked in the Mini App.
      const reasons = reasonList(application.reasons, '\n').replace(/^/gm, '• ');
      const open = { text: t('bot.open'), web_app: { url: `https://${appHost(brand, 'driver')}` } };
      await quietly(
        callTelegram(fetch, driverToken, 'sendMessage', {
          chat_id: application.userId,
          text: [
            t(RESULT_TEXT[application.status], { reasons }),
            ...(fixedPlate ? [t('bot.driver.plateFixed', { plate: formatPlate(fixedPlate) })] : []),
          ].join('\n\n'),
          reply_markup: { inline_keyboard: [[open]] },
        }),
      );
    },
  };
}
