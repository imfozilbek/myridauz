import type { BookingsClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking } from './booking-test-kit';
import { BookFlow } from './book-flow';

afterEach(cleanup);

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

describe('a booking with its points (G26, docs/74)', { timeout: 20_000 }, () => {
  it('asks no point at the door for «Pitakdan» and shows the pitak in the check', async () => {
    const { book } = open('both');
    await tap('1 kishi');
    await tap('Pitakdan');
    expect(await screen.findByText('Uyingiz qayerda?')).toBeTruthy();
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByText('Qoʻyliq pitagi')).toBeTruthy();
    await tap('Soʻrov yuborish');
    await screen.findByText('Soʻrov yuborildi');
    expect(book).toHaveBeenCalledWith('t1', expect.objectContaining({ mode: 'pitak', pickup: null }));
  });

  it('does not ask the way of a trip that takes people only at the door', async () => {
    open('door');
    await tap('1 kishi');
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    expect(screen.queryByText('Pitakdan')).toBeNull();
  });

  it('keeps the point inside the zone: a place outside it is not taken', async () => {
    open('door', { where: async () => FARGONA_WHERE });
    await tap('1 kishi');
    expect(
      await screen.findByText('Bu joy Toshkent shahri hududida emas. Shu hududdan joy tanlang.'),
    ).toBeTruthy();
    await tap('Shu yerda');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Uyingiz qayerda?')).toBeNull();
  });
});
