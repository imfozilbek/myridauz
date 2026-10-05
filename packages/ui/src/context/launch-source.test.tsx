import { cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('where the person came from (docs/89 S3)', () => {
  it('sends the kind of the link, its mark and the platform with the first screen only (G55)', async () => {
    window.history.replaceState(null, '', '/?tgWebAppStartParam=find_1726_1718__ad-insta1');
    const { tracked } = renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({ market: { myRequests: async () => [] } }),
    );
    const opened = () => tracked.filter((event) => event.name === 'screen_open');
    await waitFor(() => expect(opened().length).toBeGreaterThan(0));
    expect(opened()[0]).toMatchObject({ source: 'find', via: 'ad-insta1', client: 'browser' });
    expect(
      opened()
        .slice(1)
        .every((event) => !('source' in event) && !('via' in event) && !('client' in event)),
    ).toBe(true);
  });
});
