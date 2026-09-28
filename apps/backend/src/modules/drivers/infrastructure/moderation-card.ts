import {
  MODERATION_REASONS,
  type Decision,
  type DecisionInput,
  type ModerationReason,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Car } from '@platform/contracts';
import type { Application } from '../domain/application';

const { t } = createI18n(DEFAULT_LOCALE);

// Buttons of the card carry "mod:<user id>:<action>[:<reason>]", well under the 64 bytes of Telegram.
const PREFIX = 'mod';
export type CardAction =
  | { readonly userId: number; readonly kind: 'decide'; readonly decision: DecisionInput }
  | { readonly userId: number; readonly kind: 'reasons'; readonly action: Exclude<Decision, 'approve'> }
  | { readonly userId: number; readonly kind: 'menu' };

const button = (text: string, ...parts: (string | number)[]) => ({
  text,
  callback_data: [PREFIX, ...parts].join(':'),
});

export function cardText(application: { readonly car: Car | null }, firstName: string): string {
  const car = application.car;
  if (!car) return firstName;
  const color = t(`drivers.color.${car.color}`);
  return t('bot.moderation.card', {
    name: firstName,
    ...car,
    color,
    year: String(car.year),
    seats: String(car.seats),
  });
}

export const cardMenu = (userId: number) => ({
  inline_keyboard: [
    [button(t('bot.moderation.approve'), userId, 'approve')],
    [
      button(t('bot.moderation.reject'), userId, 'reject'),
      button(t('bot.moderation.requestChanges'), userId, 'request_changes'),
    ],
  ],
});

// The moderator chooses a reason, never types it (docs/19): the driver gets it in their language.
export const reasonMenu = (userId: number, action: Exclude<Decision, 'approve'>) => ({
  inline_keyboard: [
    ...MODERATION_REASONS.map((reason) => [button(t(`drivers.reason.${reason}`), userId, action, reason)]),
    [button(t('bot.moderation.back'), userId, 'menu')],
  ],
});

export function decisionLine(application: Pick<Application, 'status' | 'reason'>): string {
  const reason = application.reason ? t(`drivers.reason.${application.reason}`) : '';
  if (application.status === 'approved') return t('bot.moderation.approved');
  if (application.status === 'rejected') return t('bot.moderation.rejected', { reason });
  return t('bot.moderation.changesRequested', { reason });
}

const isReason = (value: string | undefined): value is ModerationReason =>
  (MODERATION_REASONS as readonly string[]).includes(value ?? '');

export function parseCardAction(data: string): CardAction | null {
  const [prefix, id, action, reason] = data.split(':');
  const userId = Number(id);
  if (prefix !== PREFIX || !Number.isInteger(userId) || userId <= 0) return null;
  if (action === 'menu') return { userId, kind: 'menu' };
  if (action === 'approve') return { userId, kind: 'decide', decision: { action } };
  if (action !== 'reject' && action !== 'request_changes') return null;
  if (reason === undefined) return { userId, kind: 'reasons', action };
  return isReason(reason) ? { userId, kind: 'decide', decision: { action, reason } } : null;
}
