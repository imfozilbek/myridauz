import { createAnalyticsClient, type AnalyticsInput, type LocationsClient } from '@platform/api-client';
import type { ApiClients } from './context/api-clients';
import { loadBrand } from '@platform/brands';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppShell } from './app-shell';

// Test helper: renders UI inside the real shell and collects tracked analytics events.
// Without a directory the place picker shows no regions; tests of places pass their own.
const NO_LOCATIONS: LocationsClient = { getLocations: async () => ({ version: '0', locations: [] }) };

const NOT_USED = async (): Promise<never> => {
  throw new Error('test.client_not_used');
};
// Tests of the driver and the team screens replace only the calls they need.
export const testClients = (overrides: {
  readonly drivers?: Partial<ApiClients['drivers']>;
  readonly moderation?: Partial<ApiClients['moderation']>;
}): ApiClients => ({
  drivers: {
    getApplication: NOT_USED,
    uploadPhoto: NOT_USED,
    submit: NOT_USED,
    getPhoto: NOT_USED,
    ...overrides.drivers,
  },
  moderation: {
    queue: NOT_USED,
    get: NOT_USED,
    photo: NOT_USED,
    decide: NOT_USED,
    block: NOT_USED,
    ...overrides.moderation,
  },
});
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
