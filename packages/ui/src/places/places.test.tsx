import { toCyrillic } from '@platform/i18n';
import type { LocationsClient } from '@platform/api-client';
import type { Location } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { RouteScreen, type Route } from './route-screen';

afterEach(cleanup);

const place = (id: string, parentId: string | null, name: string, oneCity = false): Location => ({
  id,
  parentId,
  type: parentId === null ? 'region' : 'district',
  name,
  lat: 41,
  lng: 69,
  oneCity,
});
const LOCATIONS = [
  place('1726', null, toCyrillic('Toshkent shahri'), true),
  place('1730', null, toCyrillic('Fargʻona viloyati')),
  place('1726269', '1726', toCyrillic('Chilonzor')),
  place('1726266', '1726', toCyrillic('Yunusobod')),
  place('1730401', '1730', toCyrillic('Fargʻona shahri')),
];

function renderRoute(getLocations: LocationsClient['getLocations'], wholeRegion = false, pick?: 'to') {
  const onDone = vi.fn<(route: Route) => void>();
  const result = renderInShell(
    <RouteScreen
      allowWholeRegion={wholeRegion}
      {...(pick ? { pick } : {})}
      onBack={() => undefined}
      onDone={onDone}
    />,
    false,
    true,
    { getLocations },
  );
  return { ...result, onDone };
}
const ready = async () => ({ version: '1', locations: LOCATIONS });
const choose = async (end: string, ...steps: string[]) => {
  fireEvent.click(await screen.findByText(end));
  for (const step of steps) fireEvent.click(await screen.findByText(step));
};

describe('RouteScreen (docs/14)', () => {
  it('opens the list of the end at once when the main screen asks for it (G25)', async () => {
    renderRoute(ready, false, 'to');
    expect(await screen.findByText(toCyrillic('Qayerga borasiz?'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Fargʻona'))).toBeTruthy();
  });

  // The form in the look of the places of the mockup g75/6 A: two rows with a tile and the place.
  it('shows «Qayerdan» and «Qayerga» as rows of one white card', async () => {
    renderRoute(ready, true);
    expect(await screen.findByText(toCyrillic('Qayerdan'))).toBeTruthy();
    const rows = [...document.querySelectorAll('.district-card .district')].map((row) => row.textContent);
    expect(rows).toEqual([
      `${toCyrillic('Qayerdan')}${toCyrillic('Tanlang')}`,
      `${toCyrillic('Qayerga')}${toCyrillic('Tanlang')}`,
    ]);
  });

  it('picks a region by photo, then a district', async () => {
    const { onDone } = renderRoute(ready);
    await choose(toCyrillic('Qayerdan'), toCyrillic('Toshkent shahri'), toCyrillic('Chilonzor'));
    await choose(toCyrillic('Qayerga'), toCyrillic('Fargʻona'), toCyrillic('Fargʻona shahri'));
    expect(screen.getByText(toCyrillic('Chilonzor'))).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Davom etish')));
    expect(onDone.mock.calls[0]?.[0]).toMatchObject({ from: { id: '1726269' }, to: { id: '1730401' } });
  });

  it('opens the form at the top after a long list, «Qayerdan» in sight (docs/83 N22)', async () => {
    renderRoute(ready);
    await choose(toCyrillic('Qayerdan'));
    const scroll = vi.spyOn(window, 'scrollTo');
    await choose(toCyrillic('Toshkent shahri'), toCyrillic('Chilonzor'));
    expect(await screen.findByText(toCyrillic('Davom etish'))).toBeTruthy();
    expect(scroll).toHaveBeenCalledWith(0, 0);
  });

  it('refuses a trip inside Toshkent shahri right after "to"', async () => {
    const { onDone } = renderRoute(ready);
    await choose(toCyrillic('Qayerdan'), toCyrillic('Toshkent shahri'), toCyrillic('Chilonzor'));
    await choose(toCyrillic('Qayerga'), toCyrillic('Toshkent shahri'), toCyrillic('Yunusobod'));
    expect(
      screen.getByText(toCyrillic('Shahar ichida safar yoʻq. Boshqa shahar yoki tumanni tanlang.')),
    ).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Davom etish')));
    expect(onDone).not.toHaveBeenCalled();
    // G91 (robot): «Davom etish» opens the end to change, as the error asks, never a tap with nothing.
    expect(await screen.findByText(toCyrillic('Qayerga borasiz?'))).toBeTruthy();
  });

  it('finds a place typed with any apostrophe and offers the whole region', async () => {
    renderRoute(ready, true);
    fireEvent.click(await screen.findByText(toCyrillic('Qayerga')));
    fireEvent.change(screen.getByPlaceholderText(toCyrillic('Viloyat, tuman yoki shahar')), {
      target: { value: "farg'ona sh" },
    });
    expect(screen.getByText(toCyrillic('Fargʻona shahri'))).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(toCyrillic('Viloyat, tuman yoki shahar')), {
      target: { value: 'xyz' },
    });
    expect(screen.getByText(toCyrillic('Hech narsa topilmadi'))).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(toCyrillic('Viloyat, tuman yoki shahar')), {
      target: { value: '' },
    });
    await choose(toCyrillic('Toshkent shahri'), toCyrillic('Butun shahar'));
    expect(screen.getByText(toCyrillic('Toshkent shahri'))).toBeTruthy();
  });

  it('offers "try again" when the directory does not load', async () => {
    const getLocations = vi
      .fn<LocationsClient['getLocations']>()
      .mockRejectedValueOnce(new Error('x'))
      .mockImplementation(ready);
    renderRoute(getLocations);
    fireEvent.click(await screen.findByText(toCyrillic('Qayta urinish')));
    expect(await screen.findByText(toCyrillic('Qayerdan'))).toBeTruthy();
  });
});
