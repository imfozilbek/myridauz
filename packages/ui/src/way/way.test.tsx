import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { CHORSU, FARGONA, fakeMap, openWay } from '../map/map-test-kit';
import { requestPosition } from '../telegram/location';

vi.mock('../telegram/location', () => ({ requestPosition: vi.fn(async () => null) }));
const HERE = { lat: 41.2856, lng: 69.2045 };

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.mocked(requestPosition).mockResolvedValue(null);
});
const MARGILON = { ...CHORSU, name: 'Yangi Margʻilon', district: '1730401', point: FARGONA };
// The name under the pin: the district and the name are known, «Shu yerda» takes the point.
const here = async (name: string) => {
  await screen.findByText(name, {}, { timeout: 3000 });
  await tap('Shu yerda');
};
const type = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText('Mahalla, koʻcha yoki moʻljal'), { target: { value: text } });

describe('«Qayerdan / Qayerga» over the map (G24, docs/71)', { timeout: 20_000 }, () => {
  it('fills the start where the person stands and names it', async () => {
    vi.mocked(requestPosition).mockResolvedValue(HERE);
    openWay(fakeMap());
    expect(await screen.findByText('Chorsu bozori yaqinida')).toBeTruthy();
    expect(screen.getByText('Siz turgan joy')).toBeTruthy();
  });

  it('chooses the end by a search in Cyrillic, then gives the way with the pitak of the direction', async () => {
    vi.mocked(requestPosition).mockResolvedValue(HERE);
    const map = fakeMap();
    const { done, calls } = openWay(map, { search: vi.fn(async () => [MARGILON]) });
    await screen.findByText('Siz turgan joy');
    await tap('Qayerga borasiz?');
    await screen.findByText('Uyingiz qayerda?');
    type('Маргилан');
    await tap('Yangi Margʻilon');
    expect(calls.search).toHaveBeenCalledWith('Маргилан', HERE);
    await waitFor(() => expect(map.clipped()).toBe(true));
    // The map of the start was cut by its district: the cut goes before the move to another one.
    expect(map.log().join(' ')).toMatch(/clip unclip move.* clip$/u);
    await here('Yangi Margʻilon');
    await tap('Pitakdan');
    expect(await screen.findByText(/Qoʻyliq pitagi · \d+ km/)).toBeTruthy();
    await tap('Safarlarni koʻrish');
    expect(done[0]).toMatchObject({ mode: 'pitak', from: { point: HERE }, to: { place: { id: '1730401' } } });
  });

  it('asks for both ends before the trips, and offers only «Uyimdan» where the direction has no pitak', async () => {
    const { done } = openWay(fakeMap(), {
      pitakOf: vi.fn(async () => null),
      search: vi.fn(async () => [MARGILON]),
    });
    await tap('Safarlarni koʻrish');
    expect(await screen.findByRole('alert')).toBeTruthy();
    await tap('Qayerdan ketasiz?');
    await here('Chorsu bozori yaqinida');
    await tap('Qayerga borasiz?');
    type('Margilan');
    await tap('Yangi Margʻilon');
    await here('Yangi Margʻilon');
    expect(await screen.findByText(/pitak yoʻq/)).toBeTruthy();
    expect(screen.queryByText('Pitakdan')).toBeNull();
    await tap('Safarlarni koʻrish');
    expect(done[0]?.mode).toBe('door');
  });

  it('keeps the last places on the phone and offers them next time', async () => {
    openWay(fakeMap());
    await tap('Qayerdan ketasiz?');
    await here('Chorsu bozori yaqinida');
    cleanup();
    openWay(fakeMap());
    await tap('Qayerdan ketasiz?');
    expect(await screen.findByText('Oxirgi joylar')).toBeTruthy();
  });

  it('says so when the map does not load, and tries again', async () => {
    // The map behind the card fails first, then the map of the point.
    const map = fakeMap(2);
    openWay(map);
    await tap('Qayerdan ketasiz?');
    await tap('Qayta urinish');
    expect(await screen.findByText('Shu yerda')).toBeTruthy();
  });
});
