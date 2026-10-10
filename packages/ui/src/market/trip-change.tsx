import type { Recommendation, Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { SegmentedControl } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceRows } from '../sheet/choice-rows';
import { FormSheet } from '../sheet/form-sheet';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { errorKey } from './error-text';
import { useSeatCommission } from './seat-commission';
import { laterTimes, lowerPrices } from './trip-change-options';
import './trip-change.css';

type TripChange = 'time' | 'price';
type Props = {
  readonly trip: Trip;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onDone: () => void;
};

// «Vaqt yoki narx» on the own trip ahead (G39, docs/104): one sheet for both changes (G75, mockup
// g75/3 A phone 2): a later time while there is one, a lower price; one choice, one button.
export function TripChangeSheet({ trip, open, onClose, onDone }: Props) {
  useScreenView('market.change');
  const { t, formatTime, formatMoney } = useI18n();
  const { market } = useApiClients();
  const seatCommission = useSeatCommission();
  const { shiftMinutes } = useBrand().schedule;
  const times = laterTimes(trip, shiftMinutes);
  const [change, setChange] = useState<TripChange>(times.length > 0 ? 'time' : 'price');
  const [bounds, setBounds] = useState<Recommendation | null>(null);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    if (open && change === 'price' && !bounds)
      market.recommend(trip.from, trip.to).then(setBounds, (caught) => setFailure(errorKey(caught)));
  }, [open, change, bounds, market, trip.from, trip.to]);
  const options =
    change === 'time'
      ? times.map((at) => ({
          key: String(at),
          title: t('market.change.at', { time: formatTime(new Date(at)) }),
          hint: t('market.change.later', { minutes: String((at - trip.departAt) / 60_000) }),
        }))
      : bounds
        ? lowerPrices(trip.price, bounds.minPrice, bounds.roundStep).map((price) => ({
            key: String(price),
            title: formatMoney(price),
            hint: seatCommission(price),
          }))
        : [];
  const chosen = options.find((option) => option.key === picked)?.key ?? options[0]?.key ?? null;
  const save = async () => {
    if (chosen === null) return;
    try {
      setFailure(null);
      const value = Number(chosen);
      await (change === 'time' ? market.retimeTrip(trip.id, value) : market.lowerTripPrice(trip.id, value));
      haptic.success();
      onDone();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
  const tab = (which: TripChange, label: TranslationKey) => (
    <SegmentedControl.Item
      selected={change === which}
      className={change === which ? 'change-tab-on' : undefined}
      onClick={() => (setChange(which), setPicked(null))}
    >
      {t(label)}
    </SegmentedControl.Item>
  );
  return (
    <FormSheet open={open} onClose={onClose}>
      {times.length > 0 ? (
        <div className="change-tabs">
          <SegmentedControl>
            {tab('time', 'market.change.time')}
            {tab('price', 'market.change.price')}
          </SegmentedControl>
        </div>
      ) : null}
      <p className="form-sheet-hint">
        {t(change === 'time' ? 'market.change.timeHint' : 'market.change.priceHint')}
      </p>
      <ActionFailure error={failure} />
      {chosen !== null ? (
        <ChoiceRows name="trip-change" choices={options} value={chosen} onPick={setPicked} />
      ) : bounds ? (
        <Text className="step-hint step-note">{t('market.change.priceMin')}</Text>
      ) : null}
      {open && chosen !== null ? <MainButton text={t('market.change.save')} onClick={save} /> : null}
    </FormSheet>
  );
}
