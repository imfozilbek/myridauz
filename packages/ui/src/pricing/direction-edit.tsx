import type { TranslationKey } from '@platform/i18n';
import type { Direction } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { ManageInput } from '../manage/manage-input';
import { usePlaceLabel } from '../market/places-gate';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { ActionFailure } from '../states/action-failure';
import { MainButton } from '../telegram/bottom-button';

type DirectionEditProps = {
  readonly direction: Direction;
  // The text of the refusal of the last save, or null.
  readonly failed: TranslationKey | null;
  readonly onBack: () => void;
  // null removes the team's price: the formula works again.
  readonly onSave: (price: number | null) => void;
};

// The team's price for one direction goes before the formula (docs/09, docs/23): the way, the price
// and the median in cards of «Boshqaruv» (G78 sheet 6).
export function DirectionEdit({ direction, failed, onBack, onSave }: DirectionEditProps) {
  useScreenView('pricing.direction');
  const { t, formatMoney } = useI18n();
  const place = usePlaceLabel();
  const [saved] = useState(String(direction.manual ?? direction.formula ?? ''));
  const [value, setValue] = useState(saved);
  const guard = useUnsavedGuard(value !== saved);
  const price = Number(value);
  const hint =
    direction.formula === null ? undefined : t('pricing.formula', { price: formatMoney(direction.formula) });
  return (
    <ManagePage title={t('pricing.directionTitle')} {...(hint ? { hint } : {})} onBack={guard(onBack)}>
      <ManageGroup>
        <ManageRow
          icon="trip"
          title={t('common.route', { from: place(direction.from).name, to: place(direction.to).name })}
        />
      </ManageGroup>
      <ManageGroup>
        <ManageInput
          label={t('pricing.directionPrice')}
          value={value}
          mode="numeric"
          invalid={failed !== null}
          onChange={setValue}
        />
      </ManageGroup>
      <ActionFailure error={failed} />
      <MedianRow direction={direction} onPick={(median) => setValue(String(median))} />
      {direction.manual === null ? null : (
        <ManageGroup>
          <ManageRow icon="change" title={t('pricing.directionRemove')} onClick={() => onSave(null)} />
        </ManageGroup>
      )}
      {Number.isInteger(price) && price > 0 ? (
        <MainButton text={t('pricing.directionSave')} onClick={() => onSave(price)} />
      ) : null}
    </ManagePage>
  );
}

// The median of real prices: a hint while the team edits the table (docs/09, question 39); a tap
// takes it as the price (G79 К7).
type MedianProps = { readonly direction: Direction; readonly onPick: (median: number) => void };
function MedianRow({ direction, onPick }: MedianProps) {
  const { t, formatMoney } = useI18n();
  const count = String(direction.medianTrips);
  const { median } = direction;
  return (
    <ManageGroup {...(median === null ? {} : { title: t('pricing.median') })}>
      {median === null ? (
        <ManageRow icon="statistics" title={t('pricing.medianFew', { count })} />
      ) : (
        <ManageRow
          icon="statistics"
          title={formatMoney(median)}
          hint={t('pricing.medianHint', { count })}
          arrow={false}
          onClick={() => onPick(median)}
        />
      )}
    </ManageGroup>
  );
}
