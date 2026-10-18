import { REVIEW_TAGS, type AdminReview, type ReviewTag } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { HideReviewSheet } from './hide-review-sheet';

const isTag = (tag: string): tag is ReviewTag => (REVIEW_TAGS as readonly string[]).includes(tag);

// «Sharhlar» of the team (G45, docs/24, docs/79 T29): every review, the newest first, who wrote it
// about whom, the blind ones too; a tap opens it with «Yashirish». «Yana» shows the older ones.
export function TeamReviewsScreen({ onBack }: { readonly onBack: () => void }) {
  const { t, formatDate } = useI18n();
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.teamReviews(), 'manage.reviews');
  const [older, setOlder] = useState<readonly AdminReview[]>([]);
  const [end, setEnd] = useState(false);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState<AdminReview | null>(null);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const reviews = [...value.reviews, ...older];
  const more = async () => {
    const last = reviews.at(-1);
    if (!last) return;
    const next = await feedback.teamReviews(last.at);
    setOlder((list) => [...list, ...next.reviews]);
    if (!next.more) setEnd(true);
  };
  const words = (review: AdminReview) =>
    review.text || review.tags.flatMap((tag) => (isTag(tag) ? [t(`reviews.tag.${tag}`)] : [])).join(', ');
  const row = (review: AdminReview) => {
    const gone = review.hidden || hidden.has(review.id);
    const when = formatDate(new Date(review.at));
    const said = words(review);
    return (
      <ManageRow
        key={review.id}
        icon={gone ? 'hidden' : 'star'}
        title={t('manage.review.title', {
          stars: String(review.stars),
          author: review.author.firstName,
          about: review.about.firstName,
        })}
        hint={t('home.meta', {
          when,
          more: gone ? t('manage.review.hidden') : said || t('manage.review.noText'),
        })}
        {...(gone ? {} : { onClick: () => setOpen(review) })}
      />
    );
  };
  return (
    <ManagePage title={t('manage.reviews')} hint={t('manage.reviewsHint')} onBack={onBack} onRefresh={reload}>
      {reviews.length === 0 ? <EmptyState icon="star" title={t('manage.reviewsEmpty')} /> : null}
      {reviews.length > 0 ? <ManageGroup>{reviews.map(row)}</ManageGroup> : null}
      {value.more && !end ? (
        <ManageGroup>
          <ManageRow icon="down" title={t('manage.journalMore')} onClick={() => void more()} />
        </ManageGroup>
      ) : null}
      <HideReviewSheet
        review={open}
        words={open ? words(open) : ''}
        onClose={() => setOpen(null)}
        onHidden={(id) => {
          setHidden((set) => new Set(set).add(id));
          setOpen(null);
        }}
      />
    </ManagePage>
  );
}
