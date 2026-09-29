import type { Direction } from '@platform/contracts';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Input, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';

type DirectionEditProps = {
  readonly direction: Direction;
  readonly failed: boolean;
  readonly onBack: () => void;
  // null removes the team's price: the formula works again.
  readonly onSave: (price: number | null) => void;
};

// The team's price for one direction goes before the formula (docs/09, docs/23).
export function DirectionEdit({ direction, failed, onBack, onSave }: DirectionEditProps) {
  useScreenView('pricing.direction');
  const { t, formatMoney } = useI18n();
  const [value, setValue] = useState(String(direction.manual ?? direction.formula ?? ''));
  const price = Number(value);
  const hint =
    direction.formula === null ? undefined : t('pricing.formula', { price: formatMoney(direction.formula) });
  return (
    <StepLayout icon="trip" title={t('pricing.directionTitle')} {...(hint ? { hint } : {})}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={direction.from} to={direction.to} />
          </div>
        </Section>
        <Section>
          <Input
            header={t('pricing.directionPrice')}
            type="number"
            inputMode="numeric"
            value={value}
            status={failed ? 'error' : 'default'}
            onChange={(event) => setValue(event.target.value)}
          />
        </Section>
      </List>
      {failed ? <Text className="step-error">{t('errors.trips.price_out_of_bounds')}</Text> : null}
      {direction.manual === null ? null : (
        <div className="step-note">
          <Button mode="plain" size="m" stretched onClick={() => onSave(null)}>
            {t('pricing.directionRemove')}
          </Button>
        </div>
      )}
      {Number.isInteger(price) && price > 0 ? (
        <MainButton text={t('pricing.directionSave')} onClick={() => onSave(price)} />
      ) : null}
    </StepLayout>
  );
}
