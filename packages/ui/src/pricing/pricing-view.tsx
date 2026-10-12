import type { Direction, PricingState } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageNote, ManagePage, ManageRow } from '../manage/manage-page';
import { usePlaceLabel } from '../market/places-gate';
import { PricingHistory } from './pricing-history';

export type Loaded = { readonly state: PricingState; readonly directions: Direction[] };
export const FIELDS = ['ratePerKm', 'roundStep', 'minPrice', 'maxPrice'] as const;

type Props = {
  readonly loaded: Loaded;
  readonly onBack: () => void;
  readonly onEdit: () => void;
  readonly onDirection: (direction: Direction) => void;
  readonly onRollback: (version: number) => void;
};

// The formula, the directions and the history as they are now (docs/23), in cards of «Boshqaruv»
// (G78 sheet 4).
export function PricingView({ loaded, onBack, onEdit, onDirection, onRollback }: Props) {
  const { t, formatMoney } = useI18n();
  const place = usePlaceLabel();
  const { variables } = loaded.state.current;
  return (
    <ManagePage title={t('pricing.title')} hint={t('pricing.hint')} onBack={onBack}>
      <ManageGroup title={t('pricing.variables')}>
        {FIELDS.map((field) => (
          <ManageRow
            key={field}
            icon="fact"
            title={t(`pricing.${field}`)}
            value={formatMoney(variables[field])}
          />
        ))}
        <ManageRow icon="change" title={t('pricing.edit')} onClick={onEdit} />
      </ManageGroup>
      <ManageGroup title={t('pricing.directions')}>
        {loaded.directions.map((direction) => (
          <ManageRow
            key={`${direction.from}:${direction.to}`}
            icon="trip"
            title={t('common.route', { from: place(direction.from).name, to: place(direction.to).name })}
            hint={
              direction.manual === null
                ? t('pricing.formula', { price: formatMoney(direction.formula ?? 0) })
                : t('pricing.manual', { price: formatMoney(direction.manual) })
            }
            onClick={() => onDirection(direction)}
          />
        ))}
      </ManageGroup>
      <ManageNote>{t('pricing.directionsHint')}</ManageNote>
      <PricingHistory history={loaded.state.history} onRollback={onRollback} />
    </ManagePage>
  );
}
