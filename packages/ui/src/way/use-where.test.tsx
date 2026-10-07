import type { MapView } from '../map/map-engine';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeMap, HERE, openPoint, testMap } from '../map/map-test-kit';

afterEach(cleanup);

describe('the name under the pin (G24, G59)', () => {
  it('is not asked again when the map ends a «move» on the same center (a resize of its box)', async () => {
    const map = fakeMap();
    const { calls } = openPoint(map);
    await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe('Joy aniqlanmoqda…'));
    const where = vi.mocked(calls.where ?? vi.fn());
    const asked = where.mock.calls.length;
    const view = (await map.engine.mock.results[0]?.value) as MapView;
    view.moveTo(HERE);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(where.mock.calls.length).toBe(asked);
    view.moveTo({ lat: 41.3, lng: 69.25 });
    await waitFor(() => expect(where.mock.calls.length).toBe(asked + 1));
  });

  it('asks again after a failed ask, though the pin did not move (G59 stand)', async () => {
    const answer = testMap().where;
    const where = vi.fn(answer).mockRejectedValueOnce(new Error('network'));
    openPoint(fakeMap(), { where });
    await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe('Joy aniqlanmoqda…'), {
      timeout: 4000,
    });
    expect(where.mock.calls.length).toBeGreaterThan(1);
  });
});
