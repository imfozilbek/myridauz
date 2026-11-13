import type { BrandConfig } from '@platform/brands';
import {
  FIND_LINK,
  MY_TRIP_LINK,
  NEW_TRIP_SECTION,
  OPEN_LINK,
  REQUEST_LINK,
  TRIP_LINK,
  type AppLink,
  type TipStep,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, type TranslationKey } from '@platform/i18n';
import { appButton } from '../../../shared/telegram/open-button';
import type { NotificationJob } from '../../notifications';
import type { ReadyTip } from '../application/ports';
import { botOf } from '../domain/tip-rules';

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);

// «Kerak emas» under a tip: no more tips, the other messages stay (docs/232).
export const TIPS_OFF = 'tips_off';

const TEXTS: Readonly<Record<TipStep, TranslationKey>> = {
  p2: 'bot.tip.p2',
  p3: 'bot.tip.p3',
  p10: 'bot.tip.p10',
  req: 'bot.tip.req',
  d1: 'bot.tip.d1',
  d2: 'bot.tip.d2',
  d7: 'bot.tip.d7',
  d4: 'bot.tip.d4',
};
const BUTTONS: Readonly<Record<TipStep, TranslationKey>> = {
  p2: 'bot.tip.find',
  p3: 'bot.tip.openTrip',
  p10: 'bot.tip.find',
  req: 'bot.tip.openRequest',
  d1: 'bot.tip.application',
  d2: 'bot.tip.publish',
  d7: 'bot.tip.openTrip',
  d4: 'bot.tip.publish',
};
const NEW_TRIP: AppLink = { name: OPEN_LINK, id: NEW_TRIP_SECTION };
// The steps of one trip, request or route: the link of the target.
const TARGETS: Partial<Record<TipStep, string>> = {
  p3: TRIP_LINK,
  p10: FIND_LINK,
  req: REQUEST_LINK,
  d7: MY_TRIP_LINK,
};

// The screen of the step: a trip, a request, the search of a route, a new trip, or the main screen.
function linkOf({ step, target }: ReadyTip): AppLink | undefined {
  if (step === 'd2' || step === 'd4') return NEW_TRIP;
  if (!target) return undefined;
  const name = TARGETS[step];
  return name ? { name, id: target } : undefined;
}

// D2 names the bonus left in «Hamyon», only when there is one.
const textOf = (tip: ReadyTip) =>
  tip.step === 'd2' && tip.bonus
    ? t('bot.tip.d2Bonus', { bonus: formatMoney(tip.bonus) })
    : t(TEXTS[tip.step]);

// A tip of the passenger or the driver bot, without sound; its button carries the mark bot-tip-<step>.
export function tipMessage(brand: BrandConfig, tip: ReadyTip): NotificationJob {
  const bot = botOf(tip.step);
  const open = appButton(brand, bot, t(BUTTONS[tip.step]), linkOf(tip), `tip-${tip.step}`);
  return {
    bot,
    chatId: tip.userId,
    text: textOf(tip),
    silent: true,
    markup: { inline_keyboard: [[open], [{ text: t('bot.tip.off'), callback_data: TIPS_OFF }]] },
  };
}
