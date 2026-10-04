import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { offer, request } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { recommendation, renderMarket, tap } from './market-test-kit';
import { RequestsSearchFlow } from './requests-search-flow';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const other = { ...request, id: 'r2', passenger: { ...request.passenger, firstName: 'Malika' } };

describe('the requests a driver already answered (G41, docs/90 F-D1)', { timeout: 20_000 }, () => {
  it('goes down with «Taklif yuborildi» and asks no second offer', async () => {
    renderMarket(
      <RequestsSearchFlow onBack={() => undefined} />,
      testClients({
        market: { searchRequests: async () => [request, other], recommend: async () => recommendation },
        bookings: { driverOffers: async () => [offer] },
      }),
    );
    for (const step of ['Qayerdan', 'Toshkent shahri', 'Chilonzor', 'Fargʻona viloyati', 'Fargʻona shahri'])
      await tap(step);
    const answered = await screen.findByText('Dilnoza');
    expect(screen.getByText('Malika').compareDocumentPosition(answered) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText('Taklif yuborildi')).toHaveLength(1);
    // How each passenger wants to be taken, from the third person (F-D5).
    expect(screen.getAllByText('Uyidan yoki pitakdan')).toHaveLength(2);
    await tap('Dilnoza');
    // The request opens without the main button «Taklif yuborish».
    expect(await screen.findByText('Bir joy narxi')).toBeTruthy();
    expect(screen.queryByText('Taklif yuborish')).toBeNull();
  });
});
