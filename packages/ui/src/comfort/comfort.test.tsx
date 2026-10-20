import { ApiError, type ComfortClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, trip } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FavoriteSwitch } from '../feedback/favorite-switch';
import { FavoritesScreen } from './favorites-screen';

afterEach(cleanup);

const DRIVER = { ...trip.driver, car: trip.driver.car };
// The switch of the review, once the saved drivers came.
async function favorite() {
  const box = (await screen.findByLabelText('Sevimli haydovchi')) as HTMLInputElement;
  await vi.waitFor(() => expect(box.disabled).toBe(false));
  return box;
}
describe('"Sevimli haydovchilar" (docs/18)', () => {
  it('saves the driver of a trip and says the bot will tell about new trips', async () => {
    const save = vi.fn<ComfortClient['save']>(async () => undefined);
    const forget = vi.fn<ComfortClient['forget']>(async () => undefined);
    // «Sevimli haydovchi» of the review (mockup g60/5) is the one way to save a driver (G77).
    const { tracked } = renderMarket(
      <FavoriteSwitch driverId={'00000000000000000000000000000007'} />,
      testClients({ comfort: { favorites: async () => ({ drivers: [], trips: [] }), save, forget } }),
    );
    fireEvent.click(await favorite());
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith('00000000000000000000000000000007'));
    expect(await screen.findByText('Uning yangi safarlari haqida xabar beramiz.')).toBeTruthy();
    expect(tracked.map((event) => event.name)).toContain('favorite_driver');
    fireEvent.click(await favorite());
    await vi.waitFor(() => expect(forget).toHaveBeenCalledWith('00000000000000000000000000000007'));
  });

  it('says why the 51st driver is not saved (docs/86 T3)', async () => {
    const save = vi.fn<ComfortClient['save']>(async () => {
      throw new ApiError(409, 'favorites.too_many');
    });
    renderMarket(
      <FavoriteSwitch driverId={'00000000000000000000000000000007'} />,
      testClients({ comfort: { favorites: async () => ({ drivers: [], trips: [] }), save } }),
    );
    fireEvent.click(await favorite());
    expect(await screen.findByText(/^Saqlangan haydovchilar soni chegaraga yetdi/)).toBeTruthy();
  });

  it('lists the saved drivers with their trips, or says how to save one', async () => {
    renderMarket(
      <FavoritesScreen onBack={() => undefined} />,
      testClients({ comfort: { favorites: async () => ({ drivers: [DRIVER], trips: [trip] }) } }),
    );
    expect(await screen.findByText('Sevimli haydovchilar')).toBeTruthy();
    expect(screen.getByText('Jasur')).toBeTruthy();
    // Their trips are the cards of «Safarlar» (G78 sheet 2).
    expect(document.querySelectorAll('.search-trips .search-trip')).toHaveLength(1);
    cleanup();
    renderMarket(
      <FavoritesScreen onBack={() => undefined} />,
      testClients({ comfort: { favorites: async () => ({ drivers: [], trips: [] }) } }),
    );
    expect(await screen.findByText('Hali sevimli haydovchi yoʻq')).toBeTruthy();
    // How to save one: at the rating after the trip (G91 text 8, owner 20.10.2026).
    expect(screen.getByText('Safar tugagach, baho berishda haydovchini sevimlilarga qoʻshing.')).toBeTruthy();
  });

  // G91 PAS-4 (decision 4, text 7): a saved driver opens a sheet that takes him out.
  it('takes a driver out of the saved ones from his sheet', async () => {
    const forget = vi.fn<ComfortClient['forget']>(async () => undefined);
    const favorites = vi
      .fn<ComfortClient['favorites']>()
      .mockResolvedValueOnce({ drivers: [DRIVER], trips: [] })
      .mockResolvedValue({ drivers: [], trips: [] });
    renderMarket(
      <FavoritesScreen onBack={() => undefined} />,
      testClients({ comfort: { favorites, forget } }),
    );
    fireEvent.click(await screen.findByText('Jasur'));
    fireEvent.click(await screen.findByText('Sevimlilardan olib tashlash'));
    await vi.waitFor(() => expect(forget).toHaveBeenCalledWith(DRIVER.id));
    expect(await screen.findByText('Hali sevimli haydovchi yoʻq')).toBeTruthy();
  });
});
