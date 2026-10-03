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
  it('opens the main screen with the main button and the other actions for an approved driver', async () => {
    const { tracked } = renderApp();
    // «Yangi safar» is the main button «Safar eʼlon qilish» now, not repeated in the list (G25).
    expect(await screen.findByRole('button', { name: 'Safar eʼlon qilish' })).toBeTruthy();
    expect(screen.queryByText('Yangi safar')).toBeNull();
    for (const action of ['Yoʻlovchilar soʻrovlari', 'Mening safarlarim'])
      expect(screen.getByText(action)).toBeTruthy();
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

  it('shows a new driver the main screen with the application card (G34)', async () => {
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
    expect(await screen.findByText('Arizani toʻldiring')).toBeTruthy();
    // Publishing and requests wait for the approval, as for an application being checked.
    expect(screen.getAllByText('Tasdiqlangandan keyin')).toHaveLength(2);
    fireEvent.click(screen.getByText('Arizani toʻldiring'));
    expect(await screen.findByText('Mashina markasi')).toBeTruthy();
  });
});
