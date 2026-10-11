import type { Offer, Trip } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { useOneAtATime } from '../telegram/one-at-a-time';
import './own-trip-banner.css';
import './private-trip.css';

// The clock of the plate, as on a published trip (mockup g63/3).
const CLOCK = 16;

type Props = {
  readonly trip: Trip;
  // The offer on this trip; null when its request is gone.
  readonly offer: Offer | null;
  readonly onOpened: () => unknown;
};

// The plate of a trip opened from a «Boʻsh salon kerak» request (G64, mockup g64/3 phone 3): only
// that passenger sees it while the answer waits. After «Rad etish» or the deadline the driver opens
// it for everybody or cancels it (docs/118 path 7).
export function PrivateTripBanner({ trip, offer, onOpened }: Props) {
  const { t } = useI18n();
  const { market } = useApiClients();
  const { failure, fail } = useFailure();
  const open = useOneAtATime(async () => {
    try {
      await market.openTrip(trip.id);
      haptic.success();
      await onOpened();
    } catch (caught) {
      fail(caught);
    }
  });
  const name = offer?.passenger?.firstName ?? '';
  const waiting = offer?.status === 'sent';
  const title = waiting
    ? t('driverTrip.private.waiting.title', { name })
    : offer?.status === 'declined'
      ? t('driverTrip.private.declined.title', { name })
      : t('driverTrip.private.expired.title');
  return (
    <>
      <div className="own-banner" data-stage="published">
        <Icon name="waiting" size={CLOCK} />
        <span className="own-banner-text">
          <b>{title}</b>
          <span>{t(waiting ? 'driverTrip.private.waiting.sub' : 'driverTrip.private.closed.sub')}</span>
        </span>
      </div>
      {waiting ? null : (
        <button type="button" className="private-open" disabled={open.busy} onClick={open.run}>
          {t('driverTrip.private.open')}
        </button>
      )}
      <ActionFailure error={failure} />
    </>
  );
}
