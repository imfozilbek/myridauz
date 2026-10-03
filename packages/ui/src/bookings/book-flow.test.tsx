import type { BookingsClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking } from './booking-test-kit';
import { BookFlow } from './book-flow';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const FARGONA_WHERE = {
  district: '1730401',
  name: { step: 'mahalla', name: 'Yangi Margʻilon' },
  area: null,
} as const;

const open = (
  pickupMode: typeof trip.pickupMode,
  calls: Parameters<typeof testMap>[0] = {},
  book = vi.fn<BookingsClient['book']>(async () => booking),
) => {
  const map = fakeMap();
  renderMarket(
    <MapEngineContext.Provider value={async () => map.engine}>
      <PlacesGate>
        <BookFlow trip={{ ...trip, pickupMode }} onBack={() => undefined} onClose={() => undefined} />
      </PlacesGate>
    </MapEngineContext.Provider>,
    testClients({ bookings: { book }, map: testMap(calls) }),
  );
  return { book, map };
};

describe('a booking keeps its answers (docs/94 F3, F8, S1)', { timeout: 20_000 }, () => {
  it('«Назад» shows the way and the point chosen before; a closed app comes back', async () => {
    open('both');
    await tap('Pitakdan');
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda');
    await screen.findByText('Qoʻyliq pitagi');
    fireEvent.click(screen.getByRole('button', { name: 'Oshirish' }));
    await tap('Orqaga');
    expect(await screen.findByText('Qayerda tushasiz?')).toBeTruthy();
    await tap('Orqaga');
    // The way has its tick: «Davom etish» keeps it, the point is kept too: the check again.
    await tap('Davom etish');
    expect(await screen.findByText('2 kishi')).toBeTruthy();
    cleanup();
    const { book } = open('both');
    expect(await screen.findByText('Qoʻyliq pitagi')).toBeTruthy();
    expect(screen.getByText('Oldingi yozganingiz tiklandi.')).toBeTruthy();
    await tap('Soʻrov yuborish');
    await screen.findByText('Soʻrov yuborildi');
    expect(book).toHaveBeenCalledWith('t1', expect.objectContaining({ mode: 'pitak', seats: 2 }));
  });
});

describe('a booking on a route the person went before (G35, docs/97 K3, K4)', { timeout: 20_000 }, () => {
  it('opens the check at once with the way of the last trip and 1 person', async () => {
    open('both');
    await tap('Uyimdan');
    await screen.findByText('Chorsu bozori yaqinida', {}, { timeout: 3000 });
    await tap('Shu yerda');
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda');
    await tap('Soʻrov yuborish');
    await screen.findByText('Soʻrov yuborildi');
    cleanup();
    const { book } = open('both');
    expect(await screen.findByText('Joy soʻrash')).toBeTruthy();
    expect(screen.getByText('1 kishi')).toBeTruthy();
    expect(screen.queryByText('Oldingi yozganingiz tiklandi.')).toBeNull();
    // «Oʻzgartirish» of the end opens its map; the point taken, the check is back.
    fireEvent.click(screen.getAllByText('Oʻzgartirish')[1] as HTMLElement);
    await screen.findByText('Qayerda tushasiz?');
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Yangi Margʻilon'));
    await tap('Shu yerda');
    await tap('Soʻrov yuborish');
    await screen.findByText('Soʻrov yuborildi');
    expect(book).toHaveBeenCalledWith('t1', expect.objectContaining({ mode: 'door', seats: 1 }));
  });
});

describe('a booking with its points (G26, docs/74)', { timeout: 20_000 }, () => {
  it('asks no point at the door for «Pitakdan» and shows the pitak in the check', async () => {
    const { book } = open('both');
    await tap('Pitakdan');
    // PS3: the end asks where the person gets off, not where the home is.
    expect(await screen.findByText('Qayerda tushasiz?')).toBeTruthy();
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByText('Qoʻyliq pitagi')).toBeTruthy();
    await tap('Soʻrov yuborish');
    await screen.findByText('Soʻrov yuborildi');
    expect(book).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ mode: 'pitak', pickup: null, seats: 1 }),
    );
  });

  it('does not ask the way of a trip that takes people only at the door', async () => {
    open('door');
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    expect(screen.queryByText('Pitakdan')).toBeNull();
  });

  it('keeps the point inside the zone: a place outside it is not taken', async () => {
    open('door', { where: async () => FARGONA_WHERE });
    expect(
      await screen.findByText('Bu joy Toshkent shahri hududida emas. Shu hududdan joy tanlang.'),
    ).toBeTruthy();
    await tap('Shu yerda');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Qayerda tushasiz?')).toBeNull();
  });
});
