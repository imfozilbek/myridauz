import { LIMIT_KEYS, type Journal, type JournalKind, type LimitKey } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import type { IconName } from '../icons';
import type { RowTone } from './manage-page';

type Entry = Journal['entries'][number];

// What a member did, in words: the action of the journal is short, like «block:7:refund» (G75).
const ACTIONS: Readonly<Record<string, TranslationKey>> = {
  'application:approve': 'manage.entry.approved',
  'application:reject': 'manage.entry.rejected',
  'application:request_changes': 'manage.entry.changes',
  'face:approve': 'manage.entry.faceFits',
  'face:reject': 'manage.entry.faceNot',
  'complaint:none': 'manage.entry.noViolation',
  'complaint:warning': 'manage.entry.warning',
  'unblock:unblock': 'manage.entry.unblock',
  'refund:confirm': 'manage.entry.refundConfirmed',
  'refund:reject': 'manage.entry.refundRejected',
  'team:add': 'manage.entry.teamAdd',
  'team:remove': 'manage.entry.teamRemove',
};
const FOREVER = 'forever';
const isLimit = (key: string): key is LimitKey => (LIMIT_KEYS as readonly string[]).includes(key);

export function useEntryWords() {
  const { t } = useI18n();
  return ({ kind, action, subject }: Entry): string => {
    const [what = '', days = '', refund] = action.split(':');
    if (kind === 'limits' && isLimit(subject))
      return t('manage.entry.limit', { name: t(`manage.limit.${subject}`), value: action });
    const key = ACTIONS[`${kind}:${what}`];
    const said =
      what === 'block'
        ? days === FOREVER
          ? t('manage.entry.blockForever')
          : t('manage.entry.blockDays', { days })
        : key
          ? t(key)
          : action;
    return refund ? t('home.meta', { when: said, more: t('manage.entry.refundProposed') }) : said;
  };
}

// The sign of a decision (G78 sheet 5): the icon of its kind, green when it lets a person on, red when
// it stops one, gray for a change.
const SIGNS: Readonly<Record<JournalKind, IconName>> = {
  application: 'applications',
  complaint: 'complaints',
  face: 'photo',
  block: 'blocked',
  unblock: 'blocked',
  refund: 'price',
  team: 'team',
  limits: 'locked',
};
const GOOD: ReadonlySet<string> = new Set(['approve', 'none', 'unblock', 'confirm', 'add']);
const BAD: ReadonlySet<string> = new Set(['reject', 'block', 'remove']);

export function entrySign({ kind, action }: Entry): { readonly icon: IconName; readonly tone?: RowTone } {
  const [what = ''] = action.split(':');
  const icon = SIGNS[kind];
  if (GOOD.has(what)) return { icon, tone: 'success' };
  return BAD.has(what) ? { icon, tone: 'danger' } : { icon };
}
