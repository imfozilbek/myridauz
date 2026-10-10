import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DriverContext, type Driver } from '../driver/driver-context';
import { approved } from '../home/home-test-kit';
import { testClients } from '../test-shell';
import { renderMarket } from './market-test-kit';
import { PendingLock } from './pending-lock';

const withStatus = (status: Driver['application']['status']): Driver => ({
  ...approved,
  application: { ...approved.application, status },
});

const render = (driver: Driver) =>
  renderMarket(
    <DriverContext.Provider value={driver}>
      <PendingLock onBack={() => undefined} />
    </DriverContext.Provider>,
    testClients({}),
  );

afterEach(() => {
  cleanup();
});

describe("passengers' requests before the approval (G34)", () => {
  it('asks a driver who has not sent the application to fill it, not that it is checked', () => {
    render(withStatus('draft'));
    expect(screen.getByText('Arizani toʻldiring')).toBeTruthy();
    expect(screen.queryByText('Ariza tekshirilmoqda')).toBeNull();
  });

  it('tells a driver who has sent it that it is checked', () => {
    render(withStatus('pending'));
    expect(screen.getByText('Ariza tekshirilmoqda')).toBeTruthy();
    // The look of a state of the mockup g75/1 A, as a limit or a block.
    expect(document.querySelector('.center-screen .empty-state')).toBeTruthy();
  });
});
