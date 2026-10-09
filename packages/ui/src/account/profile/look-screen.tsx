import type { Rating, UserReviews } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useDriver } from '../../driver/driver-context';
import { DriverCard } from '../../find/driver-card';
import { PersonBadge } from '../../find/person-badge';
import { ReviewCard } from '../../find/review-card';
import { ReviewsScreen } from '../../find/reviews-screen';
import { Screen } from '../../screen/screen';
import { useScreenBackground } from '../../telegram/screen-background';
import { brandVars } from '../../theme/brand-vars';
import { useAccount } from '../account-context';
import '../../find/find.css';
import '../../find/safar.css';

const PHOTO = 60;

// «Yoʻlovchilar meni qanday koʻradi» (G65, docs/118 path 8): the same card the other side sees,
// for a driver the top of «Safar» with the car and its plate, then the newest review.
export function LookScreen({ rating, onBack }: { readonly rating: Rating; readonly onBack: () => void }) {
  useScreenView('profile.look');
  useScreenBackground();
  const { t, formatRating } = useI18n();
  const { colors } = useBrand().theme;
  const account = useAccount();
  const driver = useDriver();
  const [reviews, setReviews] = useState<UserReviews | null>(null);
  if (!account) return null;
  if (reviews) return <ReviewsScreen reviews={reviews} onBack={() => setReviews(null)} />;
  const { id, firstName, hasAvatar } = account.profile;
  const car = driver?.application.status === 'approved' ? driver.application.car : null;
  return (
    <div className="find safar" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="find-title">
        {t(driver ? 'account.profile.lookTitle.driver' : 'account.profile.lookTitle.passenger')}
      </h1>
      {car ? (
        <DriverCard driver={{ id, firstName, hasAvatar, car, rating }} />
      ) : (
        <div className="safar-card driver-card">
          <PersonBadge id={id} name={firstName} hasAvatar={hasAvatar} size={PHOTO} />
          <span className="driver-card-text">
            <span className="driver-card-name">{firstName}</span>
            <span className="driver-card-car">
              {rating.average === null
                ? t('account.profile.newRating')
                : t('find.stars', { rating: formatRating(rating.average) })}
            </span>
          </span>
        </div>
      )}
      <ReviewCard driverId={id} onAll={setReviews} />
    </div>
  );
}
