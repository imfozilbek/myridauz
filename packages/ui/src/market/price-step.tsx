import type { Recommendation } from '@platform/contracts';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';
import { useSeatCommission } from './seat-commission';
import './market.css';

type PriceStepProps = {
  readonly recommendation: Recommendation;
  readonly initial?: number;
  // A driver sees the commission of a seat at this price (docs/86 V8); a passenger pays none.
  readonly commission?: boolean;
  readonly onBack: () => void;
  readonly onDone: (price: number) => void;
};

// The price per seat is ready: the recommendation (docs/09). The person may change it by steps,
// only within the bounds; outside them the field is red and the bounds are shown.
export function PriceStep({ recommendation, initial, commission = false, onBack, onDone }: PriceStepProps) {
  useScreenView('market.price');
  const { t, formatMoney } = useI18n();
  const seatCommission = useSeatCommission();
  const { minPrice, maxPrice, roundStep } = recommendation;
  const [price, setPrice] = useState(initial ?? recommendation.price);
  const out = price < minPrice || price > maxPrice;
  const change = (by: number) => {
    haptic.select();
    setPrice((value) => Math.min(maxPrice, Math.max(minPrice, value + by)));
  };
  return (
    <StepLayout
      icon="myTrips"
      title={t('market.price.title')}
      hint={t('market.price.hint', { price: formatMoney(recommendation.price) })}
    >
      <Screen onBack={onBack} />
      <div className="price-field">
        <Button
          mode="bezeled"
          size="l"
          className="price-step"
          aria-label={t('market.price.less')}
          onClick={() => change(-roundStep)}
        >
          <Icon name="less" />
        </Button>
        <Text weight="1" className={out ? 'price-value price-out' : 'price-value'}>
          {formatMoney(price)}
        </Text>
        <Button
          mode="bezeled"
          size="l"
          className="price-step"
          aria-label={t('market.price.more')}
          onClick={() => change(roundStep)}
        >
          <Icon name="more" />
        </Button>
      </div>
      <Text className={out ? 'step-error step-note' : 'step-hint step-note'}>
        {t('market.price.bounds', { min: formatMoney(minPrice), max: formatMoney(maxPrice) })}
      </Text>
      {commission && !out ? <Text className="step-hint step-note">{seatCommission(price)}</Text> : null}
      {out ? null : <MainButton text={t('common.continue')} onClick={() => onDone(price)} />}
    </StepLayout>
  );
}
