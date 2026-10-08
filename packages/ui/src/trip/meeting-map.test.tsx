import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeMap } from '../map/fake-map';
import { MapEngineContext } from '../map/map-engine';
import { renderInShell } from '../test-shell';
import { MeetingMap } from './meeting-map';

afterEach(cleanup);

const POINT = { lat: 41.3113, lng: 69.2795 };

describe('the small map of a meeting point (docs/126)', () => {
  it('stands the point as the pin of the big map, not as a dot (journey g63/4 screens 3 and 13)', async () => {
    const map = fakeMap();
    renderInShell(
      <MapEngineContext.Provider value={async () => map.engine}>
        <MeetingMap point={POINT} onOpen={() => undefined} />
      </MapEngineContext.Provider>,
    );
    await vi.waitFor(() =>
      expect(document.querySelector('.meeting-map-box[data-state="ready"]')).toBeTruthy(),
    );
    expect(map.at()).toEqual(POINT);
    expect(document.querySelector('.meeting-map-pin svg')).toBeTruthy();
    expect(map.marks()).toEqual([]);
  });
});
