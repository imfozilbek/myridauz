import type { AdminReview } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { FormSheet } from '../sheet/form-sheet';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';

type Props = {
  readonly review: AdminReview | null;
  // The text of the review, or its tags when it has no text.
  readonly words: string;
  readonly onClose: () => void;
  readonly onHidden: (id: string) => void;
};

// One review in a sheet over «Sharhlar» (G45, docs/24): who about whom, the stars and the words;
// «Yashirish» takes it out of the profile and out of the rating for good.
export function HideReviewSheet({ review, words, onClose, onHidden }: Props) {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const { failure, fail, clear } = useFailure();
  const hide = async (id: string) => {
    clear();
    try {
      await feedback.hideReview(id);
      haptic.success();
      onHidden(id);
    } catch (caught) {
      fail(caught);
    }
  };
  const title = review
    ? t('manage.review.title', {
        stars: String(review.stars),
        author: review.author.firstName,
        about: review.about.firstName,
      })
    : '';
  return (
    <FormSheet
      open={review !== null}
      grouped
      title={title}
      hint={t('manage.review.hideHint')}
      onClose={onClose}
    >
      {review ? (
        <>
          <ManageGroup>
            <ManageRow icon="star" title={words || t('manage.review.noText')} />
          </ManageGroup>
          <ActionFailure error={failure} />
          <MainButton text={t('manage.review.hide')} onClick={() => void hide(review.id)} />
        </>
      ) : null}
    </FormSheet>
  );
}
