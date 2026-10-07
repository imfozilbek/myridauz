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
  it('opens the main screen with the big tile and the other actions for an approved driver', async () => {
    const { tracked } = renderApp();
    // «Safar eʼlon qilish» is the big tile on top, not repeated in the grid (G62, mockup g62/1).
    expect(await screen.findByRole('button', { name: /^Safar eʼlon qilish/u })).toBeTruthy();
    expect(screen.getAllByText('Safar eʼlon qilish')).toHaveLength(1);
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
    fireEvent.click(await screen.findByRole('button', { name: /^Safar eʼlon qilish/u }));
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
  });

  it('shows a new driver the big tile «Haydovchi boʻlish» (G62)', async () => {
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
    expect(await screen.findByText('Haydovchi boʻlish')).toBeTruthy();
    // Publishing waits for the approval; the requests tile keeps its hint, pale (mockup g62/1).
    expect(screen.getAllByText('Tekshiruvdan keyin')).toHaveLength(1);
    fireEvent.click(screen.getByText('Haydovchi boʻlish'));
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
  });
});
