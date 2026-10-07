import type { PersonId } from '@platform/contracts';
import { useId } from 'react';
import { useFavorite } from '../comfort/use-favorite';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Switch } from '../switch';

// «Sevimli haydovchi» right on the review (mockup g60/5): a switch, his new trips come by the bot.
export function FavoriteSwitch({ driverId }: { readonly driverId: PersonId }) {
  const { t } = useI18n();
  const id = useId();
  const { saved, added, failure, toggle } = useFavorite(driverId, 'reviews.form');
  return (
    <>
      <label className="review-favorite" htmlFor={id}>
        <span className="review-favorite-heart">
          <Icon name="favorite" size={16} filled />
        </span>
        <span className="review-favorite-text">{t('reviews.favorite')}</span>
        <Switch id={id} checked={saved === true} disabled={saved === null} onChange={() => void toggle()} />
      </label>
      {failure || added ? (
        <p className="review-note">{failure ? t(failure) : t('comfort.favorite.added')}</p>
      ) : null}
    </>
  );
}
