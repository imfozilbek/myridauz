import { renderInShell, testClients } from '@platform/ui/testing';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

afterEach(cleanup);

const car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  plate: '01A123BC',
  seats: 4,
} as const;
const approved = {
  status: 'approved' as const,
  car,
  photos: { front: true, side: true, interior: true },
  reasons: [],
};
const driver = testClients({
  drivers: { getApplication: async () => approved },
  market: { myTrips: async () => [] },
  bookings: { driverBookings: async () => [], driverOffers: async () => [] },
});
const renderApp = () => renderInShell(<StartPage />, false, true, undefined, driver);

describe('StartPage', () => {
  it('opens the main screen of an approved driver: four tiles and the block with two buttons (G76)', async () => {
    const { tracked } = renderApp();
    expect(await screen.findByRole('button', { name: 'Safar eʼlon qilish' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Soʻrovlarni koʻrish' })).toBeTruthy();
    for (const tile of ['Mening safarlarim', 'Suhbatlar', 'Hamyon', 'Yordam'])
      expect(screen.getByText(tile)).toBeTruthy();
    // The screen view is sent by an effect after the screen is drawn.
    await waitFor(() => expect(tracked.map((event) => event.screen)).toEqual(['home']));
  });

  it('opens a section and comes back', async () => {
    renderApp();
    fireEvent.click(await screen.findByText('Mening safarlarim'));
    expect(await screen.findByText('Hali safarlaringiz yoʻq')).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(await screen.findByRole('button', { name: 'Safar eʼlon qilish' }));
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
  });

  it('asks a new driver to fill the application in the block (G62, G76)', async () => {
    renderInShell(
      <StartPage />,
      false,
      true,
      undefined,
      testClients({
        drivers: { getApplication: async () => null },
        market: { myTrips: async () => [] },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Arizani toʻldirish' }));
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
  });
});
