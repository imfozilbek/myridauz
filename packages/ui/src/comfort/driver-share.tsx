import type { Trip } from '@platform/contracts';
import { useState } from 'react';
import { Cell, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';
import type { TranslationKey } from '@platform/i18n';
import { errorKey } from '../market/error-text';
import { TripStory } from './trip-story';

// The driver sends the trip to the family the same way a passenger does (docs/43, G18):
// the route, the car and the plate, never a phone.
export function DriverShare({ trip }: { readonly trip: Trip }) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const [shared, setShared] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  if (trip.status !== 'active' && trip.status !== 'full') return null;
  const run = async (action: () => Promise<void>) => {
    try {
      setFailure(null);
      await action();
      haptic.success();
    } catch (caught) {
      // A trip that left cannot be shared any more: the driver reads it (docs/86 T4).
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
  const share = () =>
    run(async () => {
      const { preparedMessageId, link } = await chat.shareTrip(trip.id);
      track({ name: 'driver_trip_shared', screen: 'market.trip' });
      await shareCard(preparedMessageId, link);
      setShared(true);
      setStopped(false);
    });
  const stop = () =>
    run(async () => {
      await chat.stopTripSharing(trip.id);
      setShared(false);
      setStopped(true);
    });
  return (
    <Section
      header={t('share.section')}
      footer={failure ? t(failure) : stopped ? t('share.stopped') : undefined}
    >
      <Cell
        before={<IconTile name="share" tone="accent" />}
        subtitle={t('share.driverSendHint')}
        onClick={() => void share()}
      >
        {t('share.send')}
      </Cell>
      <TripStory trip={trip} onFailure={(caught) => setFailure(errorKey(caught))} />
      {shared ? (
        <Cell before={<IconTile name="blocked" />} onClick={() => void stop()}>
          {t('share.stop')}
        </Cell>
      ) : null}
    </Section>
  );
}
