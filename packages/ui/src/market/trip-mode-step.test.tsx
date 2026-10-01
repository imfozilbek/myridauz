import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { renderMarket } from './market-test-kit';
import { TripModeStep } from './trip-mode-step';

afterEach(cleanup);
const ROUTE = {
  from: {
    id: '1726269',
    parentId: '1726',
    type: 'district',
    name: 'Chilonzor',
    lat: 41,
    lng: 69,
    oneCity: false,
  },
  to: {
    id: '1730401',
    parentId: '1730',
    type: 'district',
    name: 'Fargʻona shahri',
    lat: 40,
    lng: 71,
    oneCity: false,
  },
} as const;

const open = (calls: Parameters<typeof testMap>[0] = {}) => {
  const { container } = renderMarket(
    <TripModeStep route={ROUTE} onBack={() => undefined} onDone={() => undefined} />,
    testClients({ map: testMap(calls) }),
  );
  return container;
};

describe('the way a driver takes people (G26, docs/74)', () => {
  it('shows the pitak of the direction on a small map', async () => {
    const container = open();
    expect(await screen.findByText('Ikkalasi ham')).toBeTruthy();
    expect(screen.getAllByText('Qoʻyliq pitagi').length).toBeGreaterThan(0);
    expect(container.querySelector('.pitak-map')).toBeTruthy();
  });

  it('puts the pitak under the choice, not beside it: a 360 px phone shows the whole choice (N16)', async () => {
    const container = open();
    expect(await screen.findByText('Pitakdan olaman')).toBeTruthy();
    expect(container.querySelectorAll('.cell-value')).toHaveLength(0);
    expect(screen.getAllByText('Qoʻyliq pitagi').length).toBe(2);
  });

  it('offers only «around the city» where the direction has no pitak', async () => {
    const container = open({ pitakOf: vi.fn(async () => null) });
    expect(await screen.findByText('Shahar boʻylab yigʻaman')).toBeTruthy();
    expect(screen.queryByText('Pitakdan olaman')).toBeNull();
    expect(container.querySelector('.pitak-map')).toBeNull();
  });
});
