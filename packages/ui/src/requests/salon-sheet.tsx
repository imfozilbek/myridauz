import { ApiError } from '@platform/api-client';
import { commissionFor } from '@platform/brands';
import type { RideRequest } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { BoardSheet } from './board-sheet';
import { useEnds } from './ends';
import { useRequestDay } from './request-day';
import { TimeChips, useOfferTime } from './time-chips';

// The tick of a row filled from the request: a small mark, as on the mockup.
const CHECK = 10;

type Props = {
  readonly request: RideRequest | null;
  // Every seat of the driver's car, as the board says (G61, G64).
  readonly seats: number;
  readonly onClose: () => void;
  // The trip is open for this passenger only, and the offer is on it: «Mening safarim» follows.
  readonly onOpened: (tripId: string) => void;
  readonly onShort: (commission: number) => void;
};

// «Safar ochib taklif qilish» (G64, mockup g64/3 phone 2): a trip for the whole car filled from a
// «Boʻsh salon kerak» request in one sheet; the driver only chooses the time (docs/118 path 7).
export function SalonSheet({ request, ...props }: Props) {
  return (
    <BoardSheet open={request !== null} kind="salon" onClose={props.onClose}>
      {request ? <SalonForm request={request} {...props} /> : null}
    </BoardSheet>
  );
}

function SalonForm({
  request,
  seats,
  onOpened,
  onShort,
}: Omit<Props, 'request'> & { readonly request: RideRequest }) {
  const { t, formatNumber, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { map, bookings } = useApiClients();
  const { commission } = useBrand();
  const day = useRequestDay();
  const ends = useEnds()(request);
  const when = useOfferTime(request);
  const pitak = useLoad(() => map.pitakOf(request.from, request.to)).value;
  const { failure, fail, clear } = useFailure();
  const name = request.passenger.firstName;
  const start = (): string => {
    if (request.pickupMode === 'door') return t('way.trip.mode.door');
    if (request.pickupMode === 'both') return t('way.request.both');
    return pitak?.name ?? t('way.trip.mode.pitak');
  };
  const dayName = day(request.date);
  const fee = commissionFor(commission, request.price, seats);
  const rows = [
    [t('places.route'), t('requests.card.route', ends), null],
    [t('market.when.day'), dayName.charAt(0).toUpperCase() + dayName.slice(1), null],
    [t('way.trip.mode.title'), start(), null],
    [
      t('market.rule.title'),
      t('market.rule.carOnly'),
      t('requests.salon.sum', {
        seats: String(seats),
        price: formatNumber(request.price),
        sum: formatNumber(seats * request.price),
      }),
    ],
    // What the whole car costs the driver before the offer goes (G75, docs/158 Г).
    [t('wallet.title'), t('requests.salon.commission', { sum: formatMoney(fee) }), null],
  ] as const;
  const open = async () => {
    if (!when?.departAt) return;
    clear();
    try {
      const { trip } = await bookings.offerSalonTrip(request.id, when.departAt);
      track({ name: 'booking_step', screen: 'requests.salon', step: 'offer_sent' });
      haptic.success();
      onOpened(trip.id);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough') onShort(fee);
      else fail(caught);
    }
  };
  return (
    <>
      <b className="board-sheet-title">{t('requests.salon.title', { name })}</b>
      <span className="board-sheet-sub">{t('requests.salon.sub')}</span>
      <div className="salon-rows">
        {rows.map(([label, value, note]) => (
          <div key={label} className="salon-row">
            <span className="salon-row-text">
              <span className="salon-row-label">{label}</span>
              <b>{value}</b>
              {note ? <span className="salon-row-note">{note}</span> : null}
            </span>
            <Icon name="selected" size={CHECK} />
          </div>
        ))}
      </div>
      <span className="board-sheet-label">{t('market.when.title')}</span>
      {when ? <TimeChips when={when} /> : <span className="time-chips" />}
      <span className="board-sheet-hint">{t('requests.salon.hint', { name })}</span>
      <ActionFailure error={failure} />
      {when?.departAt ? <MainButton text={t('requests.action.salon')} onClick={open} /> : null}
    </>
  );
}
