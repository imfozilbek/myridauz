import type { PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ChoiceRows } from '../sheet/choice-rows';

const DRIVER = 'driver';

type Props = {
  readonly bookingId: string;
  // The driver's first name when the screen knows it.
  readonly driverName: string | null;
  // undefined: the driver.
  readonly about: PersonId | undefined;
  readonly onPick: (about: PersonId | undefined) => void;
};

// Whom the complaint is about (docs/111 Q4, G46): the driver or another passenger of the same trip.
// Nothing when the passenger rode alone: the complaint is about the driver.
export function ComplaintAbout({ bookingId, driverName, about, onPick }: Props) {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const { value: riders } = useLoad(() => bookings.riders(bookingId).catch(() => []));
  if (!riders || riders.length === 0) return null;
  const driver = { key: DRIVER, title: t('complaints.driver'), ...(driverName ? { hint: driverName } : {}) };
  const others = riders.map((rider) => ({
    key: rider.id,
    title: t('complaints.passenger'),
    hint: rider.firstName,
  }));
  return (
    <>
      <p className="complaint-about">{t('complaints.aboutTitle')}</p>
      <div className="complaint-card">
        <ChoiceRows
          name="about"
          choices={[driver, ...others]}
          value={about ?? DRIVER}
          onPick={(key) => onPick(key === DRIVER ? undefined : key)}
        />
      </div>
    </>
  );
}
