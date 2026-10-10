import type { Standing } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import { useDriver } from '../../driver/driver-context';
import { PersonBadge } from '../../find/person-badge';
import { UzPlate } from '../../plate/uz-plate';
import { useAccount } from '../account-context';

const PHOTO = 64;
// The numbers keep their height while they load: nothing jumps (G41).
const BLANK = ' ';

// The person as the other side sees them (G75, mockup g75/5 A): the face, the name and the stars,
// for a driver the car and its plate; under it the ratings, the trips and «vaqtida».
export function LookCard({ standing }: { readonly standing: Standing | null }) {
  const { t, formatRating } = useI18n();
  const account = useAccount();
  const driver = useDriver();
  if (!account) return null;
  const { id, firstName, hasAvatar } = account.profile;
  const car = driver?.application.status === 'approved' ? driver.application.car : null;
  const average = standing?.rating.average ?? null;
  const onTime = standing?.onTime ?? null;
  const fresh = t('account.profile.newRating');
  const numbers = [
    [String(standing?.rating.count ?? 0), t('account.profile.stats.rated')],
    [String(standing?.trips ?? 0), t('account.profile.stats.trips')],
    [
      onTime === null ? fresh : t('account.profile.stats.percent', { value: String(onTime) }),
      t('account.profile.stats.onTime'),
    ],
  ] as const;
  return (
    <div className="look-card">
      <div className="look-top">
        <PersonBadge id={id} name={firstName} hasAvatar={hasAvatar} size={PHOTO} />
        <span className="look-words">
          <span>
            <b className="look-name">{firstName}</b>{' '}
            <span className="look-stars">
              {average === null ? fresh : t('find.stars', { rating: formatRating(average) })}
            </span>
          </span>
          {car ? (
            <>
              <span className="look-car">
                {t('find.car', { make: car.make, model: car.model, color: t(`drivers.color.${car.color}`) })}
              </span>
              <UzPlate plate={car.plate} size="s" />
            </>
          ) : null}
        </span>
      </div>
      <div className="look-stats" aria-busy={standing === null}>
        {numbers.map(([value, label]) => (
          <span key={label}>
            <b>{standing ? value : BLANK}</b>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
