import type { DriverApplication } from '@platform/contracts';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FeedContext } from '../feed/feed-context';
import { renderInShell, testClients } from '../test-shell';
import { DriverGate } from './driver-gate';
import { application, car } from './driver-test-kit';

afterEach(cleanup);

describe('the application status of a driver stays fresh (docs/65 B2, lesson 36)', () => {
  it('opens the driver app when the team approves, without reopening the Mini App', async () => {
    let listener: () => void = () => undefined;
    const subscribe = (next: () => void) => ((listener = next), () => undefined);
    let current: DriverApplication = application({ status: 'rejected', car, reasons: ['front_unclear'] });
    const clients = testClients({ drivers: { getApplication: async () => current } });
    renderInShell(
      <FeedContext.Provider value={subscribe}>
        <DriverGate>
          <p data-testid="driver-home" />
        </DriverGate>
      </FeedContext.Provider>,
      false,
      true,
      undefined,
      clients,
    );
    await screen.findByText('Tuzatish');
    expect(screen.queryByTestId('driver-home')).toBeNull();
    current = application({ status: 'approved', car });
    act(() => listener());
    expect(await screen.findByTestId('driver-home')).toBeTruthy();
  });
});
