import type { Stats } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { leaveLabelOf } from '../leave/leave-labels';
import { ManageGroup, ManageRow } from '../manage/manage-page';

type Part = Pick<Stats, 'ratings' | 'complaintReasons'>;
const PERCENT = 100;

// What people feel in the period (G87, docs/191): the mean of the ratings, the trips of 1 or 2 stars,
// what people liked, and why they complained. Numbers only, never who.
export function RatingsSections({ ratings, complaintReasons }: Part) {
  const { t, formatNumber, formatRating } = useI18n();
  const share = ratings.count === 0 ? 0 : Math.round((ratings.low / ratings.count) * PERCENT);
  return (
    <>
      <ManageGroup title={t('stats.ratings.title')}>
        {ratings.count === 0 ? (
          <ManageRow icon="star" title={t('stats.ratings.empty')} />
        ) : (
          <>
            <ManageRow
              icon="star"
              title={t('stats.ratings.average')}
              hint={t('stats.ratings.count', { count: formatNumber(ratings.count) })}
              value={formatRating(ratings.average)}
            />
            <ManageRow
              icon="complaints"
              title={t('stats.ratings.low')}
              hint={t('stats.ratings.share', { share })}
              alarm={ratings.low > 0}
              value={formatNumber(ratings.low)}
            />
          </>
        )}
      </ManageGroup>
      {ratings.tags.length > 0 ? (
        <ManageGroup title={t('stats.ratings.tags')}>
          {ratings.tags.map(({ tag, count }) => (
            <ManageRow
              key={tag}
              icon="favorite"
              title={t(`reviews.tag.${tag}`)}
              value={formatNumber(count)}
            />
          ))}
        </ManageGroup>
      ) : null}
      {complaintReasons.length > 0 ? (
        <ManageGroup title={t('stats.complaintReasons')}>
          {complaintReasons.map(({ reason, count }) => (
            <ManageRow
              key={reason}
              icon="complaints"
              title={t(`complaints.reason.${reason}`)}
              value={formatNumber(count)}
            />
          ))}
        </ManageGroup>
      ) : null}
    </>
  );
}

// Why seats, trips and data went (G87), and how the apps were opened: from a message of a bot, from
// the menu or by a link. Both come from the events.
export function LeavingSections({ leaving, opens }: Pick<Stats, 'leaving' | 'opens'>) {
  const { t, formatNumber } = useI18n();
  return (
    <>
      {leaving.length > 0 ? (
        <ManageGroup title={t('stats.leaving.title')}>
          {leaving.map(({ kind, reason, count }) => {
            const label = leaveLabelOf(kind, reason);
            return (
              <ManageRow
                key={`${kind}.${reason}`}
                icon="erase"
                title={label ? t(label) : reason}
                hint={t(`stats.leaving.kind.${kind}`)}
                value={formatNumber(count)}
              />
            );
          })}
        </ManageGroup>
      ) : null}
      {opens.length > 0 ? (
        <ManageGroup title={t('stats.opens.title')}>
          {opens.map(({ kind, count }) => (
            <ManageRow key={kind} icon="send" title={t(`stats.opens.${kind}`)} value={formatNumber(count)} />
          ))}
        </ManageGroup>
      ) : null}
    </>
  );
}
