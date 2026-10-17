import { FACE_REASONS, type FaceDecision } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t } = createI18n(DEFAULT_LOCALE);

// The card of a new face photo in the admin bot (docs/120, G51), the same way as the card of a
// driver application: "face:<user id>:<at>:ok" approves, "face:<user id>:<at>:no" opens the reasons,
// "face:<user id>:<at>:no:<n>" says no with the reason at place n of FACE_REASONS,
// "face:<user id>:<at>:menu" goes back. <at>: when the photo of the card came, in base 36: a card of
// an older photo never decides a newer one (owner, 17.10.2026); cards sent before have none. Well
// under the 64 bytes of Telegram.
const PREFIX = 'face';
const APPROVE = 'ok';
const REJECT = 'no';
const MENU = 'menu';

const BASE = 36;
const AT = /^[0-9a-z]{6,}$/u;

type Card = { readonly userId: number; readonly at: number | null };
export type FaceAction =
  | (Card & { readonly kind: 'decide'; readonly decision: FaceDecision })
  | (Card & { readonly kind: 'reasons' })
  | (Card & { readonly kind: 'menu' });

const button = (text: string, { userId, at }: Card, ...parts: (string | number)[]) => ({
  text,
  callback_data: [PREFIX, userId, ...(at === null ? [] : [at.toString(BASE)]), ...parts].join(':'),
});

export const isFaceButton = (data: string) => data.startsWith(`${PREFIX}:`);

export const faceCardText = (firstName: string) => t('bot.face.card', { name: firstName });

export const faceMenu = (card: Card) => ({
  inline_keyboard: [[button(t('bot.face.fits'), card, APPROVE), button(t('bot.face.notFit'), card, REJECT)]],
});

// One reason, one tap: the moderator never types (docs/19).
export const faceReasonMenu = (card: Card) => ({
  inline_keyboard: [
    ...FACE_REASONS.map((reason, index) => [
      button(t(`moderation.faceReason.${reason}`), card, REJECT, index),
    ]),
    [button(t('bot.moderation.back'), card, MENU)],
  ],
});

export const faceDecisionLine = (decision: FaceDecision) =>
  decision.action === 'approve'
    ? t('bot.moderation.approved')
    : t('bot.moderation.rejected', { reasons: t(`moderation.faceReason.${decision.reason}`) });

export function parseFaceAction(data: string): FaceAction | null {
  const [prefix, id, ...parts] = data.split(':');
  const userId = Number(id);
  const stamp = parts[0] !== undefined && AT.test(parts[0]) ? parts.shift() : undefined;
  const card = { userId, at: stamp === undefined ? null : parseInt(stamp, BASE) };
  const [action, index, ...rest] = parts;
  if (prefix !== PREFIX || !Number.isInteger(userId) || userId <= 0 || rest.length > 0) return null;
  if (index === undefined && action === APPROVE)
    return { ...card, kind: 'decide', decision: { action: 'approve' } };
  if (index === undefined && action === MENU) return { ...card, kind: 'menu' };
  if (action !== REJECT) return null;
  if (index === undefined) return { ...card, kind: 'reasons' };
  const reason = /^\d$/u.test(index) ? FACE_REASONS[Number(index)] : undefined;
  return reason ? { ...card, kind: 'decide', decision: { action: 'reject', reason } } : null;
}
