import { renderInShell, testClients } from '@platform/ui/testing';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

afterEach(cleanup);

describe('StartPage', () => {
  it('opens the main screen with 3 actions', () => {
    const { tracked } = renderInShell(<StartPage />);
    for (const action of ['Safar topish', 'Soʻrov qoldirish', 'Mening safarlarim'])
      expect(screen.getByText(action)).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['home']);
  });

  it('opens a section and comes back', async () => {
    const clients = testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [], myOffers: async () => [] },
    });
    renderInShell(<StartPage />, false, true, undefined, clients);
    fireEvent.click(screen.getByText('Mening safarlarim'));
    expect(await screen.findByText('Hali soʻrovlaringiz yoʻq')).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(screen.getByText('Safar topish'));
    expect(await screen.findByText('Qayerdan ketasiz?')).toBeTruthy();
  });
});
