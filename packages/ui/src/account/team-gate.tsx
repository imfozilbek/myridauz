import type { UsersClient } from '@platform/api-client';
import { ApiError } from '@platform/api-client';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';

type TeamGateProps = { readonly client: UsersClient; readonly children: ReactNode };

// The admin Mini App opens only for the team list (docs/02). The server decides, not the screen.
export function TeamGate({ client, children }: TeamGateProps) {
  const [state, setState] = useState<'loading' | 'team' | 'denied' | 'failed'>('loading');
  const { t } = useI18n();
  const brand = useBrand();
  const load = useCallback(() => {
    setState('loading');
    client.getMe().then(
      () => setState('team'),
      (error: unknown) => setState(error instanceof ApiError && error.status === 403 ? 'denied' : 'failed'),
    );
  }, [client]);
  useEffect(load, [load]);
  if (state === 'loading') return <ScreenSkeleton />;
  if (state === 'failed') return <ErrorScreen onRetry={load} />;
  if (state === 'denied')
    return <EmptyState icon="team" title={t('account.team.denied', { brand: brand.name })} />;
  return <>{children}</>;
}
