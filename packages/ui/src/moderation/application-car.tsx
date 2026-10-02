import { formatPlate, type ApplicationSummary } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';

// The car of an application as the driver gave it: compared with the photos (docs/04).
export function ApplicationCar({ car }: { readonly car: ApplicationSummary['car'] }) {
  const { t } = useI18n();
  return (
    <Section>
      <Cell after={<CellValue>{`${car.make} ${car.model}`}</CellValue>}>{t('drivers.review.car')}</Cell>
      <Cell after={<CellValue>{t(`drivers.color.${car.color}`)}</CellValue>}>{t('drivers.color.title')}</Cell>
      <Cell after={<CellValue>{formatPlate(car.plate)}</CellValue>}>{t('drivers.review.plate')}</Cell>
      <Cell after={<CellValue>{String(car.seats)}</CellValue>}>{t('drivers.review.seats')}</Cell>
    </Section>
  );
}
