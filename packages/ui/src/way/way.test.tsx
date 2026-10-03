import type { Border } from '@platform/contracts';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { CHORSU, FARGONA, HERE, fakeMap, openPoint } from '../map/map-test-kit';
import { requestPosition } from '../telegram/location';

vi.mock('../telegram/location', () => ({ requestPosition: vi.fn(async () => null) }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.mocked(requestPosition).mockResolvedValue(null);
});
const MARGILON = { ...CHORSU, name: 'Yangi Margʻilon', district: '1730401', point: FARGONA };
const PERSON = { lat: 41.3, lng: 69.25 };
// The name under the pin: the district and the name are known, «Shu yerda» takes the point.
const here = async (name: string) => {
  await screen.findByText(name, {}, { timeout: 3000 });
  await tap('Shu yerda');
};
const type = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText('Mahalla, koʻcha yoki moʻljal'), { target: { value: text } });

describe('One point over the map (G24, docs/71)', { timeout: 20_000 }, () => {
  it('chooses a point by a search in Cyrillic and cuts the map by its district', async () => {
    const map = fakeMap();
    const { done, calls } = openPoint(map, { search: vi.fn(async () => [MARGILON]) });
    await waitFor(() => expect(map.clipped()).toBe(true));
    type('Маргилан');
    await tap('Yangi Margʻilon');
    expect(calls.search).toHaveBeenCalledWith('Маргилан', HERE);
    // The map of the start was cut by its district: the cut goes before the move to another one.
    await waitFor(() => expect(map.log().join(' ')).toMatch(/clip unclip move.* clip$/u));
    await here('Yangi Margʻilon');
    expect(done[0]).toMatchObject({ place: { id: '1730401' } });
  });

  it('starts a pickup where the person stands (G35, docs/97 PS12)', async () => {
    vi.mocked(requestPosition).mockResolvedValue(PERSON);
    const map = fakeMap();
    openPoint(map, {}, true);
    await waitFor(() => expect(map.log()).toContain('move'));
    await here('Chorsu bozori yaqinida');
  });

  it('keeps the map where it opened when the person stands outside the place', async () => {
    vi.mocked(requestPosition).mockResolvedValue({ lat: 1, lng: 1 });
    const map = fakeMap();
    const { calls } = openPoint(
      map,
      { where: vi.fn(async () => ({ district: null, name: null, area: null })) },
      true,
    );
    await waitFor(() => expect(calls.where).toHaveBeenCalledWith({ lat: 1, lng: 1 }));
    expect(map.log()).not.toContain('move');
  });

  it('keeps a late border of the old district from pulling the map back', async () => {
    const map = fakeMap();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => void (release = resolve));
    const square = (id: string): Border => ({
      id,
      parts: [
        [
          [
            [69, 41],
            [70, 41],
            [70, 42],
            [69, 41],
          ],
        ],
      ],
    });
    openPoint(map, {
      search: vi.fn(async () => [MARGILON]),
      // The border of the start comes only after the person moved to Margʻilon.
      border: vi.fn(async (id: string) => (id === '1726269' ? gate.then(() => square(id)) : square(id))),
    });
    await screen.findByText('Chorsu bozori yaqinida');
    type('Margilan');
    await tap('Yangi Margʻilon');
    await waitFor(() => expect(map.clipped()).toBe(true));
    // The late border arrives: give it the time to reach the map.
    await act(async () => {
      release();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    const afterMove = map.log().slice(map.log().lastIndexOf('move'));
    expect(afterMove.filter((step) => step === 'clip')).toHaveLength(1);
  });

  it('keeps the last places on the phone and offers them next time', async () => {
    openPoint(fakeMap());
    await here('Chorsu bozori yaqinida');
    cleanup();
    openPoint(fakeMap());
    expect(await screen.findByText('Oxirgi joylar')).toBeTruthy();
  });

  it('says so when the map does not load, and tries again', async () => {
    openPoint(fakeMap(1));
    await tap('Qayta urinish');
    expect(await screen.findByText('Shu yerda')).toBeTruthy();
  });
});
