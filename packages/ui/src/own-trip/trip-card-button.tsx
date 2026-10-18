import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { ActionFailure } from '../states/action-failure';
import { useTripCard } from './use-trip-card';

// The paper plane of the link (mockup g59/7-channels-3 phone 1).
const SEND = 18;

// «Havolani yoʻlovchilarga yuborish» (G88, docs/193): drawn only while the trip has free seats, so its
// share_shown counts a button people see.
export function TripCardButton({ trip }: { readonly trip: Trip }) {
  const { t } = useI18n();
  const { send, failure } = useTripCard(trip);
  return (
    <>
      <ActionFailure error={failure} />
      <button type="button" className="own-channel-share" onClick={() => void send()}>
        <Icon name="send" size={SEND} />
        <span>{t('driverTrip.channel.share')}</span>
      </button>
    </>
  );
}
