import { toCyrillic } from '@platform/i18n';
import type { MarketClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findRoute, searchMarket } from '../find/search-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { renderMarket, tap, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const plain = { ...trip, woman: false };
const pill = (name: RegExp) => screen.getByRole('button', { name });

describe('a search emptied by a filter says so (docs/89 P6)', { timeout: 20_000 }, () => {
  it('counts the trips the filters hid and turns them off in one tap', async () => {
    // «Mashinada ayol bor» is asked from the server: without it there is one trip.
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async (search) => (search.woman ? [] : [plain]));
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips } }),
    );
    await findRoute();
    expect(await screen.findByText(/^Jasur ★/u)).toBeTruthy();
    fireEvent.click(pill(/Бўш салон/u));
    expect(await screen.findByText(toCyrillic('Filtr 1 ta safarni yashirdi'))).toBeTruthy();
    fireEvent.click(pill(/Машинада аёл бор/u));
    expect(await screen.findByText(toCyrillic('Filtr 1 ta safarni yashirdi'))).toBeTruthy();
    await tap(toCyrillic('Filtrni oʻchirish'));
    expect(await screen.findByText(/^Jasur ★/u)).toBeTruthy();
    expect(pill(/Машинада аёл бор/u).getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps «Hozircha safar yoʻq» when no filter hid anything', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips: async () => [] } }),
    );
    await findRoute();
    expect(await screen.findByText(toCyrillic('Hozircha safar yoʻq'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Filtrni oʻchirish'))).toBeNull();
  });
});
