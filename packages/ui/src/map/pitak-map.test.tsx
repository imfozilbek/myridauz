import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { renderInShell } from '../test-shell';
import { fakeMap } from './fake-map';
import { MapEngineContext } from './map-engine';
import { PitakMap } from './pitak-map';

afterEach(cleanup);

const PITAK = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 } };

describe('the small map of a pitak (G43, docs/65 B3)', () => {
  it('says the map did not load and draws it again', async () => {
    const map = fakeMap(1);
    renderInShell(
      <MapEngineContext.Provider value={async () => map.engine}>
        <PitakMap pitak={PITAK} />
      </MapEngineContext.Provider>,
    );
    await tap('Xarita yuklanmadi');
    await vi.waitFor(() => expect(map.marks()).toHaveLength(1));
    expect(screen.queryByText('Xarita yuklanmadi')).toBeNull();
  });
});
