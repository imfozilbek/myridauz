import { FACE_REASONS, type FaceDecision } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t } = createI18n(DEFAULT_LOCALE);

// The card of a new face photo in the admin bot (docs/120, G51), the same way as the card of a
// driver application: "face:<user id>:ok" approves, "face:<user id>:no" opens the reasons,
// "face:<user id>:no:<n>" says no with the reason at place n of FACE_REASONS, "face:<user id>:menu"
// goes back. Well under the 64 bytes of Telegram.
const PREFIX = 'face';
const APPROVE = 'ok';
const REJECT = 'no';
const MENU = 'menu';

export type FaceAction =
  | { readonly userId: number; readonly kind: 'decide'; readonly decision: FaceDecision }
  | { readonly userId: number; readonly kind: 'reasons' }
  | { readonly userId: number; readonly kind: 'menu' };

const button = (text: string, ...parts: (string | number)[]) => ({
  text,
  callback_data: [PREFIX, ...parts].join(':'),
});

export const isFaceButton = (data: string) => data.startsWith(`${PREFIX}:`);

export const faceCardText = (firstName: string) => t('bot.face.card', { name: firstName });

export const faceMenu = (userId: number) => ({
  inline_keyboard: [
    [button(t('bot.face.fits'), userId, APPROVE), button(t('bot.face.notFit'), userId, REJECT)],
  ],
});

// One reason, one tap: the moderator never types (docs/19).
export const faceReasonMenu = (userId: number) => ({
  inline_keyboard: [
    ...FACE_REASONS.map((reason, index) => [
      button(t(`moderation.faceReason.${reason}`), userId, REJECT, index),
    ]),
    [button(t('bot.moderation.back'), userId, MENU)],
  ],
});

export const faceDecisionLine = (decision: FaceDecision) =>
  decision.action === 'approve'
    ? t('bot.moderation.approved')
    : t('bot.moderation.rejected', { reasons: t(`moderation.faceReason.${decision.reason}`) });

export function parseFaceAction(data: string): FaceAction | null {
  const [prefix, id, action, index, ...rest] = data.split(':');
  const userId = Number(id);
  if (prefix !== PREFIX || !Number.isInteger(userId) || userId <= 0 || rest.length > 0) return null;
  if (index === undefined && action === APPROVE)
    return { userId, kind: 'decide', decision: { action: 'approve' } };
  if (index === undefined && action === MENU) return { userId, kind: 'menu' };
  if (action !== REJECT) return null;
  if (index === undefined) return { userId, kind: 'reasons' };
  const reason = /^\d$/u.test(index) ? FACE_REASONS[Number(index)] : undefined;
  return reason ? { userId, kind: 'decide', decision: { action: 'reject', reason } } : null;
}
