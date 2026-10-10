import { ApiError, type ComfortClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FavoriteCell } from './favorite-cell';
import { FavoritesScreen } from './favorites-screen';

afterEach(cleanup);

const DRIVER = { ...trip.driver, car: trip.driver.car };
describe('"Sevimli haydovchilar" (docs/18)', () => {
  it('saves the driver of a trip and says the bot will tell about new trips', async () => {
    const save = vi.fn<ComfortClient['save']>(async () => undefined);
    const forget = vi.fn<ComfortClient['forget']>(async () => undefined);
    const { tracked } = renderMarket(
      <FavoriteCell driverId={'00000000000000000000000000000007'} screen="market.trip" />,
      testClients({ comfort: { favorites: async () => ({ drivers: [], trips: [] }), save, forget } }),
    );
    await tap('Sevimli haydovchilarga qoʻshish');
    expect(save).toHaveBeenCalledWith('00000000000000000000000000000007');
    expect(await screen.findByText('Uning yangi safarlari haqida xabar beramiz.')).toBeTruthy();
    expect(tracked.map((event) => event.name)).toContain('favorite_driver');
    await tap('Sevimlilardan olib tashlash');
    expect(forget).toHaveBeenCalledWith('00000000000000000000000000000007');
  });

  it('says why the 51st driver is not saved (docs/86 T3)', async () => {
    const save = vi.fn<ComfortClient['save']>(async () => {
      throw new ApiError(409, 'favorites.too_many');
    });
    renderMarket(
      <FavoriteCell driverId={'00000000000000000000000000000007'} screen="market.trip" />,
      testClients({ comfort: { favorites: async () => ({ drivers: [], trips: [] }), save } }),
    );
    await tap('Sevimli haydovchilarga qoʻshish');
    expect(await screen.findByText(/^Saqlangan haydovchilar soni chegaraga yetdi/)).toBeTruthy();
  });

  it('lists the saved drivers with their trips, or says how to save one', async () => {
    renderMarket(
      <FavoritesScreen onBack={() => undefined} />,
      testClients({ comfort: { favorites: async () => ({ drivers: [DRIVER], trips: [trip] }) } }),
    );
    expect(await screen.findByText('Sevimli haydovchilar')).toBeTruthy();
    expect(screen.getAllByText('Jasur').length).toBeGreaterThan(1);
    expect(screen.getByText('Katta yuk olmayman')).toBeTruthy();
    cleanup();
    renderMarket(
      <FavoritesScreen onBack={() => undefined} />,
      testClients({ comfort: { favorites: async () => ({ drivers: [], trips: [] }) } }),
    );
    expect(await screen.findByText('Hali sevimli haydovchi yoʻq')).toBeTruthy();
  });
});
