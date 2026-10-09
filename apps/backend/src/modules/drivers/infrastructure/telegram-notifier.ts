import { appHost, channelOfPlate, type BrandConfig } from '@platform/brands';
import {
  formatPlate,
  hourLabel,
  isQuietTime,
  isTeamTime,
  NEW_TRIP_SECTION,
  OPEN_LINK,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import type { QueueNews } from '../../team-queue';
import type { Application } from '../domain/application';
import type { Bonus, ModerationNotifier } from '../application/ports';
import { applicationCard, decisionRing } from './application-card';

const { t, formatDate, formatMoney } = createI18n(DEFAULT_LOCALE);

type Wiring = {
  readonly brand: BrandConfig;
  // The application lives in one card of the driver bot; the answer rings under it (G68, docs/122).
  readonly show: (cards: readonly Card[], rings: readonly Ring[]) => Promise<void>;
  // The member of the team who answers for this applicant (docs/92): the reminders go to them.
  readonly assign: (userId: number) => Promise<unknown>;
  // «Navbat» of the team: the application is a case there, decided in the admin app (docs/122).
  readonly queue: (news?: QueueNews) => Promise<void>;
};

const RESULT_TEXT = {
  approved: 'bot.driver.approved',
  rejected: 'bot.driver.rejected',
  changes_requested: 'bot.driver.changesRequested',
} as const;

// The welcome bonus and its last day (docs/89 D4).
const bonusLine = ({ amount, expiresAt }: Bonus) =>
  t('bot.driver.bonus', { amount: formatMoney(amount), date: formatDate(new Date(expiresAt)) });

// A person may have never opened a bot: one failed message must not stop the others.
const quietly = (work: Promise<unknown>) =>
  work.catch((error: unknown) =>
    console.warn(JSON.stringify({ event: 'driver_notify_failed', message: String(error) })),
  );

// The driver hears when the answer comes: within the hour while the team works, else in the
// morning (G34). The team hours are Tashkent time.
function receivedText(brand: BrandConfig, sentAt: number): string {
  const { hours } = brand.moderation;
  if (isTeamTime(sentAt, hours)) return t('bot.driver.received');
  return t('bot.driver.receivedNight', { from: hourLabel(hours.from), to: hourLabel(hours.to) });
}

// The approval (G62, docs/119 driver 4): the channel of the region of the car with «Kanalga oʻtish»,
// and «Safar eʼlon qilish» right into a new trip. A Tashkent car has no channel (docs/15).
function approvedParts(brand: BrandConfig, application: Application, fixedPlate: string | null) {
  const plate = fixedPlate ?? application.car?.plate ?? '';
  const zone = channelOfPlate(brand, plate);
  const publish = {
    text: t('bot.driver.publish'),
    web_app: { url: `https://${appHost(brand, 'driver')}/?${OPEN_LINK}=${NEW_TRIP_SECTION}` },
  };
  if (!zone) return { channel: null, buttons: [[publish]] };
  return {
    channel: t('bot.driver.channel', { zone: zone.title, username: zone.username }),
    buttons: [[{ text: t('bot.driver.join'), url: `https://t.me/${zone.username}` }], [publish]],
  };
}

export function telegramNotifier(wiring: Wiring): ModerationNotifier {
  const { brand, show } = wiring;
  return {
    submitted: async (application: Application) => {
      const details = [receivedText(brand, application.submittedAt ?? application.updatedAt)];
      await quietly(show([applicationCard({ brand, application, fixedPlate: null, details })], []));
      await wiring.assign(application.userId);
      await wiring.queue({ kind: 'new' });
    },
    decided: async (application, fixedPlate, bonus) => {
      if (application.status === 'draft' || application.status === 'pending') return;
      // One reason per line: the driver finds each one marked in the Mini App.
      const reasons = application.reasons.map((reason) => `• ${t(`drivers.reason.${reason}`)}`).join('\n');
      const approved =
        application.status === 'approved' ? approvedParts(brand, application, fixedPlate) : null;
      const details = [
        t(RESULT_TEXT[application.status], { reasons }),
        ...(fixedPlate ? [t('bot.driver.plateFixed', { plate: formatPlate(fixedPlate) })] : []),
        ...(bonus ? [bonusLine(bonus)] : []),
        ...(approved?.channel ? [approved.channel] : []),
      ].join('\n\n');
      const card = applicationCard({
        brand,
        application,
        fixedPlate,
        details: [details],
        ...(approved ? { buttons: approved.buttons } : {}),
      });
      await quietly(show([card], decisionRing(application, isQuietTime(Date.now()))));
      await wiring.queue();
    },
  };
}
