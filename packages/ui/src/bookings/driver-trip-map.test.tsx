import { tashkentDayStart, type Booking, type Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacesGate } from '../market/places-gate';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { openExternal } from '../telegram/feedback';
import { requestPosition } from '../telegram/location';
import { fakeMap } from '../map/fake-map';
import { MapEngineContext } from '../map/map-engine';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';
import { DriverTripMap } from './driver-trip-map';
import { stopsInOrder, type Stop } from './driver-stops';

vi.mock('../telegram/location', () => ({ requestPosition: vi.fn(async () => null) }));
vi.mock('../telegram/feedback', async (original) => ({
  ...(await original<typeof import('../telegram/feedback')>()),
  openExternal: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.mocked(openExternal).mockClear();
  vi.mocked(requestPosition).mockResolvedValue(null);
});

const HOUR = 60 * 60 * 1000;
const at = (lat: number, lng: number) => ({ lat, lng });
const passenger = (id: string, name: string, pickup: [number, number], place: string): Booking => ({
  ...confirmed,
  id,
  seats: 1,
  passenger: { ...confirmed.passenger, firstName: name },
  pickup: { point: at(...pickup), name: { step: 'landmark', name: place }, area: null },
});
const FAR = passenger('b1', 'Dilnoza', [41.36, 69.3], 'Yunusobod');
const NEAR = passenger('b2', 'Aziz', [41.29, 69.21], 'Grand');
const PITAK = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: at(41.2438, 69.3394), hint: null };
const HERE = at(41.285, 69.2);
// The day of the tests (1 October, dom-test-setup) at 08:00 in Tashkent: «Bugun 08:00».
const today: Trip = { ...trip, departAt: tashkentDayStart('2026-10-01') + 8 * HOUR };

type Opened = { trip?: Trip; onPoint?: ((stop: Stop) => void) | null; bookings?: Booking[] };
function open(props: Opened = {}) {
  const map = fakeMap();
  renderMarket(
    <MapEngineContext.Provider value={async () => map.engine}>
      <PlacesGate>
        <DriverTripMap
          trip={props.trip ?? today}
          bookings={props.bookings ?? [FAR, NEAR]}
          now={Date.now()}
          onPoint={props.onPoint ?? null}
          onBack={() => undefined}
        />
      </PlacesGate>
    </MapEngineContext.Provider>,
    testClients({}),
  );
  return map;
}

describe('«Safar xaritasi» of the driver (mockup g63/4 screen 12, docs/126)', { timeout: 20_000 }, () => {
  it('orders the pickups from where the driver stands, one stop per pitak with its people', () => {
    const { pickups } = stopsInOrder([FAR, NEAR], HERE);
    expect(pickups.map((stop) => stop.who)).toEqual(['Aziz', 'Dilnoza']);
    const atPitak = { ...FAR, mode: 'pitak' as const, pitak: PITAK, pickup: null };
    const [pitak] = stopsInOrder([atPitak, { ...atPitak, id: 'b3' }], HERE).pickups;
    expect(pitak?.riders.map((rider) => rider.id)).toEqual(['b1', 'b3']);
    expect(stopsInOrder([{ ...NEAR, status: 'requested' }], HERE).pickups).toEqual([]);
  });

  it('shows the day, the passengers and the points in order, each with its pin', async () => {
    vi.mocked(requestPosition).mockResolvedValue(HERE);
    const map = open();
    expect(await screen.findByText('Bugun 08:00 · 2 yoʻlovchi')).toBeTruthy();
    const names = () => screen.getAllByText(/ · 1 joy$/u).map((cell) => cell.textContent);
    await vi.waitFor(() => expect(names()).toEqual(['Aziz · 1 joy', 'Dilnoza · 1 joy']), { timeout: 5000 });
    expect(screen.getByText('Grand yaqinida, Chilonzor')).toBeTruthy();
    await vi.waitFor(() => expect(map.pins()).toHaveLength(2));
    // Nothing more than on the mockup: no tabs, no arrows of the order.
    expect(screen.queryByText('Tushirish')).toBeNull();
    expect(screen.queryByLabelText('Pastga')).toBeNull();
  });

  it('opens the meeting of a point while the meeting is open (screen 13)', async () => {
    const onPoint = vi.fn();
    open({ onPoint });
    fireEvent.click(await screen.findByText('Aziz · 1 joy'));
    expect(onPoint).toHaveBeenCalledWith(expect.objectContaining({ who: 'Aziz' }));
  });

  it('on the way keeps the points to pick up while someone waits, then where they get out', async () => {
    const onPoint = vi.fn();
    const left = { ...today, departedAt: today.departAt };
    // Aziz is in the car, Dilnoza still waits: her point opens the meeting (G77, docs/170 О1).
    open({ trip: left, onPoint, bookings: [FAR, { ...NEAR, boardedAt: today.departAt }] });
    fireEvent.click(await screen.findByText('Dilnoza · 1 joy'));
    expect(onPoint).toHaveBeenCalledWith(expect.objectContaining({ who: 'Dilnoza' }));
    cleanup();
    const inCar = (one: Booking) => ({ ...one, boardedAt: today.departAt });
    open({ trip: left, bookings: [inCar(FAR), inCar(NEAR)] });
    // Both passengers get out at the same place in the fixture: one card each.
    expect(await screen.findAllByText('Registon mahallasi, Fargʻona shahri')).toHaveLength(2);
  });

  it('opens the points in the chosen navigator and remembers it', async () => {
    open();
    await tap('Yoʻl koʻrsatish');
    // The choice opens as a sheet over the map: the points stay in their place (docs/88 L13).
    expect(await screen.findByRole('dialog')).toBeTruthy();
    // Always the sheet of the app, the choice is kept (G75, mockup g75/6 A).
    expect(screen.getByText('Tanlov eslab qolinadi. «Sozlamalar»da oʻzgartirasiz.')).toBeTruthy();
    // Apple Maps only on an iPhone: Yandex and Google here, each with its tile.
    expect(document.querySelectorAll('.navigator-row .navigator-tile')).toHaveLength(2);
    await tap('Yandex');
    expect(openExternal).toHaveBeenCalledWith(
      'https://yandex.uz/maps/?rtext=~41.36,69.3~41.29,69.21&rtt=auto',
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 2000 });
    await tap('Yoʻl koʻrsatish');
    expect(openExternal).toHaveBeenCalledTimes(2);
  });

  it('says the map did not load and draws it again; the points stay (G43, docs/65 B3)', async () => {
    const map = fakeMap(1);
    renderMarket(
      <MapEngineContext.Provider value={async () => map.engine}>
        <PlacesGate>
          <DriverTripMap
            trip={today}
            bookings={[NEAR]}
            now={Date.now()}
            onPoint={null}
            onBack={() => undefined}
          />
        </PlacesGate>
      </MapEngineContext.Provider>,
      testClients({}),
    );
    expect(await screen.findByText('Xarita yuklanmadi')).toBeTruthy();
    expect(screen.getByText('Aziz · 1 joy')).toBeTruthy();
    await tap('Xarita yuklanmadi');
    await vi.waitFor(() => expect(screen.queryByText('Xarita yuklanmadi')).toBeNull());
    expect(map.engine).toHaveBeenCalledTimes(2);
  });
});
