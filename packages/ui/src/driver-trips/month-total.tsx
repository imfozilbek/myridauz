import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import './driver-trips.css';
import './driver-month.css';

// «Bu oy N safar» and «Yoʻl xarajati qaytdi» (G64, mockup g64/6): this month of Tashkent, the trips
// made and what the passengers paid of the costs of the way.
export function MonthTotal() {
  const { t, formatNumber } = useI18n();
  const { market } = useApiClients();
  const month = useLoad(() => market.month(), 'driver.month').value;
  if (!month) return null;
  return (
    <div className="driver-month">
      <span>
        {t('driverTrip.month.title')}
        <b>{t('driverTrip.month.trips', { count: month.trips })}</b>
      </span>
      <span className="driver-month-costs">
        {t('driverTrip.month.costs')}
        <b>{formatNumber(month.costs)}</b>
      </span>
    </div>
  );
}
