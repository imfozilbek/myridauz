import { formatPlate, LIMIT_KEYS, type Journal, type JournalKind, type LimitKey } from '@platform/contracts';
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
  // G95: the team fixed the car by its photo; the owner sent a refusal back to «Navbat».
  'application:car': 'manage.entry.carFixed',
  'application:reopen': 'manage.entry.reopened',
  'face:approve': 'manage.entry.faceFits',
  'face:reject': 'manage.entry.faceNot',
  'complaint:none': 'manage.entry.noViolation',
  'complaint:warning': 'manage.entry.warning',
  'unblock:unblock': 'manage.entry.unblock',
  'refund:confirm': 'manage.entry.refundConfirmed',
  'refund:reject': 'manage.entry.refundRejected',
  'team:add': 'manage.entry.teamAdd',
  'team:remove': 'manage.entry.teamRemove',
  // The waitlist of G83 (docs/181, docs/184): the switch, an opened direction, a new ad link.
  'waitlist:list_open': 'manage.entry.listOpen',
  'waitlist:list_close': 'manage.entry.listClose',
  'waitlist:open': 'manage.entry.directionOpen',
  'waitlist:ad': 'manage.entry.adLink',
  'trip:cancel': 'manage.entry.tripCancelled',
};
const FOREVER = 'forever';
const isLimit = (key: string): key is LimitKey => (LIMIT_KEYS as readonly string[]).includes(key);

export function useEntryWords() {
  const { t } = useI18n();
  return ({ kind, action, subject }: Entry): string => {
    const [what = '', days = '', refund] = action.split(':');
    if (kind === 'limits' && isLimit(subject))
      return t('manage.entry.limit', { name: t(`manage.limit.${subject}`), value: action });
    // «Mashina tuzatildi · 01 A 123 BC → 01 A 777 BC» when the plate changed (G95, «было → стало»).
    if (kind === 'application' && what === 'car' && refund) {
      const plates = `${formatPlate(days)} → ${formatPlate(refund)}`;
      return t('home.meta', { when: t('manage.entry.carFixed'), more: plates });
    }
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
  waitlist: 'channel',
  trip: 'trip',
};
const GOOD: ReadonlySet<string> = new Set(['approve', 'none', 'unblock', 'confirm', 'add', 'reopen']);
const BAD: ReadonlySet<string> = new Set(['reject', 'block', 'remove', 'cancel']);

export function entrySign({ kind, action }: Entry): { readonly icon: IconName; readonly tone?: RowTone } {
  const [what = ''] = action.split(':');
  const icon = SIGNS[kind];
  if (GOOD.has(what)) return { icon, tone: 'success' };
  return BAD.has(what) ? { icon, tone: 'danger' } : { icon };
}
