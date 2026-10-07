import type { MapView } from '../map/map-engine';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeMap, HERE, openPoint } from '../map/map-test-kit';

afterEach(cleanup);

describe('the name under the pin (G24, G59)', () => {
  it('is not asked again when the map ends a «move» on the same center (a resize of its box)', async () => {
    const map = fakeMap();
    const { calls } = openPoint(map);
    await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe('Joy aniqlanmoqda…'));
    const asked = vi.mocked(calls.where).mock.calls.length;
    const view = (await map.engine.mock.results[0]?.value) as MapView;
    view.moveTo(HERE);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(vi.mocked(calls.where).mock.calls.length).toBe(asked);
    view.moveTo({ lat: 41.3, lng: 69.25 });
    await waitFor(() => expect(vi.mocked(calls.where).mock.calls.length).toBe(asked + 1));
  });
});
