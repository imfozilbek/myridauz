import {
  COMPLAINT_REASONS,
  DRIVER_TAGS,
  PASSENGER_TAGS,
  type CancelReasonCount,
  type ComplaintReason,
  type Feelings,
  type ReviewTag,
} from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { reasonWords } from '../cancel-reason/reason-words';

// A share of 1 and 2 stars from this percent is marked: people are unhappy (G87 V2).
const LOW_ALARM = 20;
const TAGS: readonly string[] = [...DRIVER_TAGS, ...PASSENGER_TAGS];
const isTag = (tag: string): tag is ReviewTag => TAGS.includes(tag);
const isReason = (reason: string): reason is ComplaintReason =>
  (COMPLAINT_REASONS as readonly string[]).includes(reason);

// «Baholar va shikoyatlar» (G87 V2, docs/191): the average stars and the share of 1 and 2 stars of the
// period, the most chosen tags and the most given reasons of complaints, in the words people chose.
export function FeelingsSection({ feelings }: { readonly feelings: Feelings }) {
  const { t, formatNumber } = useI18n();
  const { reviews, average, lowShare, tags, reasons } = feelings;
  return (
    <ManageGroup title={t('stats.feelings.title')}>
      <ManageRow
        icon="star"
        title={t('stats.feelings.average')}
        hint={t('stats.feelings.reviews', { count: formatNumber(reviews) })}
        value={average === null ? t('stats.feelings.none') : formatNumber(average)}
      />
      <ManageRow
        icon="star"
        title={t('stats.feelings.low')}
        alarm={lowShare >= LOW_ALARM}
        value={`${formatNumber(lowShare)}%`}
      />
      {tags.map(({ tag, count }) => (
        <ManageRow
          key={`tag:${tag}`}
          icon="star"
          title={isTag(tag) ? t(`reviews.tag.${tag}`) : tag}
          hint={t('stats.feelings.tag')}
          value={formatNumber(count)}
        />
      ))}
      {reasons.map(({ reason, count }) => (
        <ManageRow
          key={`reason:${reason}`}
          icon="complaints"
          title={isReason(reason) ? t(`complaints.reason.${reason}`) : reason}
          hint={t('stats.feelings.reason')}
          value={formatNumber(count)}
        />
      ))}
    </ManageGroup>
  );
}

// «Bekor qilish sabablari» (G87 V3, docs/191): why seats, trips and accounts went, in the words of the
// sheet «Nima uchun?»; the kind under each.
export function CancelReasonsSection({ reasons }: { readonly reasons: readonly CancelReasonCount[] }) {
  const { t, formatNumber } = useI18n();
  if (reasons.length === 0) return null;
  return (
    <ManageGroup title={t('stats.cancel.title')}>
      {reasons.map(({ what, reason, count }) => (
        <ManageRow
          key={`${what}:${reason}`}
          icon="close"
          title={reasonWords(t, what, reason)}
          hint={t(`stats.cancel.what.${what}`)}
          value={formatNumber(count)}
        />
      ))}
    </ManageGroup>
  );
}
