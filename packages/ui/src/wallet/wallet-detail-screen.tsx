import {
  BOOKING_LINK,
  MY_TRIP_LINK,
  type AppLink,
  type WalletDetail,
  type WalletOperation,
} from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { PlacesGate } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { Screen } from '../screen/screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { brandVars } from '../theme/brand-vars';
import { DetailCount, DetailTrip } from './wallet-detail-parts';
import { useSigned } from './signed';
import './wallet.css';
import './wallet-rows.css';
import './wallet-detail.css';

const CHEVRON = 10;

type Props = {
  readonly operation: WalletOperation;
  // Opens the trip or the booking; without it the details only show them.
  readonly onOpen?: ((link: AppLink) => void) | undefined;
  readonly onBack: () => void;
};

// Why a commission was taken, or what came back (G65, mockup g65/2): the trip and the passenger,
// the count, the balance, the rule of the refund and «Safarni ochish».
export function WalletDetailScreen({ operation, onOpen, onBack }: Props) {
  const { wallet } = useApiClients();
  const { value, failed, reload } = useLoad(() => wallet.detail(operation.id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <PlacesGate onBack={onBack}>
      <Detail detail={value} onOpen={onOpen} onBack={onBack} />
    </PlacesGate>
  );
}

type DetailProps = Omit<Props, 'operation'> & { readonly detail: WalletDetail };

function Detail({ detail, onOpen, onBack }: DetailProps) {
  const { t, formatDate, formatTime } = useI18n();
  const { colors } = useBrand().theme;
  const signed = useSigned();
  const { booking } = detail;
  const at = new Date(detail.createdAt);
  const refund = detail.kind === 'refund';
  return (
    <div className="wallet wallet-detail" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="wallet-title">{t(refund ? 'wallet.detail.refund' : 'wallet.detail.commission')}</h1>
      <p className="wallet-when">{t('driverTrip.when', { day: formatDate(at), time: formatTime(at) })}</p>
      <b className={refund ? 'wallet-detail-sum wallet-row-in' : 'wallet-detail-sum'}>
        {t('common.money', { amount: signed(detail.amount) })}
      </b>
      <h2 className="wallet-head">{t('driverTrip.trip')}</h2>
      <DetailTrip
        booking={booking}
        onRider={onOpen ? () => onOpen({ name: BOOKING_LINK, id: booking.id }) : undefined}
      />
      <h2 className="wallet-head">{t('wallet.detail.account')}</h2>
      <DetailCount detail={detail} />
      <p className="wallet-note">{t('wallet.detail.note')}</p>
      {onOpen ? (
        <button
          type="button"
          className="wallet-open"
          onClick={() => onOpen({ name: MY_TRIP_LINK, id: booking.trip.id })}
        >
          <b>{t('wallet.detail.open')}</b>
          <Icon name="next" size={CHEVRON} />
        </button>
      ) : null}
    </div>
  );
}
