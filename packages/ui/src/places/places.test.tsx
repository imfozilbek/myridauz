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
  place('1726', null, 'Toshkent shahri', true),
  place('1730', null, 'Fargʻona viloyati'),
  place('1726269', '1726', 'Chilonzor'),
  place('1726266', '1726', 'Yunusobod'),
  place('1730401', '1730', 'Fargʻona shahri'),
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
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(screen.getByText('Fargʻona viloyati')).toBeTruthy();
  });

  it('picks a region by photo, then a district', async () => {
    const { onDone } = renderRoute(ready);
    await choose('Qayerdan', 'Toshkent shahri', 'Chilonzor');
    await choose('Qayerga', 'Fargʻona viloyati', 'Fargʻona shahri');
    expect(screen.getByText('Chilonzor')).toBeTruthy();
    fireEvent.click(screen.getByText('Davom etish'));
    expect(onDone.mock.calls[0]?.[0]).toMatchObject({ from: { id: '1726269' }, to: { id: '1730401' } });
  });

  it('refuses a trip inside Toshkent shahri right after "to"', async () => {
    const { onDone } = renderRoute(ready);
    await choose('Qayerdan', 'Toshkent shahri', 'Chilonzor');
    await choose('Qayerga', 'Toshkent shahri', 'Yunusobod');
    expect(screen.getByText('Shahar ichida safar yoʻq. Boshqa shahar yoki tumanni tanlang.')).toBeTruthy();
    fireEvent.click(screen.getByText('Davom etish'));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('finds a place typed with any apostrophe and offers the whole region', async () => {
    renderRoute(ready, true);
    fireEvent.click(await screen.findByText('Qayerga'));
    fireEvent.change(screen.getByPlaceholderText('Viloyat, tuman yoki shahar'), {
      target: { value: "farg'ona sh" },
    });
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Viloyat, tuman yoki shahar'), { target: { value: 'xyz' } });
    expect(screen.getByText('Hech narsa topilmadi')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Viloyat, tuman yoki shahar'), { target: { value: '' } });
    await choose('Toshkent shahri', 'Butun shahar');
    expect(screen.getByText('Toshkent shahri')).toBeTruthy();
  });

  it('offers "try again" when the directory does not load', async () => {
    const getLocations = vi
      .fn<LocationsClient['getLocations']>()
      .mockRejectedValueOnce(new Error('x'))
      .mockImplementation(ready);
    renderRoute(getLocations);
    fireEvent.click(await screen.findByText('Qayta urinish'));
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
  });
});
