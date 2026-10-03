import type { BookingsClient } from '@platform/api-client';
import { DAY_MS, tashkentDate, type RideRequest } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { recommendation, renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { RequestsSearchFlow } from '../market/requests-search-flow';
import { testClients } from '../test-shell';
import { offer } from './booking-test-kit';
import { OfferFlow } from './offer-flow';

afterEach(cleanup);

const TIME = 'Soat nechada joʻnaysiz?';
const request: RideRequest = {
  id: 'r1',
  passenger: { id: '00000000000000000000000000000009', firstName: 'Dilnoza', hasAvatar: false },
  from: '1726269',
  to: '1730401',
  date: tashkentDate(Date.now() + DAY_MS),
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open',
  pickupMode: 'both',
};

describe('an offer keeps its answers (docs/94 F8, F9)', { timeout: 20_000 }, () => {
  it('«Назад» shows the time and the price chosen before; the sent offer has «Назад»', async () => {
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    const onClose = vi.fn();
    renderMarket(
      <PlacesGate>
        <OfferFlow request={request} onBack={() => undefined} onClose={onClose} />
      </PlacesGate>,
      testClients({ market: { recommend: async () => recommendation }, bookings: { sendOffer } }),
    );
    fireEvent.change(await screen.findByLabelText(TIME), { target: { value: '10:30' } });
    await tap('Davom etish');
    fireEvent.click(await screen.findByLabelText('Oshirish'));
    await tap('Davom etish');
    await tap('Orqaga');
    expect(await screen.findByText(/^100\s000/u)).toBeTruthy();
    await tap('Orqaga');
    expect(((await screen.findByLabelText(TIME)) as HTMLInputElement).value).toBe('10:30');
    await tap('Davom etish');
    await tap('Davom etish');
    await tap('Taklif yuborish');
    expect(sendOffer.mock.calls[0]?.[1]).toMatchObject({ price: 100000 });
    await screen.findByText('Taklif yuborildi');
    await tap('Orqaga');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('starts the price at the one the passenger asked for (G40, docs/106 K5)', async () => {
    renderMarket(
      <PlacesGate>
        <OfferFlow request={{ ...request, price: 110_000 }} onBack={() => undefined} onClose={() => undefined} />
      </PlacesGate>,
      testClients({ market: { recommend: async () => recommendation } }),
    );
    fireEvent.change(await screen.findByLabelText(TIME), { target: { value: '10:30' } });
    await tap('Davom etish');
    expect(await screen.findByText(/^110\s000/u)).toBeTruthy();
  });

  it('the search of requests keeps its route when the person goes back from the day', async () => {
    renderMarket(<RequestsSearchFlow onBack={() => undefined} />, testClients({}));
    // Both ends chosen, the day opens at once (G40, docs/106 K1).
    for (const step of ['Qayerdan', 'Toshkent shahri', 'Chilonzor', 'Fargʻona viloyati', 'Fargʻona shahri'])
      await tap(step);
    await screen.findByText(/^Ertaga/);
    await tap('Orqaga');
    expect(await screen.findByText('Chilonzor')).toBeTruthy();
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
  });
});
