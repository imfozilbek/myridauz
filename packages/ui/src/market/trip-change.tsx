import type { Recommendation, Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useChevron } from '../chevron';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { confirm, haptic } from '../telegram/feedback';
import { errorKey } from './error-text';
import { useSeatCommission } from './seat-commission';
import { laterTimes, lowerPrices } from './trip-change-options';
import { useBrand } from '../context/brand-context';

export type TripChange = 'time' | 'price';

// «Oʻzgartirish» on the own trip ahead (G39, docs/104): a later time while there is one, a lower price.
export function TripChangeCells({ trip, onChange }: { trip: Trip; onChange: (change: TripChange) => void }) {
  const { t } = useI18n();
  const { shiftMinutes } = useBrand().schedule;
  const chevron = useChevron();
  const cell = (change: TripChange, icon: 'later' | 'cheaper', label: TranslationKey) => (
    <Cell before={<IconTile name={icon} />} after={chevron()} onClick={() => onChange(change)}>
      {t(label)}
    </Cell>
  );
  return (
    <Section header={t('market.change.section')}>
      {laterTimes(trip, shiftMinutes).length > 0 ? cell('time', 'later', 'market.change.time') : null}
      {cell('price', 'cheaper', 'market.change.price')}
    </Section>
  );
}

type ScreenProps = { readonly trip: Trip; readonly change: TripChange; readonly onDone: () => void };
type Option = { readonly value: number; readonly title: string; readonly description: string };

// One choice of a list, asked once more: the passengers hear about it (docs/19, principle 9).
export function TripChangeScreen({ trip, change, onDone }: ScreenProps) {
  useScreenView(change === 'time' ? 'market.change_time' : 'market.change_price');
  const { t, formatTime, formatMoney } = useI18n();
  const { market } = useApiClients();
  const seatCommission = useSeatCommission();
  const { shiftMinutes } = useBrand().schedule;
  const [bounds, setBounds] = useState<Recommendation | null>(null);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  useEffect(() => {
    if (change === 'price')
      market.recommend(trip.from, trip.to).then(setBounds, (caught) => setFailure(errorKey(caught)));
  }, [change, market, trip.from, trip.to]);
  if (change === 'price' && !bounds && !failure) return <ScreenSkeleton onBack={onDone} />;
  const options: readonly Option[] =
    change === 'time'
      ? laterTimes(trip, shiftMinutes).map((at) => ({
          value: at,
          title: t('market.change.at', { time: formatTime(new Date(at)) }),
          description: t('market.change.later', { minutes: String((at - trip.departAt) / 60_000) }),
        }))
      : lowerPrices(trip.price, bounds?.minPrice ?? trip.price, bounds?.roundStep ?? 1).map((price) => ({
          value: price,
          title: formatMoney(price),
          description: seatCommission(price),
        }));
  const pick = async ({ value, title }: Option) => {
    haptic.select();
    const ask =
      change === 'time'
        ? t('market.change.timeAsk', { time: formatTime(new Date(value)) })
        : t('market.change.priceAsk', { price: title });
    if (!(await confirm(ask, t('market.change.save')))) return;
    try {
      setFailure(null);
      await (change === 'time' ? market.retimeTrip(trip.id, value) : market.lowerTripPrice(trip.id, value));
      haptic.success();
      onDone();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
  return (
    <StepLayout
      icon={change === 'time' ? 'later' : 'cheaper'}
      title={t(change === 'time' ? 'market.change.timeTitle' : 'market.change.priceTitle')}
      hint={t(change === 'time' ? 'market.change.timeHint' : 'market.change.priceHint')}
    >
      <Screen onBack={onDone} />
      <List>
        <ActionFailure error={failure} />
        {options.length > 0 ? (
          <Section>
            {options.map((option) => (
              <Cell key={option.value} description={option.description} onClick={() => void pick(option)}>
                {option.title}
              </Cell>
            ))}
          </Section>
        ) : bounds ? (
          <Text className="step-hint step-note">{t('market.change.priceMin')}</Text>
        ) : null}
      </List>
    </StepLayout>
  );
}
