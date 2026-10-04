import {
  createAnalyticsClient,
  createBookingsClient,
  createDriversClient,
  createLocationsClient,
  createMarketClient,
  createModerationClient,
  createChannelsClient,
  createPricingClient,
  createUsersClient,
  createWalletClient,
  createChatClient,
  createSubscriptionsClient,
  createComfortClient,
  createFeedbackClient,
  createStatsClient,
  createCallsClient,
  createFeedClient,
  createMapClient,
  createPitaksClient,
  createCompanyClient,
} from '@platform/api-client';
import { brandForApp, loadBrand } from '@platform/brands';
import { QUIET_API_ERRORS, type MiniApp } from '@platform/contracts';
import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountGate } from './account/account-gate';
import type { Welcome } from './account/registration/registration-flow';
import { TeamGate } from './account/team-gate';
import { AppShell } from './app-shell';
import { FeedProvider } from './feed/feed-provider';
import { LaunchLinks } from './launch-links';
import { FollowGate } from './follow/follow-gate';
import { LegalGate } from './legal/legal-gate';
import { reportCrashes } from './states/report-crashes';
import { TelegramOnly } from './states/telegram-only';
import { onAppVisible } from './telegram/app-visible';
import { initTelegram } from './telegram/init-telegram';

const ROOT_ID = 'root';
// Local runs talk to the backend through the same origin; deploys set VITE_API_URL (G03).
const DEFAULT_API_URL = '/api';
const DEV_VERSION = 'dev';

// Passenger and driver apps start with the registration (G04); the admin app checks the team list.
type MountOptions = { readonly welcome?: Welcome };

export function mountApp(app: MiniApp, Page: ComponentType, { welcome }: MountOptions = {}): void {
  const container = document.getElementById(ROOT_ID);
  if (!container) throw new Error('ui.root_missing');
  const brand = brandForApp(loadBrand(import.meta.env.VITE_BRAND), app);
  document.title = brand.name;
  const session = initTelegram(brand.theme.colors);
  const baseUrl = new URL(import.meta.env.VITE_API_URL ?? DEFAULT_API_URL, window.location.origin).toString();
  const fetch = (input: string, init?: RequestInit) => window.fetch(input, init);
  const analytics = createAnalyticsClient({
    baseUrl,
    fetch,
    context: {
      app,
      sessionId: crypto.randomUUID(),
      version: import.meta.env.VITE_APP_VERSION ?? DEV_VERSION,
    },
  });
  reportCrashes(analytics, session.client);
  const onError = (code: string) => {
    if (!QUIET_API_ERRORS.includes(code)) analytics.apiError(code);
  };
  const signed = { baseUrl, fetch, app, initData: session.initData, onError };
  const users = createUsersClient(signed);
  const clients = {
    drivers: createDriversClient(signed),
    moderation: createModerationClient(signed),
    market: createMarketClient(signed),
    pricing: createPricingClient(signed),
    channels: createChannelsClient(signed),
    bookings: createBookingsClient(signed),
    wallet: createWalletClient(signed),
    chat: createChatClient(signed),
    subscriptions: createSubscriptionsClient(signed),
    feedback: createFeedbackClient(signed),
    stats: createStatsClient(signed),
    calls: createCallsClient(signed),
    comfort: createComfortClient(signed),
    map: createMapClient(signed),
    pitaks: createPitaksClient(signed),
    company: createCompanyClient(signed),
  };
  const locations = createLocationsClient({ baseUrl, fetch });
  // The live channel is quiet: its failures never reach the error analytics (docs/64).
  const feed = createFeedClient({ baseUrl, fetch, app, initData: session.initData });
  // Send what is left when Telegram hides or closes the app.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void analytics.flush();
  });
  createRoot(container).render(
    <StrictMode>
      <AppShell brand={brand} analytics={analytics} locations={locations} clients={clients} session={session}>
        <TelegramOnly app={app} required={import.meta.env.PROD}>
          <FeedProvider connect={feed.socketUrl} onWake={onAppVisible}>
            {welcome ? (
              // Only the passenger app is opened from a shared trip card (docs/43).
              <FollowGate enabled={app === 'passenger'}>
                <LegalGate>
                  <AccountGate app={app} client={users} welcome={welcome}>
                    <LaunchLinks app={app}>
                      <Page />
                    </LaunchLinks>
                  </AccountGate>
                </LegalGate>
              </FollowGate>
            ) : (
              <TeamGate client={users}>
                <Page />
              </TeamGate>
            )}
          </FeedProvider>
        </TelegramOnly>
      </AppShell>
    </StrictMode>,
  );
}
