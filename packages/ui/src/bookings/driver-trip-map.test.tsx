import type { Booking } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { openExternal } from '../telegram/feedback';
import { requestPosition } from '../telegram/location';
import { renderInShell } from '../test-shell';
import { confirmed } from './booking-test-kit';
import { DriverTripMap } from './driver-trip-map';
import { stopsInOrder, withMoved } from './driver-stops';

vi.mock('../telegram/location', () => ({ requestPosition: vi.fn(async () => null) }));
vi.mock('../telegram/feedback', async (original) => ({
  ...(await original<typeof import('../telegram/feedback')>()),
  openExternal: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.mocked(openExternal).mockClear();
});

const at = (lat: number, lng: number) => ({ lat, lng });
const passenger = (id: string, name: string, pickup: [number, number], place: string): Booking => ({
  ...confirmed,
  id,
  passenger: { ...confirmed.passenger, firstName: name },
  pickup: { point: at(...pickup), name: { step: 'mahalla', name: place }, area: null },
});
const FAR = passenger('b1', 'Dilnoza', [41.36, 69.3], 'Yunusobod');
const NEAR = passenger('b2', 'Aziz', [41.29, 69.21], 'Qatortol');
const PITAK = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: at(41.2438, 69.3394) };
const HERE = at(41.285, 69.2);

describe('«Safar xaritasi» of the driver (G24, docs/70)', { timeout: 20_000 }, () => {
  it('orders the pickups from where the driver stands and keeps one stop per pitak', () => {
    const { pickups } = stopsInOrder([FAR, NEAR], HERE);
    expect(pickups.map((stop) => stop.who)).toEqual(['Aziz', 'Dilnoza']);
    const atPitak = { ...FAR, mode: 'pitak' as const, pitak: PITAK, pickup: null };
    expect(stopsInOrder([atPitak, { ...atPitak, id: 'b3' }], HERE).pickups).toHaveLength(1);
    expect(withMoved(pickups, 1, -1).map((stop) => stop.who)).toEqual(['Dilnoza', 'Aziz']);
    expect(stopsInOrder([{ ...NEAR, status: 'requested' }], HERE).pickups).toEqual([]);
  });

  it('opens the stops in the chosen navigator and remembers it', async () => {
    vi.mocked(requestPosition).mockResolvedValue(HERE);
    renderInShell(<DriverTripMap bookings={[FAR, NEAR]} onBack={() => undefined} />, false, true);
    // The place of the driver comes after the first drawing: the order follows it.
    const names = () => screen.getAllByText(/Qatortol|Yunusobod/u).map((cell) => cell.textContent);
    await vi.waitFor(() => expect(names()).toEqual(['Qatortol', 'Yunusobod']), { timeout: 5000 });
    fireEvent.click(screen.getAllByLabelText('Pastga')[0] as HTMLElement);
    await tap('Yoʻl koʻrsatish');
    // The choice opens as a sheet over the map: the stops stay in their place (docs/88 L13).
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Qatortol')).toBeTruthy();
    await tap('Yandex');
    expect(openExternal).toHaveBeenCalledWith(
      'https://yandex.uz/maps/?rtext=~41.36,69.3~41.29,69.21&rtt=auto',
    );
    // Not on an iPhone: no Apple Maps. Next time the navigator is not asked again.
    await tap('Yoʻl koʻrsatish');
    expect(openExternal).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Navigatorni almashtirish')).toBeTruthy();
  });

  it('shows the dropoffs on their own tab', async () => {
    renderInShell(<DriverTripMap bookings={[NEAR]} onBack={() => undefined} />, false, true);
    await tap('Tushirish');
    expect(await screen.findByText('Registon mahallasi')).toBeTruthy();
  });
});
