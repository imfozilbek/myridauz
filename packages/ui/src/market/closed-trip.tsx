import { tashkentDate, type Trip } from '@platform/contracts';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { NotifyMe } from '../subscriptions/notify-me';

type Props = { readonly trip: Trip; readonly reason: string; readonly onOthers?: (() => void) | undefined };

// A trip that takes nobody says why and leads on (docs/89 P8): the other trips of its day and
// «Xabar bering» for a new trip on the route.
export function ClosedTrip({ trip, reason, onOthers }: Props) {
  const { t } = useI18n();
  return (
    <>
      <Text>{reason}</Text>
      {onOthers ? (
        <Button size="l" stretched onClick={onOthers}>
          {t('market.trip.others')}
        </Button>
      ) : null}
      <NotifyMe from={trip.from} to={trip.to} date={tashkentDate(trip.departAt)} />
    </>
  );
}
