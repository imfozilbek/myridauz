import { appHost, type BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import { bold, escapeHtml, italic } from '../../../shared/telegram/html';
import type { Case, Queue } from '../domain/queue';

const { t, formatTime } = createI18n(DEFAULT_LOCALE);

// One «Navbat» card on top of the admin bot of each member (G68, docs/122, mockup g68/4): how many
// cases wait, the oldest one and the minutes left until the limit; the work itself is in the app.
const NAVBAT_KEY = 'navbat';

export const caseName = (item: Pick<Case, 'kind' | 'name'>) =>
  t(`bot.navbat.case.${item.kind}`, { name: escapeHtml(item.name) });

function waitLine(minutes: number, limit: number): string {
  if (minutes >= limit) return t('bot.navbat.late', { minutes: String(minutes), limit: String(limit) });
  return t('bot.navbat.left', { minutes: String(minutes), left: bold(String(limit - minutes)) });
}

export function navbatCard(brand: BrandConfig, memberId: number, queue: Queue, now: number): Card {
  const { counts, oldest } = queue;
  const values = {
    applications: String(counts.application),
    complaints: String(counts.complaint),
    faces: String(counts.face),
    supports: counts.support,
  };
  const lines = oldest
    ? [
        bold(t('bot.navbat.title', { total: String(queue.total) })),
        t('bot.navbat.counts', values),
        t('bot.navbat.oldest', { case: bold(caseName(oldest.item)) }),
        waitLine(oldest.minutes, brand.moderation.ownerMinutes),
      ]
    : [bold(t('bot.navbat.empty'))];
  const start = { text: t('bot.navbat.start'), web_app: { url: `https://${appHost(brand, 'admin')}/` } };
  return {
    bot: 'admin',
    chatId: memberId,
    key: NAVBAT_KEY,
    text: lines.join('\n'),
    footer: italic(`${t('bot.card.updated', { time: formatTime(new Date(now)) })} · ${t('bot.navbat.hint')}`),
    markup: { inline_keyboard: [[start]] },
    pin: true,
  };
}

// A short news under the card: a new case, a case that waits long, an urgent complaint.
export const navbatRing = (memberId: number, text: string, quiet: boolean, markup?: object): Ring => ({
  bot: 'admin',
  chatId: memberId,
  text,
  card: NAVBAT_KEY,
  quiet,
  ...(markup ? { markup } : {}),
});

// «Yangi ish keldi: navbat boʻsh edi»: the first case after an empty queue.
export const newCaseRing = (memberId: number, quiet: boolean) =>
  navbatRing(memberId, t('bot.navbat.ringNew'), quiet);
