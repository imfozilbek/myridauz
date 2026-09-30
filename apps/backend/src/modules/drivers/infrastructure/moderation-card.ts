import {
  formatPlate,
  MODERATION_REASONS,
  type Decision,
  type DecisionInput,
  type ModerationReason,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Car } from '@platform/contracts';
import type { Application } from '../domain/application';

const { t } = createI18n(DEFAULT_LOCALE);

// Buttons of the card carry "mod:<user id>:<action>[:<picked>[:send]]" or "mod:<user id>:approve[:ok]",
// well under the 64 bytes of Telegram.
// picked: the chosen reasons as bits of their place in MODERATION_REASONS.
const PREFIX = 'mod';
const SEND = 'send';
const CHECKED = 'ok';
type Refusal = Exclude<Decision, 'approve'>;
export type CardAction =
  | { readonly userId: number; readonly kind: 'decide'; readonly decision: DecisionInput }
  | { readonly userId: number; readonly kind: 'pick'; readonly action: Refusal; readonly picked: number }
  | { readonly userId: number; readonly kind: 'menu' }
  // "Tasdiqlash" asks first to compare the plate with the front photo.
  | { readonly userId: number; readonly kind: 'check_plate' }
  // "Yuborish" before any reason is ticked.
  | { readonly userId: number; readonly kind: 'none_picked' };

const button = (text: string, ...parts: (string | number)[]) => ({
  text,
  callback_data: [PREFIX, ...parts].join(':'),
});
const ALL_PICKED = (1 << MODERATION_REASONS.length) - 1;
const pickedReasons = (picked: number): ModerationReason[] =>
  MODERATION_REASONS.filter((_, index) => (picked & (1 << index)) !== 0);

export function cardText(application: { readonly car: Car | null }, firstName: string): string {
  const car = application.car;
  if (!car) return firstName;
  const color = t(`drivers.color.${car.color}`);
  return t('bot.moderation.card', {
    name: firstName,
    ...car,
    plate: formatPlate(car.plate),
    color,
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

// Before approving, the moderator compares the plate in the card with the front photo (docs/50).
// A wrong plate is fixed in the admin Mini App, opened right on this application by the public id
// (docs/65 A3): the button data stays inside the bot, the link opens a page.
export const plateCheckMenu = (userId: number, publicId: string, adminUrl: string) => ({
  inline_keyboard: [
    [button(t('bot.moderation.plateMatches'), userId, 'approve', CHECKED)],
    [{ text: t('bot.moderation.fixPlate'), web_app: { url: `${adminUrl}?application=${publicId}` } }],
    [button(t('bot.moderation.back'), userId, 'menu')],
  ],
});

// The moderator ticks one or more reasons, never types them (docs/19): the driver sees each one
// next to the photo or the field to fix.
export const reasonMenu = (userId: number, action: Refusal, picked: number) => ({
  inline_keyboard: [
    ...MODERATION_REASONS.map((reason, index) => {
      const bit = 1 << index;
      const text = t(`drivers.reason.${reason}`);
      const label = (picked & bit) !== 0 ? t('bot.moderation.picked', { reason: text }) : text;
      return [button(label, userId, action, picked ^ bit)];
    }),
    [
      button(t('bot.moderation.back'), userId, 'menu'),
      button(t('bot.moderation.send'), userId, action, picked, SEND),
    ],
  ],
});

export const reasonList = (reasons: readonly ModerationReason[], separator: string) =>
  reasons.map((reason) => t(`drivers.reason.${reason}`)).join(separator);

export function decisionLine(application: Pick<Application, 'status' | 'reasons'>): string {
  const reasons = reasonList(application.reasons, ', ');
  if (application.status === 'approved') return t('bot.moderation.approved');
  if (application.status === 'rejected') return t('bot.moderation.rejected', { reasons });
  return t('bot.moderation.changesRequested', { reasons });
}

export function parseCardAction(data: string): CardAction | null {
  const [prefix, id, action, bits, send] = data.split(':');
  const userId = Number(id);
  if (prefix !== PREFIX || !Number.isInteger(userId) || userId <= 0) return null;
  if (action === 'menu') return { userId, kind: 'menu' };
  if (action === 'approve') {
    return bits === CHECKED
      ? { userId, kind: 'decide', decision: { action } }
      : { userId, kind: 'check_plate' };
  }
  if (action !== 'reject' && action !== 'request_changes') return null;
  const picked = Number(bits ?? 0);
  if (!Number.isInteger(picked) || picked < 0 || picked > ALL_PICKED) return null;
  if (send !== SEND) return { userId, kind: 'pick', action, picked };
  const reasons = pickedReasons(picked);
  if (reasons.length === 0) return { userId, kind: 'none_picked' };
  return { userId, kind: 'decide', decision: { action, reasons } };
}
