import { createAnalyticsClient, type AnalyticsInput } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppShell } from './app-shell';

// Test helper: renders UI inside the real shell and collects tracked analytics events.
export function renderInShell(children: ReactNode, inTelegram = false) {
  const tracked: AnalyticsInput[] = [];
  const client = createAnalyticsClient({
    baseUrl: 'https://api.test',
    fetch: async () => new Response(null, { status: 204 }),
    context: { app: 'passenger', sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a', version: 'test' },
    schedule: () => () => undefined,
  });
  const analytics = { ...client, track: (event: AnalyticsInput) => void tracked.push(event) };
  const result = render(
    <AppShell brand={loadBrand()} analytics={analytics} inTelegram={inTelegram}>
      {children}
    </AppShell>,
  );
  return { ...result, tracked };
}
