import { appHost, type BrandConfig } from '@platform/brands';
import { formatPlate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import { bold, escapeHtml, mono } from '../../../shared/telegram/html';
import type { Application } from '../domain/application';

const { t } = createI18n(DEFAULT_LOCALE);

// The application of a driver lives in one card of the driver bot (G68, docs/122): sent → checked →
// the answer, the car with its plate (fixed by the photo), then the words of the step.
const cardKey = (userId: number) => `application:${userId}`;

type Decided = 'approved' | 'rejected' | 'changes_requested';
const ANSWERS = {
  approved: { step: 'bot.dapp.approved', ring: 'bot.dapp.ringApproved' },
  rejected: { step: 'bot.dapp.rejected', ring: 'bot.dapp.ringRejected' },
  changes_requested: { step: 'bot.dapp.changes', ring: 'bot.dapp.ringChanges' },
} as const;
const isDecided = (status: Application['status']): status is Decided => status in ANSWERS;

const stepsLine = (status: Application['status']) =>
  isDecided(status) ? t('bot.dapp.answered', { answer: t(ANSWERS[status].step) }) : t('bot.dapp.checking');

function carLine(application: Application, fixedPlate: string | null): string[] {
  const { car } = application;
  if (!car) return [];
  const paint = t(`drivers.color.${car.color}`).toLocaleLowerCase();
  const plate = fixedPlate ?? car.plate;
  return [`🚗 ${escapeHtml(`${car.model}, ${paint}`)}${plate ? ` · ${mono(formatPlate(plate))}` : ''}`];
}

type Facts = {
  readonly brand: BrandConfig;
  readonly application: Application;
  readonly fixedPlate: string | null;
  // The words under the steps: when the answer comes, or the answer with its reasons and bonus.
  readonly details: readonly string[];
  readonly buttons?: readonly (readonly object[])[];
};

export function applicationCard({ brand, application, fixedPlate, details, buttons }: Facts): Card {
  const open = { text: t('bot.open'), web_app: { url: `https://${appHost(brand, 'driver')}` } };
  const head = [
    bold(t('bot.dapp.title')),
    stepsLine(application.status),
    ...carLine(application, fixedPlate),
  ];
  return {
    bot: 'driver',
    chatId: application.userId,
    key: cardKey(application.userId),
    text: [...head, '', ...details].join('\n'),
    markup: { inline_keyboard: buttons ?? [[open]] },
  };
}

// The answer of the team rings under the card (docs/122: «решение по заявке»).
export function decisionRing(application: Application, quiet: boolean): Ring[] {
  if (!isDecided(application.status)) return [];
  const text = t(ANSWERS[application.status].ring);
  return [{ bot: 'driver', chatId: application.userId, text, card: cardKey(application.userId), quiet }];
}
