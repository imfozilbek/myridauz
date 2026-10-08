import { type ApplicationSummary } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { UzPlate } from '../plate/uz-plate';

// The car of an application as the driver gave it: compared with the photos (docs/04).
export function ApplicationCar({ car }: { readonly car: ApplicationSummary['car'] }) {
  const { t } = useI18n();
  return (
    <Section>
      <Cell after={<CellValue>{`${car.make} ${car.model}`}</CellValue>}>{t('drivers.review.car')}</Cell>
      <Cell after={<CellValue>{t(`drivers.color.${car.color}`)}</CellValue>}>{t('drivers.color.title')}</Cell>
      <Cell after={<UzPlate plate={car.plate} size="s" />}>{t('drivers.review.plate')}</Cell>
      <Cell after={<CellValue>{String(car.seats)}</CellValue>}>{t('drivers.review.seats')}</Cell>
    </Section>
  );
}
