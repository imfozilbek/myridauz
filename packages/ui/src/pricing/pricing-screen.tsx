import { ApiError } from '@platform/api-client';
import type { Direction } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useCallback, useEffect, useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { errorKey } from '../market/error-text';
import { PlacesGate } from '../market/places-gate';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { DirectionEdit } from './direction-edit';
import { FormulaScreen } from './formula-screen';
import { PricingView, type Loaded } from './pricing-view';

type Mode =
  | { readonly kind: 'view' }
  | { readonly kind: 'edit' }
  | { readonly kind: 'direction'; readonly direction: Direction; readonly failed: TranslationKey | null };

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
  useScreenBackground();
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
    return (
      <FormulaScreen
        current={variables}
        onBack={() => setMode({ kind: 'view' })}
        onSave={(next) => void done(pricing.save(next))}
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
    <PricingView
      loaded={loaded}
      onBack={onBack}
      onEdit={() => setMode({ kind: 'edit' })}
      onDirection={(direction) => setMode({ kind: 'direction', direction, failed: null })}
      onRollback={(version) => void done(pricing.rollback(version))}
    />
  );
}
