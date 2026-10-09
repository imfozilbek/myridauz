import { formatPlate, type ApplicationDetail, type Car } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { UzPlate } from '../plate/uz-plate';

const WARN = 18;

// The car as the driver gave it, the plate and the driver (mockup g67/2 screen 3); the car the team
// approved before, when it is another one (G75, «было → стало»).
export function ApplicationDetails({ detail }: { readonly detail: ApplicationDetail }) {
  const { t, formatDate } = useI18n();
  const { car, was } = detail;
  const color = (of: Car) => t(`drivers.color.${of.color}`);
  const gender = t(`account.gender.${detail.gender}`).toLocaleLowerCase('uz');
  return (
    <>
      <div className="case-card">
        <div className="case-row">
          <b>{t('navbat.application.car', { car: `${car.make} ${car.model}`, color: color(car) })}</b>
          <span className="case-muted">{t('navbat.application.seats', { count: car.seats })}</span>
        </div>
        <div className="case-row">
          <span className="case-muted">{t('drivers.review.plate')}</span>
          <UzPlate plate={car.plate} size="s" />
        </div>
        <div className="case-row">
          <span className="case-muted">{t('navbat.application.driver')}</span>
          <b>{t('navbat.application.who', { name: detail.firstName, gender })}</b>
        </div>
        {was ? (
          <div className="case-row">
            <span className="case-muted">{t('navbat.application.was')}</span>
            <span>
              {t('navbat.application.wasCar', {
                model: was.model,
                color: color(was),
                plate: formatPlate(was.plate),
              })}
            </span>
          </div>
        ) : null}
      </div>
      {detail.samePlate > 0 ? (
        <p className="case-warning" role="note">
          <Icon name="error" size={WARN} />
          {t('navbat.application.samePlate', { count: detail.samePlate })}
        </p>
      ) : null}
      {detail.history.length > 0 ? (
        <div className="case-card" role="group" aria-label={t('moderation.history.title')}>
          {detail.history.map((entry) => (
            <div key={entry.at} className="case-row">
              <span>{t(`moderation.history.${entry.status}`)}</span>
              <span className="case-muted">{formatDate(new Date(entry.at))}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
