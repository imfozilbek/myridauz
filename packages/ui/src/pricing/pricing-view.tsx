import type { Direction, PricingState } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { RouteView } from '../market/route-view';
import { Screen } from '../screen/screen';
import { PricingHistory } from './pricing-history';
import '../market/market.css';

export type Loaded = { readonly state: PricingState; readonly directions: Direction[] };
const FIELDS = ['ratePerKm', 'roundStep', 'minPrice', 'maxPrice'] as const;

type Props = {
  readonly loaded: Loaded;
  readonly onBack: () => void;
  readonly onEdit: () => void;
  readonly onDirection: (direction: Direction) => void;
  readonly onRollback: (version: number) => void;
};

// The formula, the directions and the history as they are now (docs/23).
export function PricingView({ loaded, onBack, onEdit, onDirection, onRollback }: Props) {
  const { t, formatMoney } = useI18n();
  const { variables } = loaded.state.current;
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('pricing.title')}
      </Title>
      <Text className="market-subtitle">{t('pricing.hint')}</Text>
      <List>
        <Section header={t('pricing.variables')}>
          {FIELDS.map((field) => (
            <Cell key={field} after={<CellValue>{formatMoney(variables[field])}</CellValue>}>
              {t(`pricing.${field}`)}
            </Cell>
          ))}
          <Cell onClick={onEdit}>{t('pricing.edit')}</Cell>
        </Section>
        <Section header={t('pricing.directions')} footer={t('pricing.directionsHint')}>
          {loaded.directions.map((direction) => (
            <Cell
              key={`${direction.from}:${direction.to}`}
              subtitle={
                direction.manual === null
                  ? t('pricing.formula', { price: formatMoney(direction.formula ?? 0) })
                  : t('pricing.manual', { price: formatMoney(direction.manual) })
              }
              description={direction.km === null ? undefined : t('pricing.km', { km: String(direction.km) })}
              onClick={() => onDirection(direction)}
            >
              <RouteView from={direction.from} to={direction.to} />
            </Cell>
          ))}
        </Section>
        <PricingHistory history={loaded.state.history} onRollback={onRollback} />
      </List>
    </div>
  );
}
