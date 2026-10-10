import { LIMIT_KEYS, type Journal, type LimitKey } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';

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
