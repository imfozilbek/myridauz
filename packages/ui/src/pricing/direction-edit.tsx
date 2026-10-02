import type { TranslationKey } from '@platform/i18n';
import type { Direction } from '@platform/contracts';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Cell, Field, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { RouteView } from '../market/route-view';
import { Screen } from '../screen/screen';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { MainButton } from '../telegram/bottom-button';

type DirectionEditProps = {
  readonly direction: Direction;
  // The text of the refusal of the last save, or null.
  readonly failed: TranslationKey | null;
  readonly onBack: () => void;
  // null removes the team's price: the formula works again.
  readonly onSave: (price: number | null) => void;
};

// The team's price for one direction goes before the formula (docs/09, docs/23).
export function DirectionEdit({ direction, failed, onBack, onSave }: DirectionEditProps) {
  useScreenView('pricing.direction');
  const { t, formatMoney } = useI18n();
  const [saved] = useState(String(direction.manual ?? direction.formula ?? ''));
  const [value, setValue] = useState(saved);
  const guard = useUnsavedGuard(value !== saved);
  const price = Number(value);
  const hint =
    direction.formula === null ? undefined : t('pricing.formula', { price: formatMoney(direction.formula) });
  return (
    <StepLayout icon="trip" title={t('pricing.directionTitle')} {...(hint ? { hint } : {})}>
      <Screen onBack={guard(onBack)} />
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={direction.from} to={direction.to} />
          </div>
        </Section>
        <Field
          label={t('pricing.directionPrice')}
          type="number"
          inputMode="numeric"
          value={value}
          status={failed === null ? 'default' : 'error'}
          onChange={(event) => setValue(event.target.value)}
        />
        <MedianHint direction={direction} />
      </List>
      {failed === null ? null : <Text className="step-error">{t(failed)}</Text>}
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

// The median of real prices: only a hint while the team edits the table (docs/09, question 39).
function MedianHint({ direction }: { readonly direction: Direction }) {
  const { t, formatMoney } = useI18n();
  const count = String(direction.medianTrips);
  if (direction.median === null) return <Section footer={t('pricing.medianFew', { count })} />;
  return (
    <Section header={t('pricing.median')} footer={t('pricing.medianHint', { count })}>
      <Cell>{formatMoney(direction.median)}</Cell>
    </Section>
  );
}
