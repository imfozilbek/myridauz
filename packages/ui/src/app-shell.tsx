import '@telegram-apps/telegram-ui/dist/styles.css';
import './theme/base.css';
import type { AnalyticsClient, LocationsClient } from '@platform/api-client';
import type { BrandConfig } from '@platform/brands';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Suspense, type ReactNode } from 'react';
import { AnalyticsContext } from './context/analytics-context';
import { BrandContext } from './context/brand-context';
import { I18nProvider } from './context/i18n-context';
import { LocationsClientContext } from './places/directory';
import { ErrorBoundary } from './states/error-boundary';
import { ScreenSkeleton } from './states/screen-skeleton';
import { OUTSIDE_TELEGRAM, TelegramContext, type TelegramSession } from './telegram/in-telegram-context';
import { themeVars } from './theme/theme-vars';

type AppShellProps = {
  readonly brand: BrandConfig;
  readonly analytics: AnalyticsClient;
  readonly locations: LocationsClient;
  readonly session?: TelegramSession;
  readonly children: ReactNode;
};

// Light theme only, never dark (docs/20): the Telegram theme of the user is ignored.
export function AppShell({
  brand,
  analytics,
  locations,
  session = OUTSIDE_TELEGRAM,
  children,
}: AppShellProps) {
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
                <ErrorBoundary>
                  <Suspense fallback={<ScreenSkeleton />}>{children}</Suspense>
                </ErrorBoundary>
              </LocationsClientContext.Provider>
            </AppRoot>
          </I18nProvider>
        </AnalyticsContext.Provider>
      </TelegramContext.Provider>
    </BrandContext.Provider>
  );
}
