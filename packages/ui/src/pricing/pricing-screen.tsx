import { ApiError } from '@platform/api-client';
import type { Direction, PricingPreview, PricingState, PricingVariables } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { PlacesGate } from '../market/places-gate';
import { RouteView } from '../market/route-view';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { DirectionEdit } from './direction-edit';
import { PricingHistory } from './pricing-history';
import { PricingPreviewScreen } from './pricing-preview';
import { VariablesEditor } from './variables-editor';
import '../market/market.css';

type Loaded = { readonly state: PricingState; readonly directions: Direction[] };
type Mode =
  | { readonly kind: 'view' }
  | { readonly kind: 'edit' }
  | { readonly kind: 'preview'; readonly next: PricingVariables; readonly preview: PricingPreview }
  | { readonly kind: 'direction'; readonly direction: Direction; readonly failed: TranslationKey | null };
const FIELDS = ['ratePerKm', 'roundStep', 'minPrice', 'maxPrice'] as const;

// The price engine for the team: the formula, the directions, the history (docs/23).
export function PricingScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <Pricing onBack={onBack} />
    </PlacesGate>
  );
}

function Pricing({ onBack }: { readonly onBack: () => void }) {
  useScreenView('pricing');
  useScreenBackground('grouped');
  const { t, formatMoney } = useI18n();
  const { pricing } = useApiClients();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'view' });
  const load = useCallback(() => {
    setFailed(false);
    Promise.all([pricing.state(), pricing.directions()]).then(
      ([state, directions]) => setLoaded({ state, directions }),
      () => setFailed(true),
    );
  }, [pricing]);
  useEffect(load, [load]);
  const done = (work: Promise<unknown>) =>
    work.then(
      () => {
        haptic.success();
        setMode({ kind: 'view' });
        load();
      },
      (error: unknown) => {
        haptic.error();
        if (mode.kind === 'direction' && error instanceof ApiError)
          setMode({ ...mode, failed: errorKey(error) });
        else setFailed(true);
      },
    );

  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  if (!loaded) return <ScreenSkeleton onBack={onBack} />;
  const { variables } = loaded.state.current;
  if (mode.kind === 'edit') {
    const preview = (next: PricingVariables) =>
      pricing.preview(next).then(
        (result) => setMode({ kind: 'preview', next, preview: result }),
        () => setFailed(true),
      );
    return (
      <VariablesEditor
        current={variables}
        onBack={() => setMode({ kind: 'view' })}
        onPreview={(next) => void preview(next)}
      />
    );
  }
  if (mode.kind === 'preview') {
    return (
      <PricingPreviewScreen
        preview={mode.preview}
        onBack={() => setMode({ kind: 'edit' })}
        onSave={() => void done(pricing.save(mode.next))}
      />
    );
  }
  if (mode.kind === 'direction') {
    const { from, to } = mode.direction;
    return (
      <DirectionEdit
        direction={mode.direction}
        failed={mode.failed}
        onBack={() => setMode({ kind: 'view' })}
        onSave={(price) => void done(pricing.setDirection({ from, to, price }))}
      />
    );
  }
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
          <Cell onClick={() => setMode({ kind: 'edit' })}>{t('pricing.edit')}</Cell>
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
              onClick={() => setMode({ kind: 'direction', direction, failed: null })}
            >
              <RouteView from={direction.from} to={direction.to} />
            </Cell>
          ))}
        </Section>
        <PricingHistory
          history={loaded.state.history}
          onRollback={(version) => void done(pricing.rollback(version))}
        />
      </List>
    </div>
  );
}
