import { appHost, type BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import type { QueueNews } from '../../team-queue';
import type { ComplaintTeller } from '../application/ports';
import { isHigh } from '../domain/complaint';

const { t, formatDate } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  // «Navbat» of the team (G68, docs/122): refreshed, or with a news under it.
  readonly queue: (news?: QueueNews) => Promise<void>;
};

// A person hears from the bot of their side of the ride; the team from the admin bot (docs/17).
export const botTeller = ({ brand, send, queue }: Wiring): ComplaintTeller => {
  const tell = (userId: number, side: 'driver' | 'passenger', text: string) =>
    send([{ bot: side, chatId: userId, text }]);
  return {
    team: async (complaint, against) => {
      if (!isHigh(complaint.reason)) return queue({ kind: 'new' });
      const url = `https://${appHost(brand, 'admin')}/?complaint=${complaint.id}`;
      const reason = t(`complaints.reason.${complaint.reason}`);
      const markup = { inline_keyboard: [[{ text: t('bot.complaint.open'), web_app: { url } }]] };
      const text = t('bot.complaint.urgent', { reason, name: against.firstName, id: against.publicId });
      return queue({ kind: 'urgent', text, markup });
    },
    queueChanged: () => queue(),
    warning: (userId, side) => tell(userId, side, t('bot.complaint.warning')),
    hidden: (userId, side) =>
      tell(userId, side, t('bot.complaint.hidden', { count: String(brand.complaints.hideAfter) })),
    blocked: (userId, side, until) =>
      tell(
        userId,
        side,
        until === null
          ? t('bot.complaint.blockedForever')
          : t('bot.complaint.blocked', { date: formatDate(new Date(until)) }),
      ),
    resolved: (userId, side) => tell(userId, side, t('bot.complaint.resolved')),
  };
};
