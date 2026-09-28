import { createAnalyticsClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import type { MiniApp } from '@platform/contracts';
import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './app-shell';
import { initTelegram } from './telegram/init-telegram';

const ROOT_ID = 'root';
// Local runs talk to the backend through the same origin; deploys set VITE_API_URL (G03).
const DEFAULT_API_URL = '/api';
const DEV_VERSION = 'dev';

export function mountApp(app: MiniApp, Page: ComponentType): void {
  const container = document.getElementById(ROOT_ID);
  if (!container) throw new Error('ui.root_missing');
  const brand = loadBrand(import.meta.env.VITE_BRAND);
  document.title = brand.name;
  const session = initTelegram(brand.theme.colors);
  const analytics = createAnalyticsClient({
    baseUrl: new URL(import.meta.env.VITE_API_URL ?? DEFAULT_API_URL, window.location.origin).toString(),
    fetch: (input, init) => window.fetch(input, init),
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
      <AppShell brand={brand} analytics={analytics} session={session}>
        <Page />
      </AppShell>
    </StrictMode>,
  );
}
