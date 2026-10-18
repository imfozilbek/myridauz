import { type BrandConfig } from '@platform/brands';
import { PROFILE_PHOTO_LINK } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import type { QueueNews } from '../../team-queue';
import type { ImageStore } from '../../../shared/storage/image-store';
import { escapeHtml } from '../../../shared/telegram/html';
import { openButton } from '../../../shared/telegram/open-button';
import { profileLink } from '../../../shared/telegram/profile-link';
import { sendPhoto, type Fetch } from '../../../shared/telegram/telegram-api';
import type { FaceNotifier, TelegramSeen } from '../application/ports';
import type { User } from '../domain/user';
import { faceCardText, faceMenu } from './face-card';

const { t } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly fetch: Fetch;
  readonly brand: BrandConfig;
  readonly adminToken: string | undefined;
  // Who of the team gets the card: the member who gets the person's application that day (docs/92).
  readonly recipients: (userId: number) => Promise<number[]>;
  readonly avatars: ImageStore;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  // «Navbat» of the team (G68, docs/122): a new photo is a case.
  readonly queue: (news?: QueueNews) => Promise<void>;
  // The Telegram account: the team sees who it is (owner, 17.10.2026).
  readonly seenOf: (userId: number) => Promise<TelegramSeen | null>;
};

// The card: the name, what to check, and the Telegram account with the link to its profile. The
// admin bot does not know the person: the link goes through the bot that does (owner, 18.10.2026).
async function cardCaption(wiring: Wiring, user: User) {
  const seen = await wiring.seenOf(user.id);
  const username = seen?.username;
  const who = username ? t('bot.face.telegram', { username }) : t('bot.face.telegramNone');
  const link = profileLink(wiring.brand, seen?.bot ?? 'passenger', user.publicId);
  const profile = `<a href="${link}">${escapeHtml(t('bot.person.open'))}</a>`;
  return `${escapeHtml(faceCardText(user.firstName))}\n${escapeHtml(who)} · ${profile}`;
}

// A new face goes to the team as a photo with «Rasm mos» and «Mos emas» (docs/120); a photo that
// does not fit is told to the person in the bot of their role, with a button to put a new one (docs/118).
export function telegramFaces(wiring: Wiring): FaceNotifier {
  return {
    uploaded: async (user) => {
      await wiring.queue({ kind: 'new' });
      const photo =
        wiring.adminToken && user.avatarKey ? await wiring.avatars.get(user.avatarKey) : undefined;
      if (!wiring.adminToken || !photo) return;
      // The photo is read once: each member gets the same bytes.
      const bytes = { body: await new Response(photo.body).arrayBuffer(), type: photo.type };
      const markup = faceMenu({ userId: user.id, at: user.face?.at ?? null });
      const card = { caption: await cardCaption(wiring, user), markup, html: true };
      for (const chatId of await wiring.recipients(user.id)) {
        // A member who never opened the bot must not stop the upload of the photo.
        await sendPhoto(wiring.fetch, wiring.adminToken, chatId, bytes, card).catch((error: unknown) =>
          console.warn(JSON.stringify({ event: 'face_card_failed', message: String(error) })),
        );
      }
    },
    rejected: async (user, reason) => {
      const text = t('bot.face.rejected', { reason: t(`moderation.faceReason.${reason}`) });
      // A driver hears it in the driver bot: a driver may never have opened the passenger bot.
      const bot = user.isDriver ? 'driver' : 'passenger';
      const markup = openButton(wiring.brand, bot, t('bot.face.change'), PROFILE_PHOTO_LINK);
      await wiring.send([{ bot, chatId: user.id, text, markup }]);
    },
    decided: () => wiring.queue(),
  };
}
