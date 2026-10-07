import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookPoint } from '../bookings/book-point';
import { MapEngineContext } from '../map/map-engine';
import { CHORSU, fakeMap, testMap } from '../map/map-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import type { WayEnd } from './way-end';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const open = () => {
  const map = fakeMap();
  const onPick = vi.fn<(end: WayEnd) => void>();
  const near = vi.fn(async () => [CHORSU]);
  renderMarket(
    <MapEngineContext.Provider value={async () => map.engine}>
      <BookPoint placeId="1726269" end="from" initial={null} onBack={() => undefined} onPick={onPick} />
    </MapEngineContext.Provider>,
    testClients({ map: testMap({ near }) }),
  );
  return { map, onPick, near };
};

describe('the start of a booking on the map (G59, docs/126)', { timeout: 20_000 }, () => {
  it('«Yaqin joylar» around the pin move the map in one tap', async () => {
    const { map, near } = open();
    await tap('Chorsu bozori');
    await waitFor(() => expect(map.at()).toEqual(CHORSU.point));
    expect(near).toHaveBeenCalled();
  });

  it('«Uyim» keeps the place under the pin, and next time takes it in one tap', async () => {
    open();
    await screen.findByText('Chilonzor', { exact: false }, { timeout: 3000 });
    await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe('Joy aniqlanmoqda…'));
    await tap('Uyim');
    cleanup();
    const { onPick } = open();
    expect(await screen.findByText('Uyim')).toBeTruthy();
    expect(screen.queryByText('Saqlash')?.closest('button')?.textContent).not.toContain('Uyim');
    await tap('Uyim');
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ place: expect.objectContaining({ id: '1726269' }) }));
  });
});
