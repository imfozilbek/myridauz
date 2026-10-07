import '@telegram-apps/telegram-ui/dist/styles.css';
import './theme/base.css';
import type { AnalyticsClient, LocationsClient } from '@platform/api-client';
import type { BrandConfig } from '@platform/brands';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Suspense, useCallback, type ReactNode } from 'react';
import { AnalyticsContext } from './context/analytics-context';
import { ApiClientsContext, type ApiClients } from './context/api-clients';
import { BrandContext } from './context/brand-context';
import { I18nProvider } from './context/i18n-context';
import { ConnectionGate } from './network/connection-gate';
import { LocationsClientContext } from './places/directory';
import { StepProgressProvider } from './flow/step-progress';
import { useSplash } from './splash/use-splash';
import { ErrorBoundary } from './states/error-boundary';
import { ScreenSkeleton } from './states/screen-skeleton';
import { TopLoader } from './states/top-loader';
import { OUTSIDE_TELEGRAM, TelegramContext, type TelegramSession } from './telegram/in-telegram-context';
import { themeVars } from './theme/theme-vars';

type AppShellProps = {
  readonly brand: BrandConfig;
  readonly analytics: AnalyticsClient;
  readonly locations: LocationsClient;
  readonly clients: ApiClients;
  readonly session?: TelegramSession;
  readonly children: ReactNode;
};

// Light theme only, never dark (docs/20): the Telegram theme of the user is ignored.
export function AppShell({
  brand,
  analytics,
  locations,
  clients,
  session = OUTSIDE_TELEGRAM,
  children,
}: AppShellProps) {
  // The time from the tap to the first screen, by Mini App and platform (docs/121 §4, docs/29).
  const ready = useCallback(
    (ms: number) => analytics.track({ name: 'app_ready', screen: 'app', ms, client: session.client }),
    [analytics, session.client],
  );
  useSplash(brand.theme.colors.brandStrong, ready);
  return (
    <BrandContext.Provider value={brand}>
      <TelegramContext.Provider value={session}>
        <AnalyticsContext.Provider value={analytics}>
          <I18nProvider>
            <AppRoot
              appearance="light"
              platform={session.platform}
              className="app-shell"
              style={themeVars(brand.theme.colors)}
            >
              <LocationsClientContext.Provider value={locations}>
                <ApiClientsContext.Provider value={clients}>
                  <TopLoader />
                  <StepProgressProvider>
                    <ErrorBoundary>
                      <ConnectionGate>
                        <Suspense fallback={<ScreenSkeleton />}>{children}</Suspense>
                      </ConnectionGate>
                    </ErrorBoundary>
                  </StepProgressProvider>
                </ApiClientsContext.Provider>
              </LocationsClientContext.Provider>
            </AppRoot>
          </I18nProvider>
        </AnalyticsContext.Provider>
      </TelegramContext.Provider>
    </BrandContext.Provider>
  );
}
