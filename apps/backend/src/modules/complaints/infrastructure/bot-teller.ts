import { appHost, type BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';
import type { ComplaintTeller } from '../application/ports';

const { t, formatDate } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  readonly team: (text: string, markup: object) => Promise<void>;
};

// A person hears from the bot of their side of the ride; the team from the admin bot (docs/17).
export const botTeller = ({ brand, send, team }: Wiring): ComplaintTeller => {
  const tell = (userId: number, side: 'driver' | 'passenger', text: string) =>
    send([{ bot: side, chatId: userId, text }]);
  return {
    team: async (complaint, againstName) => {
      const url = `https://${appHost(brand, 'admin')}/?complaint=${complaint.id}`;
      const reason = t(`complaints.reason.${complaint.reason}`);
      const markup = { inline_keyboard: [[{ text: t('bot.complaint.open'), web_app: { url } }]] };
      await team(
        t('bot.complaint.urgent', { reason, name: againstName, id: String(complaint.againstId) }),
        markup,
      );
    },
    warning: (userId, side) => tell(userId, side, t('bot.complaint.warning')),
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
