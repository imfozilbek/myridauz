import { createAnalyticsClient, type AnalyticsInput, type LocationsClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppShell } from './app-shell';
import { testClients } from './test-clients';

export { testClients };

// Test helper: renders UI inside the real shell and collects tracked analytics events.
// Without a directory the place picker shows no regions; tests of places pass their own.
const NO_LOCATIONS: LocationsClient = { getLocations: async () => ({ version: '0', locations: [] }) };

const NO_CLIENTS = testClients({});

export function renderInShell(
  children: ReactNode,
  inTelegram = false,
  hasCamera = true,
  locations = NO_LOCATIONS,
  clients = NO_CLIENTS,
) {
  const tracked: AnalyticsInput[] = [];
  const client = createAnalyticsClient({
    baseUrl: 'https://api.test',
    fetch: async () => new Response(null, { status: 204 }),
    context: { app: 'passenger', sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a', version: 'test' },
    schedule: () => () => undefined,
  });
  const analytics = { ...client, track: (event: AnalyticsInput) => void tracked.push(event) };
  const result = render(
    <AppShell
      brand={loadBrand()}
      analytics={analytics}
      locations={locations}
      clients={clients}
      session={{ inTelegram, platform: inTelegram ? 'ios' : 'base', initData: '', hasCamera }}
    >
      {children}
    </AppShell>,
  );
  return { ...result, tracked };
}
