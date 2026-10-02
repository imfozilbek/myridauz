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
  it('sends the kind of the startapp link with the first screen only', async () => {
    window.history.replaceState(null, '', '/?tgWebAppStartParam=find_1726_1718');
    const { tracked } = renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({ market: { myRequests: async () => [] } }),
    );
    const opened = () => tracked.filter((event) => event.name === 'screen_open');
    await waitFor(() => expect(opened().length).toBeGreaterThan(0));
    expect(opened()[0]).toMatchObject({ source: 'find' });
    expect(
      opened()
        .slice(1)
        .every((event) => !('source' in event)),
    ).toBe(true);
  });
});
