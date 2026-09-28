import { createAnalyticsClient, createLocationsClient, createUsersClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import type { MiniApp } from '@platform/contracts';
import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountGate } from './account/account-gate';
import type { Welcome } from './account/registration/registration-flow';
import { TeamGate } from './account/team-gate';
import { AppShell } from './app-shell';
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
  const brand = loadBrand(import.meta.env.VITE_BRAND);
  document.title = brand.name;
  const session = initTelegram(brand.theme.colors);
  const baseUrl = new URL(import.meta.env.VITE_API_URL ?? DEFAULT_API_URL, window.location.origin).toString();
  const fetch = (input: string, init?: RequestInit) => window.fetch(input, init);
  const users = createUsersClient({ baseUrl, fetch, app, initData: session.initData });
  const locations = createLocationsClient({ baseUrl, fetch });
  const analytics = createAnalyticsClient({
    baseUrl,
    fetch,
    context: {
      app,
      sessionId: crypto.randomUUID(),
      version: import.meta.env.VITE_APP_VERSION ?? DEV_VERSION,
    },
  });
  // Send what is left when Telegram hides or closes the app.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void analytics.flush();
  });
  createRoot(container).render(
    <StrictMode>
      <AppShell brand={brand} analytics={analytics} locations={locations} session={session}>
        {welcome ? (
          <AccountGate app={app} client={users} welcome={welcome}>
            <Page />
          </AccountGate>
        ) : (
          <TeamGate client={users}>
            <Page />
          </TeamGate>
        )}
      </AppShell>
    </StrictMode>,
  );
}
